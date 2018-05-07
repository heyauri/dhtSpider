const Leveldb = require("../database/levelOperate");
const events = require("events");
const config=require("../../config.js");
const level = require("level");
const zlib = require('zlib');
const fs = require('fs');
const through = require('through');
const moment=require("moment");
let backup_path =  config.databaseAddress.backup;
let db_backup=level(backup_path,{maxFileSize:67108864,cacheSize:128108864,writeBufferSize:67108864});;
let levelDB = new Leveldb();
let event = new events.EventEmitter();
let db_index=levelDB.getDB().db_index;
let t = Date.now();
if (!fs.existsSync(process.cwd() + '/backup/')) {
    console.log("Creating backup directory.");
    fs.mkdirSync(process.cwd() + '/backup/');
}
if (!fs.existsSync(process.cwd() + '/backup/'+moment().format('YYYYMM'))) {
    console.log("Creating backup directory.");
    fs.mkdirSync(process.cwd() + '/backup/'+moment().format('YYYYMM'));
}

process.on('exit', function() {
    db_backup.close();
    console.log('exit');
});

let backupFile=process.cwd()+'/backup/'+moment().format('YYYYMM')+'/backupjson_'+moment().format('YYYYMMDD')+'.gz';

let indexToBackup=function(){
    return new Promise((resolve,reject)=>{
        db_index.createReadStream()
            .on('data', function (data) {
                db_backup.put(data.key,data.value);
            })
            .on('error', function (err) {
                console.log('Oh my!', err)
            })
            .on('close', function () {
                console.log('Stream closed')
            })
            .on('end', function () {
                resolve("success");
                console.log('Stream ended');
            });
    });
};



module.exports=function(){
    db_backup.open().then(()=>{
        indexToBackup().then(msg => {
            db_backup.createReadStream()
                .pipe(through(function (obj) {
                    // depending on if you store binary data your serialization method could be msgpack.
                    this.queue(JSON.stringify(obj) + "\n");
                }))
                .pipe(zlib.createGzip())
                .pipe(fs.createWriteStream(backupFile))
                .on("close", function () {
                    console.log('backup complete. took ', Date.now() - t, 'ms');
                    event.emit('backupFinish');
                    setTimeout(()=>{
                        db_backup.close();
                    },60000);
                });
        });
    });
    return event;
};



