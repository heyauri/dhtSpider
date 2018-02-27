

const DhtSpider=require('./dhtSpider');
const TorrentController=require('./torrentController');
const config=require('./config');



//torrent controllerInit
let torrentController=new TorrentController();
torrentController.dispatch();
//dht spider
let spider=new DhtSpider(config.address,config.port,torrentController);


