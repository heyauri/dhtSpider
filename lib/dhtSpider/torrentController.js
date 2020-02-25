const net = require('net');
const events = require('events');
const fs = require('fs');
const path = require('path');
const bencode = require('bencode');

const Wire = require('./wire');
const utils = require('../utils');
const Leveldb = require("../database/levelOperate");
const config = require('../../config');

let processData = {
    fetchNumber: 0,
    successNumber: 0
};


let db = new Leveldb();

class TorrentController {
    constructor() {
        this.insertAvailable = true;
        this.saveAvailable = true;
        this.dispatchStatus = false;
        this.intervalId = 0;
        this.requestQueue = [];
        this.torrentQueue = [];
        this.currentQueue = [];
    }

    /**Insert the target to matadata fetch queue
     * @param rinfo
     * @param infoHash
     * @param peerId
     */

    queueInsert(rinfo, infoHash, peerId) {
        let _this = this;
        let infoHashStr = infoHash.toString("hex");
        db.getInfoHashQueryTimes(infoHashStr).then(function (val) {
            //repeated torrents
            db.updateInfohash({infoHash: infoHashStr}).catch(e=>{});
        }).catch(function (err) {
            if (err === "NotFoundError" || !err) {
                //new torrnets
                if (_this.requestQueue.length < 7500) {
                    _this.requestQueue.push({
                        rinfo: rinfo,
                        infoHash: infoHash,
                        infoHashStr: infoHashStr
                    });
                }
            }
        });
    }

    dispatch() {
        if (!this.dispatchStatus) {
            let _this = this;
            _this.insertAvailable = true;
            _this.dispatchStatus = true;
            _this.saveAvailable = true;
            this.intervalId = setInterval(function () {
                while (_this.currentQueue.length < config.maxRequestLength && _this.requestQueue.length > 0) {
                    let target = _this.requestQueue.shift();
                    _this.currentQueue.push(target);
                    _this.fetch(target);
                }
            }, 2000);
            this.saveTorrentId = setInterval(function () {
                if (_this.saveAvailable && _this.torrentQueue.length) {
                    let obj = _this.torrentQueue.shift();
                    _this.saveMetadata(obj.infoHashStr, obj.metadata);
                }
            }, 80);
            this.logId = setInterval(function () {
                console.log("Metadata fetch times:" + processData.fetchNumber);
                console.log("requestQueue Length:" + _this.requestQueue.length);
                console.log("currentQueue Length:" + _this.currentQueue.length);
                console.log("torrentQueue Length:" + _this.torrentQueue.length);
                console.log("Metadata fetch successfully times:" + processData.successNumber);
            }, 60000);
        }
    }

    stop() {
        clearInterval(this.intervalId);
        clearInterval(this.saveTorrentId);
        clearInterval(this.logId);
        this.insertAvailable = false;
        this.saveAvailable = false;
        this.dispatchStatus = false;
        this.requestQueue = [];
        console.log("interval Stop");
    }

    fetch(target) {
        processData.fetchNumber++;
        let socket = new net.Socket();
        let _this = this;
        let rinfo = target.rinfo;
        let infoHash = target.infoHash;

        socket.setTimeout(config.downloadMaxTime || 5000);
        socket.connect(rinfo.port, rinfo.address, function () {
            let wire = new Wire(infoHash);
            socket.pipe(wire).pipe(socket);
            wire.on('metadata', function (metadata, infoHash) {
                if (_this.insertAvailable) {
                    _this.torrentQueue.push({
                        infoHashStr: infoHash.toString("hex"),
                        metadata: metadata
                    });
                }
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
    }

    saveMetadata(infoHash, metadata) {
        let _this = this;
        let data = utils.metadataWrapper(infoHash, metadata);
        if (data) {
            _this.saveAvailable = false;
            db.updateInfohash(data).then(function (msg) {
                if (msg === "success") {
                    processData.successNumber++;
                }
                _this.saveAvailable = true;
            }).catch(err => {
                console.log(err);
                _this.saveAvailable = true;
            });
        }
    }


    saveTorrent(infoHash, metadata, rinfo) {
        if (!fs.existsSync(process.cwd() + '/torrents/')) {
            console.log("Creating torrents directory.");
            fs.mkdirSync(process.cwd() + '/torrents/');
        }
        let torrentFilePathSaveTo = path.join(__dirname, "torrents", infoHash + ".torrent");
        fs.writeFile(torrentFilePathSaveTo, bencode.encode({'info': metadata.info}), function (err) {
            if (err) {
                return console.error(err);
            }
            console.log(infoHash + ".torrent has saved.");
        });
    }

}

module.exports = TorrentController;