
const net=require('net');
const events=require('events');

const config=require('./config');

class TorrentController{
    constructor(){
        events.call(this);
        this.currentConnection=0;
    }

    insertQueue(infoHash){

    }

    download(){
        this.currentConnection++;
        let actionStatus=false;

        let socket=new net.Socket();
        socket.setTimeout(config.downloadMaxTime||10000);

        socket.on('error', function(err) {
            socket.destroy();
        }.bind(this));

        socket.on('timeout', function(err) {
            socket.destroy();
        }.bind(this));

        socket.once('close', function() {
            this.currentConnection--;
            //this._next(infohash, successful);
        }.bind(this));
    }
}

module.exports=TorrentController;