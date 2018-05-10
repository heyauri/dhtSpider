const split = require("split");
const through = require("through");
const events = require("events");
const config = require("../../config.js");
const fs = require("fs");
const zlib = require("zlib");
const level = require("level");
const levelws = require('level-ws');
module.exports=function(){

    let t=new Date().getTime();
    let backup_path = config.databaseAddress.backup+'000';
    let db_backup = level(backup_path, {maxFileSize: 67108864, cacheSize: 128108864, writeBufferSize: 67108864});
    db_backup=levelws(db_backup);

    fs.createReadStream(process.cwd()+"/backup/201805/backupjson_20180508.gz")
        .pipe(zlib.createGunzip())
        .pipe(split())
        .pipe(through(function(str){
            this.queue(JSON.parse(str))
        }))
        .pipe(db_backup.createWriteStream())
        .on("close",function() {
            console.log('load backup complete. took ', Date.now()-t, 'ms');
        });

};