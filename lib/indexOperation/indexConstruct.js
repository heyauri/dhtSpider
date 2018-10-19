/**
 * Search module of levelmin
 */

const Leveldb = require("../database/levelOperate");
const utils = require("../utils");
const log = require("../log");
const lzString = require("lz-string");
const tokenizer = require('./tokenize');
const indexCount = require("./indexCount");
const events = require("events");
let db_target, db_index;
let handledData = {
    constructedKey: 0,
    processedValue: 0
};

let queue = [], stream;
let status = false;
let intervalId;
let levelDB = new Leveldb();
let event = new events.EventEmitter();

let constructIndex = function () {
    if (!status) {
        status = true;
        let dbs = levelDB.getDB();
        db_target = dbs.db_target;
        db_index = dbs.db_index;
        if (!intervalId) {
            intervalId = setInterval(function () {
                let handledStr = '';
                for (let key in handledData) {
                    handledStr = handledStr + key + ':' + handledData[key] + '  '
                }
                console.log('total run time:' + process.uptime() + 's', 'handledData:' + handledStr);
            }, 10000);
        }
        scanIndex().then(() => {
            dispatch();
        }).catch(e=>{});
    }
    return event;
};
let indexRefix = function () {
    return new Promise(function (resolve, reject) {
        stream = db_target.createReadStream();
        stream.on('data', function (data) {
            db_index.get(data.key)
                .then((val) => {
                })
                .catch((err) => {
                    if (err.type === "NotFoundError") {
                        let obj = {
                            infoHash: data.key,
                            info: JSON.parse(lzString.decompressFromUTF16(data.value))
                        };
                        levelDB.updateInfohash(obj);
                    }
                })
        }).on('error', function (err) {
            console.log('Oh my!', err)
        }).on('close', function () {
            console.log('Stream closed');
        }).on('end', function () {
            console.log('Stream ended');
            resolve("success");
        })
    })
};
let scanIndex = function () {
    let count = 0;
    return new Promise(function (resolve, reject) {
        stream = db_index.createReadStream();
        stream.on('data', function (data) {
            if (data.key.indexOf('001_') < 0 && data.key.indexOf('002_') < 0 && data.key.indexOf('003_') < 0) {
                count++;
                if (data.value.indexOf("indexed") < 0) {
                    queue.push(data);
                    if(queue.length>8000){
                        stream.destroy();
                        dispatch();
                        reject('tooMuch');
                    }
                }
            }
        }).on('error', function (err) {
            console.log('Oh my!', err)
        }).on('close', function () {
            console.log('Stream closed');
            log.logCount([count, 0]);
        }).on('end', function () {
            console.log('Stream ended');
            resolve("success");
            console.log("scan count:" + count);
        })
    })
};

let tempDispatch=function(){
    if (queue.length) {
        let data = queue.pop();
        event.emit("dispatch");
        indexKeyConstruct(data);
    } else {
        console.log("index constructed finish.");
        clearInterval(intervalId);
        intervalId = 0;
        status = false;
        event.emit("constructFinish");
    }
};

let dispatch = function () {
    if (queue.length) {
        let data = queue.pop();
        event.emit("dispatch");
        indexKeyConstruct(data);
    } else {
        console.log("index constructed finish.");
        clearInterval(intervalId);
        intervalId = 0;
        status = false;
        event.emit("constructFinish");
    }
};

let indexKeyConstruct = function (data) {
    let key = data.key;
    try {
        let obj = JSON.parse(data.value), promiseArr = [];
        let content = JSON.parse(lzString.decompressFromUTF16(obj.c));
        if (!content.name) {
            console.log(data);
            console.log(content);
            db_target.get(data.key).then(value => {
                let metadata = utils.metadataWrapper(data.key, {
                    info: JSON.parse(lzString.decompressFromUTF16(value))
                });
                levelDB.updateInfohash(metadata).then((msg) => {
                    msg === "success" ? dispatch() : msg;
                }).catch(err => {
                    dispatch();
                });
            }).catch(err => {
                if (err.type === "NotFoundError") {
                    db_index.del('key').then(() => {
                        dispatch();
                    })
                }
            });
        } else {
            let keys_01 = tokenizer.tokenize(content.name);
            //let keys_02 = tokenize(obj.filePaths);
            for (let item of keys_01) {
                promiseArr.push(nameIndexSave(item, content.name, key));
            }
            handledData.constructedKey++;
            let indexValueObj = JSON.parse(data.value);
            indexValueObj.s = "indexed";
            Promise.all(promiseArr).then(() => {
                db_index.put(key, JSON.stringify(indexValueObj)).then(() => {
                    dispatch();
                });
            }).catch((e) => console.log(e));
        }
    } catch (e) {
        console.log(e);
    }
};

let saveShortKey = function (shortKey, index) {
    return new Promise((resolve, reject) => {
        db_index.get('001_' + shortKey, function (err, value) {
            let arr = [], nameExist = false;
            if (err) {
                if (err.type === "NotFoundError") {
                    arr.push(index);
                }
            } else {
                try {
                    arr = JSON.parse(value);
                    if (arr.indexOf(index) < 0) {
                        arr.push(index);
                    }
                    else {
                        nameExist = true;
                    }
                } catch (e) {
                    console.log(e);
                }
            }
            if (!nameExist) {
                db_index.put('001_' + shortKey, JSON.stringify(arr)).then(() => {
                    resolve("success");
                });
            } else {
                resolve("success");
            }
        });
    })
};
let saveIndex = function (index, name) {
    return new Promise((resolve, reject) => {
        db_index.get('002_' + index, function (err, value) {
            let arr = [], nameExist = false;
            if (err) {
                if (err.type === "NotFoundError") {
                    arr.push(name);
                }
            } else {
                try {
                    arr = JSON.parse(value);
                    if (arr.indexOf(name) < 0) {
                        arr.push(name);
                    }
                    else {
                        nameExist = true;
                    }
                } catch (e) {
                    console.log(e);
                }
            }
            if (!nameExist) {
                db_index.put('002_' + index, JSON.stringify(arr)).then(() => {
                    resolve("success");
                });
            } else {
                resolve("success");
            }
        });
    })
};

let saveName = function (name, infohash) {
    return new Promise((resolve, reject) => {
        db_index.get('003_' + name, function (err, value) {
            let arr = [], nameExist = false;
            if (err) {
                if (err.type === "NotFoundError") {
                    arr.push(infohash);
                }
            } else {
                try {
                    arr = JSON.parse(value);
                    if (arr.indexOf(infohash) < 0) {
                        arr.push(infohash);
                    }
                    else {
                        nameExist = true;
                    }
                } catch (e) {
                    console.log(e);
                }
            }
            if (!nameExist) {
                db_index.put('003_' + name, JSON.stringify(arr)).then(() => {
                    resolve("success");
                });
            } else {
                resolve("success");
            }
        });
    })
};


let nameIndexSave = function (index, name, key) {
    return new Promise((resolve, reject) => {
        db_index.get('002_' + index).then((data) => {
            try{
                let arr=JSON.parse(data);
                if(arr.length>8){
                    let shortKeys = tokenizer.getShortKeys(index);
                    let shortKeyArr = [];
                    let middleElement = shortKeys[Math.floor(shortKeys.length / 2)];
                    shortKeyArr.push(saveShortKey(middleElement, index));
                    Promise.all(shortKeyArr).then(() => {
                        saveIndex(index, name).then(() => {
                            saveName(name, key).then(() => {
                                handledData.processedValue++;
                                resolve("success");
                            })
                        });
                    });
                }
                else{
                    saveIndex(index, name).then(() => {
                        saveName(name, key).then(() => {
                            handledData.processedValue++;
                            resolve("success");
                        })
                    });
                }
            }catch (e) {
                console.log(e);
                console.log(data);
                reject(e);
            }
        }).catch((err) => {
            if (err.type === "NotFoundError") {
                saveIndex(index, name).then(() => {
                    saveName(name, key).then(() => {
                        handledData.processedValue++;
                        resolve("success");
                    })
                });
            }else{
                console.log(err);
                reject(err);
            }
        });

    });
};


module.exports = constructIndex;