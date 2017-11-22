

const DhtSpider=require('./dhtSpider');
const TorrentController=require('./torrentController');
const config=require('./config');
const sqliteOperator=require('./lib/database/sqliteOperate');
const dbExchange=require('./lib/database/dataExchange');

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

//single sqlite3 database to multi database
//sqliteOperator.singleToMulti();

//exchange the data between mongoDb and sqlite
//dbExchange.sqliteToMongo();
