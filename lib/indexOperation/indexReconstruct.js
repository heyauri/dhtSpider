const Leveldb = require("../database/levelOperate");
const tokenize = require("./tokenize");
const utils = require("../utils");
const lzString = require("lz-string");
const moment = require("moment");
let levelDB = new Leveldb();
let langjudge = require("langjudge");


let delIndexes = function (option) {
    let db_index, db_target;
    let dbs = levelDB.getDB();
    db_index = dbs.db_index;
    let o={count : 0, delCount : 0, keyCount : 0};
    setInterval(()=>{
        console.log(o)
    },5000);
    let stream = db_index.createReadStream();
    stream.on('data', function (data) {
        o.count++;
        if (data.key.indexOf('001_') === 0 || data.key.indexOf('002_') === 0 || data.key.indexOf('003_') === 0) {
            db_index.del(data.key).then(() => {
                o.delCount++;
            });
        }
        else if (data.value.indexOf('indexed') > -1) {
            let obj = JSON.parse(data.value);
            obj.s = '';
            obj.ts = 'del';
            db_index.put(data.key, JSON.stringify(obj)).then(() => {
                o.keyCount++;
            });
        }
    }).on('error', function (err) {
        console.log('Oh my!', err);
    }).on('close', function () {
        console.log('Stream closed');
    }).on('end', function () {
        console.log('Stream ended');
        setTimeout(() => {
            console.log("indexCount scan index:");
            console.log(o);
        });
    });
};



let reconstructFileList = function () {
    let db_index;
    let dbs = levelDB.getDB();
    db_index = dbs.db_index;
    let o={count :0, successCount : 0 ,errCount:0};
    setInterval(()=>{
        console.log(o)
    },5000);
    let stream = db_index.createReadStream();
    stream.on('data', function (data) {
        o.count++;
        if (data.key.indexOf('001_') < 0 && data.key.indexOf('002_') < 0 && data.key.indexOf('003_') < 0) {
            try {
                let obj = JSON.parse(data.value);
                let content = JSON.parse(lzString.decompressFromUTF16(obj.c));
                let arr = [];
                let paths = content.filePaths;
                for (let item of paths) {
                    if (utils.fileNameJudge(item)) {
                        item = item.replace(/_{3,}[^ \t\n\x0B\f\r]*_{3,}/, '');
                        if(item!==''){
                            arr.push(item);
                        }
                    }
                }
                content.filePaths = arr;
                obj.c = lzString.compressToUTF16(JSON.stringify(content));
                db_index.put(data.key, JSON.stringify(obj)).then(() => {
                    o.successCount++;
                })
            } catch (e) {
                stream.pause();
                console.log(e);
                o.errCount++;
                console.log(data);
            }
        }
    }).on('error', function (err) {
        console.log('Oh my!', err);
    }).on('close', function () {
        console.log('Stream closed');
    }).on('end', function () {
        console.log('Stream ended');
        setTimeout(() => {
            console.log("indexCount scan index:" +o);
        });
    });


};


module.exports = {
    delIndexes,
    reconstructFileList
};

