

const DhtSpider=require('./dhtSpider');
const TorrentController=require('./torrentController');
const config=require('./config');



//torrent controllerInit
let torrentController=new TorrentController();
//dht spider
let spider=new DhtSpider(config.address,config.port,torrentController);




//show the use of memory
/*
 setInterval(()=>{
 console.log(process.memoryUsage());
 },5000);
 */


//exchange the data between mongoDb and sqlite
//dbExchange.sqliteToMongo();
