const net = require('net');
const events = require('events');
const fs = require('fs');
const path = require('path');
const bencode = require('bencode');

const Wire = require('./wire');
const utils=require('./utils');
const Leveldb=require("./database/levelOperate");
const config = require('../config');

let processData = {
    fetchNumber: 0,
    successNumber:0
};

let db=new Leveldb();

class TorrentController {
    constructor() {
        this.currentTarget = {};
        this.requestQueue = [];
        this.currentQueue = [];
        if (!fs.existsSync(__dirname + '/torrents/')) {
            console.log("Creating torrents directory.");
            fs.mkdirSync(__dirname + '/torrents/');
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
            db.updateInfohash(infoHashStr);
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
        setInterval(function () {
            while (_this.currentQueue.length < config.maxRequestLength && _this.requestQueue.length > 0) {
                let target = _this.requestQueue.shift();
                _this.currentQueue.push(target);
                _this.fetch(target);
            }
        }, 5000);
        setInterval(function () {
            console.log("Metadata fetch times:" + processData.fetchNumber);
            console.log("Metadata fetch successfully times:" + processData.successNumber);
        }, 60000);
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
            console.log(err);
            socket.destroy();
        });

        socket.on('timeout', function (err) {
            console.log("time out"+err);
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
        let data=utils.metadataWrapper(infoHash,metadata,rinfo);
        console.log(data,metadata.info.name);
        if(data){
            db.insertMetadata(infoHash,data).then(function(msg){
                console.log("metadata save successfully");
                processData.successNumber++;
                if(msg==="success"){
                    db.updateInfohash(infoHash.toString("hex"));
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