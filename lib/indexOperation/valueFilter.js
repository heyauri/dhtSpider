const Leveldb = require("../database/levelOperate");
const utils = require("../utils");
const log = require("../log");
const lzString = require("lz-string");
const tokenizer = require('./tokenize');
const events = require("events");
const redis=require('../database/redis');
let levelDB = new Leveldb();
let db_index = levelDB.getDB().db_index;
let db_target = levelDB.getDB().db_target;
let event = new events.EventEmitter();

let valFilterData={
    totalCount:0,
    delCount:0,
    nameValueless:0
};

redis.getAsync('valFilterData').then((val)=>{
   if(!val){
       redis.client.set('valFilterData',JSON.stringify(valFilterData));
   }
   else{
       valFilterData=JSON.parse(val);
   }
});

let valuedTorrentArr = [];

let valuedTorrentGather = function () {
    return new Promise((resolve, reject) => {
        let stream = db_index.createReadStream()
            .on('data', function (data) {
                if (data.value.indexOf("indexed") < 0 && (data.key.indexOf('001_') < 0 && data.key.indexOf('002_') < 0 && data.key.indexOf('003_') < 0)) {
                    let obj = JSON.parse(data.value);
                    if (obj.q > 9) {
                        let c = JSON.parse(lzString.decompressFromUTF16(obj.c));
                        if (c.name) {
                            valuedTorrentArr.push(c.name);
                        }
                    }
                }
            })
            .on('error', function (err) {
                console.log('Oh my!', err)
            })
            .on('close', function () {
                console.log('Stream closed')
            })
            .on('end', function () {
                console.log('Stream ended');
                resolve("success");
            })
    });
};

let fullIndexScan = function () {
    let count = 0;
    let noTorrentsCount = 0;
    let intervalId=setInterval(()=>{
        console.log(count+','+noTorrentsCount);
    },5000);
    return new Promise((resolve, reject) => {
        let stream = db_index.createReadStream()
            .on('data', function (data) {
                if (data.value.indexOf("ts") <0 && (data.key.indexOf('001_') < 0 && data.key.indexOf('002_') < 0 && data.key.indexOf('003_') < 0)) {
                    let obj = JSON.parse(data.value);
                    count++;
                    if (!obj.ts) {
                        db_target.get(data.key).then(() => {
                            obj.ts = 'exist';
                            db_index.put(data.key, JSON.stringify(obj));
                        }).catch(err => {
                            if (err.type === 'NotFoundError') {
                                noTorrentsCount++;
                                obj.ts = 'none';
                                db_index.put(data.key, JSON.stringify(obj));
                            }
                        })
                    }
                }
            })
            .on('error', function (err) {
                console.log('Oh my!', err);
                reject('fail');
            })
            .on('close', function () {
                console.log('Stream closed')
            })
            .on('end', function () {
                console.log('Stream ended');
                clearInterval(intervalId);
                resolve([count,noTorrentsCount]);
            })
    });
};

let valueJudgeByName=function(name){
    let result=true;
    if(name.match(/^[0-9]+\.ts$/)||name.match(/^[0-9]+\.mp4$/)){
        result=false;
    }
    if(name.indexOf("�")>-1) result=false;
    return result;
};

let torrentRemove=function (key,obj) {
    return new Promise((resolve, reject) => {
        db_target.get(key).then(()=>{
            db_target.del(key).then(()=>{
                obj.ts='del';
                db_index.put(key,JSON.stringify(obj)).then(()=>{
                    resolve('success');
                });
            }).catch(()=>reject('fail'))
        }).catch((err)=>{
            if(err.type='NotFoundError'){
                obj.ts='del';
                db_index.put(key,JSON.stringify(obj)).then(()=>{
                    resolve('success');
                });
            }
        })
    })
};

let nameFilter=function(){
    let intervalId=setInterval(()=>{
       console.log(valFilterData);
    },5000);
    valFilterData.totalCount=0;
    return new Promise((resolve, reject) => {
        let stream = db_index.createReadStream()
            .on('data',async function (data) {
                if (data.value.indexOf("exist") >-1 && (data.key.indexOf('001_') < 0 && data.key.indexOf('002_') < 0 && data.key.indexOf('003_') < 0)) {
                    valFilterData.totalCount++;
                    let obj = JSON.parse(data.value);
                    let content=JSON.parse(lzString.decompressFromUTF16(obj.c));
                    if(content.name){
                        let result=valueJudgeByName(content.name);
                        if(!result){
                            torrentRemove(data.key,obj).then(()=>{
                                valFilterData.delCount++;
                                valFilterData.nameValueless++;
                            })
                        }
                    }
                }
            })
            .on('error', function (err) {
                console.log('Oh my!', err);
                reject('fail');
            })
            .on('close', function () {
                console.log('Stream closed')
            })
            .on('end', function () {
                console.log('Stream ended');
                clearInterval(intervalId);
                setTimeout(()=>{
                    console.log(valFilterData);
                    resolve(valFilterData);
                    redis.client.set('valFilterData',JSON.stringify(valFilterData));
                },2000)
            })
    });
};


module.exports={
    fullIndexScan,
    nameFilter
};