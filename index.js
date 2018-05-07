
const DhtSpider=require('./lib/dhtSpider/dhtSpider');
const TorrentController=require('./lib/dhtSpider/torrentController');
const indexOperation=require('./lib/indexOperation');
const config=require('./config');

const Koa = require('koa');
const app = new Koa();
const Router = require("koa-router");
const path = require("path");
const Static = require('koa-static');
const BodyParser = require('koa-bodyparser');
let btSearch=require("./lib/server/btSearch");
//torrent controllerInit
/*let torrentController=new TorrentController();
torrentController.dispatch();
//dht spider
let spider=new DhtSpider(config.address,config.port,torrentController);
let scanIndex=function(){
    spider.stopInterval();
    torrentController.stop();
    setTimeout(()=>{
        let indexConstruct=indexOperation.indexConstruction();
        indexConstruct.on("constructFinish",function(){
            indexBackup();
        })
    },config.downloadMaxTime+1000);
};

let indexBackup=function(){
    indexOperation.indexBackup().on('backupFinish',function(){
        console.log("backupFinish");
        spider.init();
        torrentController.dispatch();
        setTimeout(()=>{scanIndex()},3600000);
    })
};

setTimeout(()=>{scanIndex()},0);*/


const staticPath = './static';
app.use(Static(
    path.join(__dirname, staticPath)
));

app.use(BodyParser());

// 装载所有子路由
let router = new Router();
router.get('/btSearch', async (ctx) => {
    try{
        let obj={};
        if(Object.prototype.toString.call(ctx.query)==="[object Object]"){
            obj=ctx.query;
        }
        else {
            obj = JSON.parse(ctx.query);
        }
        await btSearch(obj).then((result)=>{
            ctx.body=JSON.stringify(result);
        }).catch((err)=>{
            ctx.status = 500;
            ctx.body = err;
        })
    }catch(err){
        ctx.status = 500;
        ctx.body = 'Oh my 404!';
    }
});

// 加载路由中间件
app.use(router.routes()).use(router.allowedMethods());


app.listen(12345);
console.log('[demo] start-quick is starting at port 12345');
