/**
 * Created by Administrator on 2017/6/11.
 */

const DhtSpider=require('./dhtSpider');
const TorrentController=require('./torrentDownload');
const config=require('./config');
const sqliteOperator=require('./database/sqliteOperate');
const dbExchange=require('./database/dataExchange');

//spider
let spider=new DhtSpider(config.address,config.port);

//show the use of memory
/*
setInterval(()=>{
    console.log(process.memoryUsage());
},5000);
*/


//torrent download
//let torrentController=new TorrentController();

//single sqlite3 database to multi database
//sqliteOperator.singleToMulti();

//exchange the data between mongoDb and sqlite
//dbExchange.sqliteToMongo();
