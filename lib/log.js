const fs=require("fs");
const redis = require("redis");
const moment = require("moment");
let client = redis.createClient();
const {promisify} = require('util');
const getAsync = promisify(client.get).bind(client);

if (!fs.existsSync(process.cwd() + '/log/')) {
    console.log("Creating backup directory.");
    fs.mkdirSync(process.cwd() + '/log/');
}
let logCount=function(values){
    client.set('currentCounts',JSON.stringify(values));
    let str=moment().format('YYYY/MM/DD hh:mm:ss')+'  index:'+values[0]+' torrents:'+values[1]+'\n';
    fs.writeFile(process.cwd() + '/log/count.log',str,{flag:'a'},function(err){
        if(err){
            console.log(err);
        }
    })
};
let logSearch=async function(){
    let targets=await getAsync('targets');
    let arr=JSON.parse(targets);
    let str=arr.join('\n');
    fs.writeFile(process.cwd() + '/log/target.log',str,{flag:'a'},function(err){
        if(err){
            console.log(err);
        }else {
            client.set('targets',JSON.stringify([]));
        }
    })
};



module.exports={
    logCount,
    logSearch
};