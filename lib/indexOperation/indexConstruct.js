/**
 * Search module of levelmin
 */

const Leveldb=require("../database/levelOperate");
const tokenizer = require('./tokenize');
const indexCount=require("./indexCount");
const events = require("events");
let db_target, db_index;
let handledData = {
    constructedKey: 0,
    processedValue: 0
};

let queue = [], stream;
let intervalId;
let levelDB=new Leveldb();
let event=new events.EventEmitter();

let constructIndex = function () {
    let dbs = levelDB.getDB();
    db_target = dbs.db_target;
    db_index = dbs.db_index;
    intervalId = setInterval(function () {
        let handledStr = '';
        for (let key in handledData) {
            handledStr = handledStr + key + ':' + handledData[key] + '  '
        }
        console.log('total run time:' + process.uptime() + 's', 'handledData:' + handledStr);
    }, 5000);
    indexCount().then((values)=>{
        if(values[0]!==values[1]){
            indexRefix().then(()=>{
                setTimeout(()=>{
                    scanIndex().then(() => {
                        dispatch();
                    });
                },200)
            });
        }
        else if(values[0]===values[1]){
            scanIndex().then(() => {
                dispatch();
            });
        }
    });
    return event;
};
let indexRefix=function(){
    return new Promise(function (resolve, reject) {
        stream = db_target.createKeyStream();
        stream.on('data', function (data) {
            db_index.get(data)
                .then((val)=>{})
                .catch((err)=>{
                if(err.type==="NotFoundError"){
                    levelDB.updateInfohash(data);
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
/*let indexRefix=function(){
    return new Promise(function (resolve, reject) {
        stream = db_index.createReadStream();
        stream.on('data', function (data) {
            if ((data.key.indexOf('001_') <0 && data.key.indexOf('002_')<0 && data.key.indexOf('003_')<0) ) {
                db_target.get(data.key)
                    .then((val)=>{
                    })
                    .catch((err)=>{
                        if(err.type==="NotFoundError"){
                            //levelDB.updateInfohash(data);
                            console.log(data);
                        }
                    })
            }
            //console.log(data)
        }).on('error', function (err) {
            console.log('Oh my!', err)
        }).on('close', function () {
            console.log('Stream closed');
        }).on('end', function () {
            console.log('Stream ended');
            resolve("success");
        })
    })
};*/

let scanIndex = function () {
    let count = 0;
    return new Promise(function (resolve, reject) {
        stream = db_index.createReadStream();
        stream.on('data', function (data) {
            if (data.value.indexOf("indexed") < 0 && (data.key.indexOf('001_') <0 && data.key.indexOf('002_')<0 && data.key.indexOf('003_')<0) ) {
                count++;
                queue.push(data);
            }
        }).on('error', function (err) {
            console.log('Oh my!', err)
        }).on('close', function () {
            console.log('Stream closed');
        }).on('end', function () {
            console.log('Stream ended');
            resolve("success");
            console.log("scan count:"+count);
        })
    })
};

let dispatch = function () {
    if (queue.length) {
        let data = queue.pop();
        event.emit("dispatch");
        indexKeyConstruct(data);
    } else {
        console.log("index constructed finish.");
        event.emit("constructFinish");
        clearInterval(intervalId);
    }
};

let indexKeyConstruct = function (data) {
    let key = data.key;
    db_target.get(key, function (err, value) {
        if (err) {
            if (err.type === "NotFoundError") {
            }
        } else {
            try {
                let obj = JSON.parse(value),promiseArr=[];
                let keys_01 = tokenizer.tokenize(obj.name);
                //let keys_02 = tokenize(obj.filePaths);
                for (let item of keys_01) {
                    promiseArr.push(nameIndexSave(item, obj.name, key));
                }
                handledData.constructedKey++;
                let indexValueObj = JSON.parse(data.value);
                indexValueObj.s = "indexed";
                Promise.all(promiseArr).then(()=>{
                    db_index.put(key, JSON.stringify(indexValueObj)).then(() => {
                        dispatch();
                    });
                }).catch((e)=>console.log(e));
            } catch (e) {
                console.log(e);
            }
        }
    });


};

let saveShortKey=function(shortKey,index){
    return new Promise((resolve,reject)=>{
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
                db_index.put('001_' + shortKey, JSON.stringify(arr)).then(()=>{
                    resolve("success");
                });
            }else{
                resolve("success");
            }
        });
    })
};
let saveIndex=function(index,name){
    return new Promise((resolve,reject)=>{
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
                db_index.put('002_' + index, JSON.stringify(arr)).then(()=>{
                    resolve("success");
                });
            }else{
                resolve("success");
            }
        });
    })
};

let saveName=function(name,infohash){
    return new Promise((resolve,reject)=>{
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
                db_index.put('003_' + name, JSON.stringify(arr)).then(()=>{
                    resolve("success");
                });
            }else{
                resolve("success");
            }
        });
    })
};



let nameIndexSave = function (index, name, key) {
    let shortKeys=tokenizer.getShortKeys(index);
    let shortKeyArr=[];
    //console.log(shortKeys);
    for(let item of shortKeys){
        shortKeyArr.push(saveShortKey(item,index));
    }
    return new Promise((resolve,reject)=>{
        Promise.all(shortKeyArr).then(()=>{
            saveIndex(index,name).then(()=>{
                saveName(name,key).then(()=>{
                    handledData.processedValue++;
                    resolve("success");
                })
            });
        });
    });
};


module.exports = constructIndex;