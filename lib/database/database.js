

const config=require('../../config');

if(config.databaseType==='levelDB'){
    module.exports=require('./levelOperate');
}
else if(config.databaseType==='sqlite') {
    module.exports =require('./sqliteOperate');
}
else if(config.databaseType==='mongoDB'){
    module.exports=require('./mongoOperate');
}