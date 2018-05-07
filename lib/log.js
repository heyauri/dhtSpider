const fs=require("fs");
const redis = require("redis");
const moment = require("moment");
let client = redis.createClient();

if (!fs.existsSync(process.cwd() + '/log/')) {
    console.log("Creating backup directory.");
    fs.mkdirSync(process.cwd() + '/log/');
}
let logCount=function(values){
    client.set('currentCounts',JSON.stringify(values));
    let str=moment().format('YYYY/MM/DD hh:mm:ss')+'  index:'+values[0]+' torrents:'+values[1];
    fs.writeFile(process.cwd() + '/log/count',str,{flag:'a'},function(err){
        if(err){
            console.log(err);
        }
    })
};



module.exports={
    logCount
};