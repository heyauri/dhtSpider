

const DhtSpider=require('./lib/dhtSpider/dhtSpider');
const TorrentController=require('./lib/dhtSpider/torrentController');
const indexOperation=require('./lib/indexOperation');
const config=require('./config');



//torrent controllerInit
let torrentController=new TorrentController();
torrentController.dispatch();
//dht spider
let spider=new DhtSpider(config.address,config.port,torrentController);

let scanIndex=function(){
    spider.stopInterval();
    torrentController.stop();
    setTimeout(()=>{
        let indexConstruct=indexOperation.indexConstruction();
        indexConstruct.on("constructFinish",function(){
            spider.init();
            torrentController.dispatch();
            setTimeout(()=>{scanIndex()},3600000);
        })
    },config.downloadMaxTime+1000);
};

setTimeout(()=>{scanIndex()},6000);
