/**
 * a class of operating the data of leveldb
 *
 * Created version:0.3.0
 *
 */
const Min = require("level-min");
const config = require("../../config.js");
const moment = require('moment');
const through = require("through");
const fs = require("fs");
const md5 = require("md5");

let infohash_path = config.databaseAddress.index;

let min = new Min(infohash_path, {maxFileSize: 67108864, cacheSize: 34108864, writeBufferSize: 34108864});

let db_infohash = min.db;

process.on('SIGINT', function () {
    let p1 = db_infohash.close();
    Promise.all([p1]).then(() => {
        console.log('db closed');
        process.exit();
    });
});
process.on('SIGTERM', function () {
    let p1 = db_infohash.close();
    Promise.all([p1]).then(() => {
        console.log('dbs closed');
        process.exit();
    });
});
process.on('exit', function () {
    db_infohash.close();
    console.log('exit');
});


class LevelDB {
    constructor() {
        this.db_infohash = db_infohash;
    }

    getDB() {
        return {
            db_index: this.db_infohash,
        }
    }

    getInfoHashQueryTimes(infoHash) {
        return new Promise(function (resolve, reject) {
            min.cleanGet(infoHash).then(value => {
                try {
                    resolve(value.q);
                } catch (err) {
                    console.log(err);
                }
            }).catch(err => {
                if (err) {
                    if (err.type === "NotFoundError") {
                        reject("NotFoundError");
                    }
                    else {
                        console.error(err);
                        reject(err);
                    }
                }
            })
        });
    }

    async updateInfohash(data) {
        let infoHash = data.infoHash;
        return new Promise((resolve, reject) => {
            db_infohash.get(md5(infoHash), function (err, value) {
                if (!value && err) {
                    try {
                        if (err.type === "NotFoundError") {
                            if (data.name) {
                                let content = {
                                    name: data.name,
                                    size: data.size,
                                    filePaths: data.filePaths,
                                    q: 1,
                                    t: moment().format('YYYY/MM/DD hh:mm:ss'),
                                };
                                min.put(infoHash, content, {
                                    keyWeight: 0,
                                    valueWeightCalc: true,
                                    valueWeights: {name: 2, filePaths: 0.5}
                                })
                                    .then(() => resolve('success'))
                                    .catch(() => {
                                        reject('fail');
                                    });
                            }
                            else {
                                reject('fail');
                            }
                        }
                    } catch (e) {
                        console.error(e);
                        reject("fail");
                    }
                }
                else {
                    try {
                        let obj = JSON.parse(value);
                        let val = JSON.parse(obj["value"]);
                        val.q++;
                        min.cleanUpdate(infoHash, JSON.stringify(val))
                            .then(() => resolve('success'))
                            .catch(() => {
                                reject('fail');
                            });
                    } catch (e) {
                        console.log(e);
                        reject('fail');
                    }
                }
            });
        });
    }

    indexSearch(target) {
        return min.search(target);
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
        let t = new Date().getTime();
        let count = 0;
        let stream = db_infohash.createReadStream()
            .pipe(through(function (data) {
                // depending on if you store binary data your serialization method could be msgpack.
                //if(data.key.indexOf('001_') >-1 || data.key.indexOf('002_') >-1 && data.key.indexOf('003_') < 0){
                if (true) {
                    /*let obj=JSON.parse(data.value);
                    if(obj.q>1000){
                        count++;
                        obj.c=lzString.decompressFromUTF16(obj.c);
                        this.queue(JSON.stringify(obj) + "\n");
                    }*/
                    let obj = JSON.parse(data.value);
                    this.queue(obj.l + "  " + data.key + ':' + data.value + "\n");
                }
            }))
            .pipe(fs.createWriteStream(process.cwd() + '/indexLog.log'))
            .on("close", function () {
                console.log(count);
                console.log('backup complete. took ', Date.now() - t, 'ms');
            });
    }
}

module.exports = LevelDB;