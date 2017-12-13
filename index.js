

const DhtSpider=require('./dhtSpider');
const TorrentController=require('./torrentController');
const config=require('./config');



//torrent controllerInit
let torrentController=new TorrentController();
//dht spider
let spider=new DhtSpider(config.address,config.port,torrentController);


