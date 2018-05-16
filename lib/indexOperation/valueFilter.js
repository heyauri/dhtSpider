const Leveldb = require("../database/levelOperate");
const utils = require("../utils");
const log = require("../log");
const lzString = require("lz-string");
const tokenizer = require('./tokenize');
const indexCount = require("./indexCount");
const events = require("events");
let levelDB = new Leveldb();
let db_index=levelDB.getDB().db_index;
let db_target=levelDB.getDB().db_target;
let event = new events.EventEmitter();

let valuedTorrentArr=[];

let valuedTorrentGather=function(){
    return new Promise((resolve,reject)=>{
        let stream =db_index.createReadStream()
            .on('data', function (data) {
                let obj=JSON.parse(data.value);
                if(obj.q>9){
                    let c=JSON.parse(lzString.decompressFromUTF16(obj.c));
                    if(c.name){
                        valuedTorrentArr.push(c.name);
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
