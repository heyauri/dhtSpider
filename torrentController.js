const net = require('net');
const events = require('events');
const fs = require('fs');
const path = require('path');
const bencode = require('bencode');

const Wire = require('./lib/wire');
const utils=require('./lib/utils');
const Leveldb=require("./lib/database/levelOperate");
const config = require('./config');

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
            db.updateInfohash(infoHashStr);
        },function(err){
            if(err==="NotFoundError"||!err){
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

        let rinfo = target.rinfo;
        let infoHash = target.infoHash;

        socket.setTimeout(config.downloadMaxTime || 5000);
        socket.connect(rinfo.port, rinfo.address, function () {
            let wire = new Wire(infoHash);
            socket.pipe(wire).pipe(socket);

            wire.on('metadata', function (metadata, infoHash) {
                successful = true;
                this.saveMetadata(infoHash.toString("hex"), metadata, rinfo).then(function(msg){
                    console.log("metadata save successfully");
                    processData.successNumber++;
                    if(msg==="success"){
                        db.updateInfohash(infoHash.toString("hex"));
                    }
                });
                socket.destroy();
            }.bind(this));

            wire.on('fail', function () {
                socket.destroy();
            }.bind(this));

            wire.sendHandshake();
        }.bind(this));

        socket.on('error', function (err) {
            socket.destroy();
        }.bind(this));

        socket.on('timeout', function (err) {
            socket.destroy();
        }.bind(this));

        socket.once('close', function () {
            this.fetchFinish(target);
        }.bind(this));
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
        let data=this.metadataWrapper(infoHash,metadata,rinfo);
        return db.insertMetadata(infoHash,data);
    }

    metadataWrapper(infoHash,metadata,rinfo){
        let torrentType = "single";
        if (Object.prototype.toString.call(metadata.info.files) === "[object Array]") {
            torrentType="multiple"
        }
        if(!metadata.info.name){
            metadata.info.name="???";
        }
        return {
            infoHash:infoHash,
            name:metadata.info.name.toString(),
            info:metadata.info,
            torrentType:torrentType,
            rinfo:rinfo
        };
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