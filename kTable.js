
const config=require('./config');


class KTable{
    constructor(){
        this.nodeList=[];
        setInterval(function(){
            this.nodesStatusScan();
        }.bind(this),60000);
        setInterval(function(){
            console.log('current nodeList length:'+this.nodeList.length);
            //console.log(this.nodeList[Math.floor(Math.random()*this.nodeList.length)]);
        }.bind(this),10000);
    }
    getNodeList(){
        return this.nodeList;
    }
    nodeListRefresh(address){
        for(let i=0;i<this.nodeList.length;i++){
            if(this.nodeList[i].address!=undefined&&this.nodeList[i].address===address){
                let obj=this.nodeList[i];
                this.nodeList.splice(i,1);
                obj['updateTime']=new Date().getTime();
                this.nodeList.unshift(obj);
                break;
            }
        }
    }
    nodesStatusScan(){
        let currentTime=new Date().getTime();
        for(let i=0;i<this.nodeList.length;i++){
            if(currentTime-this.nodeList[i].updateTime>900000){
                this.nodeList.splice(i,1);
                break;
            }
        }
    }

    insert(node){
        this.nodeList.unshift(node);
        if(this.nodeList.length>=config.maxNodeNumber){
            this.nodeList.splice(this.nodeList.length-2,1);
        }
    }
}

module.exports=KTable;

