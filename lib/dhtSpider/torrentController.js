const net = require('net');
const events = require('events');
const fs = require('fs');
const path = require('path');
const bencode = require('bencode');
const lzString=require("lz-string");

const Wire = require('./wire');
const utils=require('../utils');
const Leveldb=require("../database/levelOperate");
const config = require('../../config');

let processData = {
    fetchNumber: 0,
    successNumber:0
};

let db=new Leveldb();

class TorrentController {
    constructor() {
        this.intervalId=0;
        this.currentTarget = {};
        this.requestQueue = [];
        this.currentQueue = [];
        if (!fs.existsSync(process.cwd() + '/torrents/')) {
            console.log("Creating torrents directory.");
            fs.mkdirSync(process.cwd() + '/torrents/');
        }
    }

    /**Insert the target to matadata fetch queue
     * @param rinfo
     * @param infoHash
     * @param peerId
     */

    queueInsert(rinfo, infoHash, peerId) {
        let _this=this;
        let infoHashStr=infoHash.toString("hex");
        db.getInfoHashQueryTimes(infoHashStr).then(function(val){
            //repeated torrents
            db.updateInfohash({infoHash:infoHashStr});
        },function(err){
            if(err==="NotFoundError"||!err){
                //new torrnets
                _this.requestQueue.push({
                    rinfo: rinfo,
                    infoHash: infoHash,
                    peerId: peerId,
                    infoHashStr: infoHashStr
                });
            }
        });
    }

    dispatch() {
        let _this = this;
        this.intervalId=setInterval(function () {
            while (_this.currentQueue.length < config.maxRequestLength && _this.requestQueue.length > 0) {
                let target = _this.requestQueue.shift();
                _this.currentQueue.push(target);
                _this.fetch(target);
            }
        }, 3000);
        this.logId=setInterval(function () {
            console.log("Metadata fetch times:" + processData.fetchNumber);
            console.log("requestQueue Length:" +_this.requestQueue.length);
            console.log("requestQueue Length:" +_this.currentQueue.length);
            console.log("Metadata fetch successfully times:" + processData.successNumber);
        }, 60000);
    }

    stop(){
        clearInterval(this.intervalId);
        clearInterval(this.logId);
        console.log("interval Stop");
    }

    fetch(target) {
        processData.fetchNumber++;
        //console.log("metadata fetching...");
        let successful = false;
        let socket = new net.Socket();
        let _this=this;
        let rinfo = target.rinfo;
        let infoHash = target.infoHash;

        socket.setTimeout(config.downloadMaxTime || 5000);
        socket.connect(rinfo.port, rinfo.address, function () {
            let wire = new Wire(infoHash);
            socket.pipe(wire).pipe(socket);
            wire.on('metadata', function (metadata, infoHash) {
                successful = true;
                _this.saveMetadata(infoHash.toString("hex"), metadata, rinfo);
                socket.destroy();
            });

            wire.on('fail', function () {
                socket.destroy();
            });

            wire.sendHandshake();
        });

        socket.on('error', function (err) {
            //console.log(err);
            socket.destroy();
        });

        socket.on('timeout', function (err) {
            //console.log("time out"+err);
            socket.destroy();
        });

        socket.once('close', function () {
            _this.fetchFinish(target);
        });
    }

    fetchFinish(target) {
        let nodeNum = 0;
        for (let i = 0; i < this.currentQueue.length; i++) {
            if (this.currentQueue[i].infoHashStr === target.infoHashStr) {
                nodeNum = i;
                break;
            }
        }
        this.currentQueue.splice(nodeNum, 1);
        this.currentTarget = {};
    }

    saveMetadata(infoHash, metadata, rinfo) {
        let data=utils.metadataWrapper(infoHash,metadata);
        if(data){
            db.insertMetadata(infoHash,data.info).then(function(msg){
                if(msg==="success"){
                    processData.successNumber++;
                    db.updateInfohash(data);
                }
            });
        }
    }



    saveTorrent(infoHash, metadata, rinfo) {
        let torrentFilePathSaveTo = path.join(__dirname, "torrents", infoHash + ".torrent");
        fs.writeFile(torrentFilePathSaveTo, bencode.encode({'info': metadata.info}), function (err) {
            if (err) {
                return console.error(err);
            }
            console.log(infoHash + ".torrent has saved.");
        });
    }

    exportTorrent(infoHash){
        db.getMetadata(infoHash).then(function(val){
            let metadata=JSON.parse(val);
            metadata.info=utils.bufferRecover(metadata.info);
            let torrentFilePathSaveTo = path.join(__dirname, "torrents", infoHash + ".torrent");
            fs.writeFile(torrentFilePathSaveTo, bencode.encode({'info': metadata.info}), function (err) {
                if (err) {
                    return console.error(err);
                }
                console.log(infoHash + ".torrent has saved.");
            });
        });
    }
}

module.exports = TorrentController;