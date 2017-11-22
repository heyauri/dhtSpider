const net = require('net');
const events = require('events');
const fs = require('fs');
const path = require('path');
const bencode=require('bencode');

const Wire = require('./lib/wire');
const config = require('./config');

let processData={
    fetchNumber:0
};

class TorrentController {
    constructor() {
        this.currentTarget={};
        this.requestQueue=[];
        this.currentQueue=[];
        if(!fs.existsSync(__dirname+'/torrents/')) {
            console.log("Creating torrents directory.");
            fs.mkdirSync(__dirname+'/torrents/');
        }
        this.dispatch();
    }

    queueInsert(rinfo,infoHash,peerId) {
        this.requestQueue.push({rinfo:rinfo,infoHash:infoHash,peerId:peerId,infoHashStr:infoHash.toString('hex')});
    }

    dispatch(){
        let _this=this;
        setInterval(function(){
            console.log("Metadata fetch times:"+processData.fetchNumber);
            while(_this.currentQueue.length<config.maxRequestLength&&_this.requestQueue.length>0){
                let target=_this.requestQueue.shift();
                _this.currentQueue.push(target);
                _this.fetch(target);
            }
        },5000);
    }

    /*fetch(target) {
        console.log("start fetch :"+target.infoHash);
        net.createServer(function (socket) {
            let wire = new Protocol();
            socket.pipe(wire).pipe(socket);

            // initialize the extension
            wire.use(ut_metadata());

            // all `ut_metadata` functionality can now be accessed at wire.ut_metadata

            // ask the peer to send us metadata
            wire.ut_metadata.fetch();

            // 'metadata' event will fire when the metadata arrives and is verified to be correct!
            wire.ut_metadata.on('metadata', function (metadata) {
                // got metadata!

                // Note: the event will not fire if the peer does not support ut_metadata, if they
                // don't have metadata yet either, if they repeatedly send invalid data, or if they
                // simply don't respond.
            });

            // optionally, listen to the 'warning' event if you want to know that metadata is
            // probably not going to arrive for one of the above reasons.
            wire.ut_metadata.on('warning', function (err) {
                console.log(err.message)
            })

            // handle handshake
            wire.on('handshake', function (infoHash, peerId) {
                // receive a handshake (infoHash and peerId are hex strings)
                wire.handshake(new Buffer('my info hash'), new Buffer('my peer id'))
            })

        }).listen(6881)
    }*/


    fetch(target) {
        processData.fetchNumber++;
        let successful = false;
        let socket = new net.Socket();

        let rinfo=target.rinfo;
        let infoHash=target.infoHash;

        socket.setTimeout(config.downloadMaxTime || 5000);
        socket.connect(rinfo.port, rinfo.address, function() {
            let wire = new Wire(infoHash);
            socket.pipe(wire).pipe(socket);

            wire.on('metadata', function(metadata, infoHash) {
                console.log("meta fetch successfully");
                console.log(metadata);
                successful = true;
                this.saveTorrent(metadata, infoHash.toString("hex"), rinfo);
                socket.destroy();
            }.bind(this));

            wire.on('fail', function() {
                socket.destroy();
            }.bind(this));

            wire.sendHandshake();
        }.bind(this));

        socket.on('error', function(err) {
            socket.destroy();
        }.bind(this));

        socket.on('timeout', function(err) {
            socket.destroy();
        }.bind(this));

        socket.once('close', function() {
            this.fetchFinish(target);
        }.bind(this));
    }

    fetchFinish(target){
        let nodeNum=0;
        for(let i=0;i<this.currentQueue.length;i++){
            if(this.currentQueue[i].infoHashStr===target.infoHashStr){
                nodeNum=i;
                break;
            }
        }
        this.currentQueue.splice(nodeNum,1);
        this.currentTarget={};
    }

    next(){
        if(!this.currentTarget['infoHash']){
            this.currentTarget=this.currentQueue[0];
            this.fetch(this.currentTarget);
        }
    }

    saveTorrent(metadata,infoHash,rinfo){
        let torrentFilePathSaveTo = path.join(__dirname, "torrents", infoHash + ".torrent");
        console.log(metadata.info.name.toString());
        if(Object.prototype.toString.call(metadata.info.files)==="[object Array]"){
            console.log(metadata.info.files[0]);
            console.log("files[0].path.toString:"+metadata.info.files[0]['path'].toString());
        }
        fs.writeFile(torrentFilePathSaveTo, bencode.encode({'info': metadata.info}), function(err) {
            if (err) {
                return console.error(err);
            }
            console.log(infoHash + ".torrent has saved.");
        });
    }
}

module.exports = TorrentController;