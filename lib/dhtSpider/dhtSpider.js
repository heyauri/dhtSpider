
const dgram=require('dgram');
const crypto=require('crypto');
const bencode=require('bencode');
//utils
const utils=require('../utils');
//config
const config=require('../../config');

//kTable
const KTable=require('./kTable');

let requestData={
    totalSend:0,
    totalReceive:0,
    ping:0,
    findNode:0,
    getPeers:0,
    announcePeers:0,
    runRound:0
};

let temp_receive_total=0;

class DhtSpider{
    constructor(address,port,torrentController){
        this.address=address;
        this.port=port;
        this.torrentController=torrentController||{};
        this.id=utils.getRandomId();

        this.kTable=new KTable();
        this.nodeList=this.kTable.getNodeList();
        this.requestData=requestData;
        this.startListening();
    }

    init(){
        if(!this.status){
            this.status=true;
            if(this.nodeList.length===0){
                this.joinDhtNetwork();
            }
            else {
                this.findNodeList();
            }
            this.dhtSniff();
            this.logId=setInterval(()=>{
                requestData.runRound++;
                let requestStr='';
                for(let key in requestData){
                    requestStr=requestStr+key+':'+requestData[key]+'  '
                }
                console.log('current nodeList length:' + this.nodeList.length);
                console.log('total run time:'+process.uptime()+'s','requestData:'+requestStr);
                temp_receive_total=requestData.totalReceive;
            },10000);
        }
    }

    stopInterval(){
        clearInterval(this.intervalId);
        clearInterval(this.logId);
        this.status=false;
        this.udp.close();
    }

    startListening(){
        this.udp=dgram.createSocket('udp4');
        this.udp.on('message',(msg,rinfo)=>{
            if(requestData.totalReceive-temp_receive_total<40000){
                this.onMessage(msg,rinfo)
            }
        });
        this.status=false;

        this.udp.once('listening',()=>{
            this.init();
        });

        this.udp.on('error', (err) => {
            console.log(`server error:\n${err.stack}`);
        });


        if(this.address){
            this.udp.bind(this.port,this.address)
        }
        else{
            this.udp.bind(this.port);
        }

    }

    dhtSniff(){
        let _this=this;
        this.intervalId=setInterval(function(){
            if(_this.nodeList.length===0){
                return _this.joinDhtNetwork();
            }
            else{
                _this.findNodeList();
            }
        }.bind(this),config.intervalTime);
    }

    joinDhtNetwork(){
        let nodes=config.bootstrapNodes;
        nodes.forEach((node)=>{
            this.findNode(node)
        });
    }

    onMessage(message,rinfo){
        requestData.totalReceive++;
        let msg={};
        let y,q;
        try{
            msg=bencode.decode(message);
        }
        catch(e){
            //console.log('decode failed');
            return ;
        }
        if(!msg){
            return ;
        }
        if(msg.y){
            y=msg.y.toString();
        }

        if(!msg.t){
            return //console.log("t is empty");
        }

        if(!y||y.length!==1){
            return //console.log('y is required');
        }
        //error
        if(y==='e'){
            return //console.log('an error occurred');
        }
        //query
        if(y==='q'){
            if (!msg.a) {
                return console.log('a is required!');
            }
            if (!msg.a.id || msg.a.id.length !== 20) {
                return console.log('id is required!');
            }
            if (msg.q) {
                q = msg.q.toString();
            } else {
                return ;
            }
            let qValid=true;
            switch (q) {
                case 'ping':
                    this.onPing(msg, rinfo);
                    break;
                case 'find_node':
                    this.onFindNode(msg, rinfo);
                    break;
                case 'get_peers':
                    this.onGetPeers(msg, rinfo);
                    break;
                case 'annouce_peer':
                    this.onAnnouncePeer(msg, rinfo);
                    break;
                default:
                    //console.log('q is unknown');
                    qValid=false;
            }
            if(qValid){
                this.kTable.nodeListRefresh(rinfo.address);
            }
        }

        //response
        if (y === 'r') {
            let nodes;
            if (msg.r.nodes) {
                nodes = utils.decodeNodes(msg.r.nodes);
            } else {
                return ;
            }

            let len = nodes.length;
            if (len&&len !== 0) {
                for (let i = 0; i < len; i++) {
                    //将node加入路由表
                    let node = nodes[i];
                    if (node.port < 1 || node.port > 65535) {
                        console.log('port is invalid');
                        continue;
                    }

                    this.kTable.insert({
                        nid: node.nid,
                        address: node.address,
                        port: node.port,
                        updateTime:new Date().getTime()
                    })
                }
            }

        }
    }

    findNodeList(){
        this.nodeList.forEach((node)=>{
            this.findNode(node,node.nid);
        })
    }

    findNode(node,nid){
        let id=nid!==undefined?utils.getNeighborId(nid,this.id):this.id;
        let message= {
            t: crypto.randomBytes(2),
            y: 'q',
            q: 'find_node',
            a: {
                id,
                target: utils.getRandomId()
            }
        };
        this.request(message, node);
    }

    request(message,target){
        requestData.totalSend++;
        let address=target.address;
        let port=target.port;
        let packet=bencode.encode(message);
        this.udp.send(packet,0,packet.length,port,address);
    }

    response(r,t,rinfo){
        let packet=bencode.encode({
            r,t,y:'r'
        });
        let port=rinfo.port;
        let address=rinfo.address;
        if(port<1||port>65535){
            return
        }

        this.udp.send(packet,0,packet.length,port,address);
    }

    onPing(msg,rinfo){
        let r={
            id:this.id
        };
        requestData.ping++;
        this.response(r,msg.t,rinfo);
    }

    onFindNode(msg,rinfo){
        let target=msg.a['target'];
        if(this.nodeList.length){
            let r={
                id:this.id,
                nodes:this.kTable.findClosestNodes(target)
            };
            requestData.findNode++;
            this.response(r,msg.t,rinfo);
        }
    }


    onGetPeers(msg,rinfo){
        let infoHash='';
        if (msg.a && msg.a.info_hash && msg.a.info_hash.length === 20) {
            infoHash = msg.a.info_hash;
            requestData.getPeers++;
            this.torrentController.queueInsert(rinfo,infoHash,msg.a.id);
        } else {
            return ;
        }

        let  r = {
            id: utils.getNeighborId(infoHash, this.id),
            token: crypto.randomBytes(4),
            nodes: ''
        };
        this.response(r, msg.t, rinfo);
    }

    onAnnouncePeer(msg,rinfo){
        if (msg.a && msg.a.info_hash && msg.a.info_hash.length === 20) {
            let infoHash=msg.a.info_hash;
            requestData.announcePeers++;
            //console.log('announce peer',infoHash.toString('hex'));
        } else {
            return ;
        }

        const r = {
            id: this.id
        };

        this.response(r, msg.t, rinfo);
    }

}


module.exports=DhtSpider;