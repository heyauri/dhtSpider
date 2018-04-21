

const DhtSpider=require('./lib/dhtSpider');
const TorrentController=require('./lib/torrentController');
const config=require('./config');



//torrent controllerInit
let torrentController=new TorrentController();
torrentController.dispatch();
//dht spider
let spider=new DhtSpider(config.address,config.port,torrentController);


