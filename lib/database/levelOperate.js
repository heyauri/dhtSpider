/**
 * a class of operating the data of leveldb
 *
 * Created version:0.3.0
 *
 */
const path = require("path");
const level = require("level");
const config = require("../../config.js");
const moment = require('moment');
const lzString = require("lz-string");
const through = require("through");
const fs = require("fs");

const utils = require("../utils.js");
let metadata_path = config.databaseAddress.target;
let infohash_path = config.databaseAddress.index;
let db_metadata = level(metadata_path, {maxFileSize: 67108864, cacheSize: 67108864, writeBufferSize: 67108864});
let db_infohash = level(infohash_path, {maxFileSize: 67108864, cacheSize: 67108864, writeBufferSize: 67108864});

process.on('SIGINT', function () {
    let p1 = db_infohash.close();
    let p2 = db_metadata.close();
    Promise.all([p1, p2]).then(() => {
        console.log('dbs closed');
        process.exit();
    });
});
process.on('SIGTERM', function () {
    let p1 = db_infohash.close();
    let p2 = db_metadata.close();
    Promise.all([p1, p2]).then(() => {
        console.log('dbs closed');
        process.exit();
    });
});
process.on('exit', function () {
    db_infohash.close();
    db_metadata.close();
    console.log('exit');
});


class LevelDB {
    constructor() {
        this.db_metadata = db_metadata;
        this.db_infohash = db_infohash;
    }

    getDB() {
        return {
            db_index: this.db_infohash,
            db_target: this.db_metadata
        }
    }


    insertMetadata(infoHash, data) {
        let data_str = lzString.compressToUTF16(JSON.stringify(data));
        return new Promise(function (resolve, reject) {
            db_metadata.put(infoHash, data_str, function (err) {
                if (err) return reject(err);
                else {
                    resolve("success");
                }
            });
        });
    }

    getMetadata(infoHash) {
        return new Promise(function (resolve, reject) {
            db_metadata.get(infoHash, function (err, value) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(value);
                }
            });
        });
    }

    getInfoHashQueryTimes(infoHash) {
        return new Promise(function (resolve, reject) {
            db_infohash.get(infoHash, function (err, value) {
                if (err) {
                    if (err.type === "NotFoundError") {
                        reject("NotFoundError");
                    }
                    else {
                        reject(err);
                    }
                }
                else {
                    try {
                        let obj = JSON.parse(value);
                        resolve(obj.q);
                    } catch (err) {
                        console.log(err);
                    }
                }
            });
        });
    }

    updateInfohash(data) {
        let infoHash = data.infoHash;
        return new Promise((resolve, reject) => {
            db_infohash.get(infoHash, function (err, value) {
                if (!value && err) {
                    try {
                        if (err.type === "NotFoundError") {
                            let content = {
                                name: data.name,
                                size: data.size,
                                filePaths: data.filePaths
                            };
                            let obj = {
                                q: 1,
                                t: moment().format('YYYY/MM/DD hh:mm:ss'),
                                c: lzString.compressToUTF16(JSON.stringify(content))
                            };
                            db_infohash.put(infoHash, JSON.stringify(obj)).then(() => resolve('success'));
                        }
                    } catch (e) {
                    }
                }
                else {
                    try {
                        let obj = JSON.parse(value);
                        let name = JSON.parse(lzString.decompressFromUTF16(obj.c)).name;
                        if (data.name && !name) {
                            let content = {
                                name: data.name,
                                size: data.size,
                                filePaths: data.filePaths
                            };
                            obj.c = lzString.compressToUTF16(JSON.stringify(content));
                        }
                        obj.q++;
                        db_infohash.put(infoHash, JSON.stringify(obj)).then(() => resolve('success'));
                    } catch (e) {
                        console.log(e);
                    }
                }
            });
        });
    }

    readAllMetadata() {
        let _this = this;

        let stream = db_metadata.createReadStream()
            .on('data', function (data) {
                console.log(JSON.parse(lzString.decompressFromUTF16(data.value)));
            })
            .on('error', function (err) {
                console.log('Oh my!', err)
            })
            .on('close', function () {
                console.log('Stream closed')
            })
            .on('end', function () {
                console.log('Stream ended');
            })
    }

    readAllInfohash() {
        let stream = db_infohash.createReadStream()
            .on('data', function (data) {
                console.log(data.key + " : " + data.value);
            })
            .on('error', function (err) {
                console.log('Oh my!', err)
            })
            .on('close', function () {
                console.log('Stream closed')
            })
            .on('end', function () {
                console.log('Stream ended')
            })
    }

    indexToLog() {
        let t=new Date().getTime();
        let count=0;
        let stream = db_infohash.createReadStream()
            .pipe(through(function (data) {
                // depending on if you store binary data your serialization method could be msgpack.
                if(data.key.indexOf('001_') < 0 && data.key.indexOf('002_') < 0 && data.key.indexOf('003_') < 0){
                    let obj=JSON.parse(data.value);
                    if(obj.q>1000){
                        count++;
                        obj.c=lzString.decompressFromUTF16(obj.c);
                        this.queue(JSON.stringify(obj) + "\n");
                    }

                }
            }))
            .pipe(fs.createWriteStream(process.cwd()+'/indexLog.log'))
            .on("close", function () {
                console.log(count);
                console.log('backup complete. took ', Date.now() - t, 'ms');
            });
    }
}

module.exports = LevelDB;