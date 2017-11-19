const net = require('net');
const events = require('events');
const Protocol = require('bittorrent-protocol');
const ut_metadata = require('ut_metadata');
const Wire = require('./wire');

const config = require('../config');


class TorrentController {
    constructor() {
        this.currentTarget={};
        this.requestQueue=[];
        this.currentQueue=[];
        this.dispatch();
    }

    queueInsert(rinfo,infoHash,peerId) {
        this.requestQueue.push({rinfo:rinfo,infoHash:infoHash,peerId:peerId});
    }

    dispatch(){
        let _this=this;
        setInterval(function(){
            while(_this.currentQueue.length<config.maxRequestLength&&_this.requestQueue.length>0){
                let target=_this.requestQueue.shift();
                _this.currentQueue.push(target);
                _this.fetch(target);
            }
        },1000);
    }

    fetch(target) {
        console.log("start fetch :"+target.infoHash);
        let successful = false;
        let socket = new net.Socket();

        let rinfo=target.rinfo;
        let infoHash=new Buffer(target.infoHash);

        socket.setTimeout(config.downloadMaxTime || 5000);
        socket.connect(rinfo.port, rinfo.address, function() {
            let wire = new Wire(infoHash);
            socket.pipe(wire).pipe(socket);

            wire.on('metadata', function(metadata, infoHash) {
                console.log("meta fetch successfully");
                console.log(metadata);
                successful = true;
                this.emit('complete', metadata, infoHash, rinfo);
                socket.destroy();
            }.bind(this));

            wire.on('fail', function() {
                console.log("meta fetch failed");
                socket.destroy();
            }.bind(this));

            wire.sendHandshake();
        }.bind(this));

        socket.on('error', function(err) {
            console.log("meta fetch failed:"+err);
            socket.destroy();
        }.bind(this));

        socket.on('timeout', function(err) {
            console.log("meta fetch failed: Timeout");
            socket.destroy();
        }.bind(this));

        socket.once('close', function() {
            this.fetchFinish(target);
        }.bind(this));
    }

    fetchFinish(target){
        let nodeNum=0;
        for(let i=0;i<this.currentQueue.length;i++){
            if(this.currentQueue[i].infoHash===target.infoHash){
                nodeNum=i;
                break;
            }
        }
        this.currentQueue.splice(nodeNum,1);
        this.currentTarget={};
        //this.next();
    }

    next(){
        if(!this.currentTarget['infoHash']){
            this.currentTarget=this.currentQueue[0];
            this.fetch(this.currentTarget);
        }
    }
}

module.exports = TorrentController;