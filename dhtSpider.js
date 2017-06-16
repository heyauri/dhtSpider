/**
 * Created by Administrator on 2017/5/26.
 */
const dgram=require('dgram');
const crypto=require('crypto');
const bencode=require('bencode');

//util
const utils=require('./utils');
//config
const config=require('./config');
//db
let db=require('./database/database')
//kTable
const KTable=require('./kTable');

class DhtSpider{
    constructor(address,port){
        this.address=address;
        this.port=port;
        this.id=utils.getRandomId();

        this.kTable=new KTable();
        this.nodeList=this.kTable.getNodeList();

        this.udp=dgram.createSocket('udp4');
        this.udp.on('message',(msg,rinfo)=>{
            this.onMessage(msg,rinfo)
        });

        this.udp.once('listening',()=>{
            this.init();
        });

        if(this.address){
            this.udp.bind(this.port,this.address)
        }
        else{
            this.udp.bind(this.port);
        }

    }

    init(){
        let nodeList=this.nodeList;
        if(nodeList.length===0){
            this.joinDhtNetwork();
            this.intervalId=setInterval(function(){
                if(nodeList.length===0){
                    return this.joinDhtNetwork();
                }
                this.findNodeList();
            }.bind(this),config.intervalTime)
        }
        else{
            this.findNodeList();
        }




    }

    joinDhtNetwork(){
        let nodes=config.bootstrapNodes;
        nodes.forEach((node)=>{
            this.findNode(node)
        })
    }

    onMessage(message,rinfo){
        let msg={};
        let y;
        try{
            msg=bencode.decode(message);
        }
        catch(e){
            console.log('decode failed');
            return ;
        }
        if(msg.y){
            y=msg.y.toString();
        }

        if(!msg.t){
            return console.log("t is empty");
        }

        if(!y||y.length!==1){
            return console.log('y is required');
        }

        //error
        if(y==='e'){
            return console.log('an error occurred');
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
                var q = msg.q.toString();
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
                    console.log('q is unknown');
                    qValid=false;
            }
            if(qValid){
                this.kTable.nodeListRefresh(rinfo.address);
            }
        }

        //response
        if (y === 'r') {
            if (msg.r.nodes) {
                var nodes = utils.decodeNodes(msg.r.nodes);
            } else {
                return ;
            }

            const len = nodes.length;
            if (len !== 0) {
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
        let id=nid!=undefined?utils.getNeighborId(nid,this.id):this.id;
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
        console.log('ping');
        this.response(r,msg.t,rinfo);
    }

    onFindNode(msg,rinfo){
        let r={
            id:this.id,
            nodes:this.nodeList[Math.floor(this.nodeList.length/2)]
        };
        console.log('findNode');
        this.response(r,msg.t,rinfo);
    }


    onGetPeers(msg,rinfo){
        let infoHash='';
        if (msg.a && msg.a.info_hash && msg.a.info_hash.length === 20) {
            infoHash = msg.a.info_hash;
            console.log('get peers',infoHash.toString('hex'));
            db.saveInfoHash(infoHash.toString('hex'));
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
            console.log('announce peer',infoHash.toString('hex'));
            db.saveInfoHash(infoHash.toString('hex'));
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