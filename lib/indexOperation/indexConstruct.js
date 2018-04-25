/**
 * Search module of levelmin
 */

const level = require('level');
const path = require("path");
const natural = require('natural');
const tonkenize = require('./tonkenize');
const langjudge = require("langjudge");
const Segmentit = require('segmentit').default;
const useDefault = require('segmentit').useDefault;

const segmentit = useDefault(new Segmentit());

let NGrams = natural.NGrams, tokenizerJP = new natural.TokenizerJa(), tokenizerDefault = new natural.WordTokenizer();
let db_target, db_index;
let handledData = {
    constructedKey: 0,
    processedValue: 0
};

let queue = [], stream;
let intervalId;

let constructIndex = function (options) {
    if (options['source']) {
        let targetPath = options['source'];
        let indexPath =  options['index'] || '/data/index';
        db_index = level(indexPath);
        db_target = level(targetPath);
    }
    else {
        throw new Error("options invalid");
    }
    intervalId = setInterval(function () {
        let handledStr = '';
        for (let key in handledData) {
            handledStr = handledStr + key + ':' + handledData[key] + '  '
        }
        console.log('total run time:' + process.uptime() + 's', 'handledData:' + handledStr);
    }, 5000);
    scanIndex().then(() => {
        dispatch();
    });
    /*     db_index.get('002_Unaware (2010)',function(err,value){
            console.log(err);
            console.log(value);
        });*/
};

let scanIndex = function () {
    let count = 0;
    return new Promise(function (resolve, reject) {
        stream = db_index.createReadStream();
        stream.on('data', function (data) {
/*
        if(langjudge.langAllContain(data.key).indexOf("Cyrillic")>-1){
                console.log(data);
                count++;
                if(count%10===0){
                    stream.pause();
                    setTimeout(()=>{
                        stream.resume();
                    },5000)
                }
            }*/

            if (data.value.indexOf("indexed") < 0 && data.key.indexOf('001_') <0 && data.key.indexOf('002_')<0 ) {
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
        indexKeyConstruct(data);
    } else {
        console.log("index constructed finish.");
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
                let keys_01 = tokenize(obj.name);
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

let nameIndexSave = function (index, name, key) {
    return new Promise((resolve,reject)=>{
        db_index.get('001_' + index, function (err, value) {
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
                db_index.put('001_' + index, JSON.stringify(arr));
            }
        });
        db_index.get('002_' + name, function (err, value) {
            let arr = [], key_exist = false;
            if (err) {
                if (err.type === "NotFoundError") {
                    arr.push(key);
                }
            } else {
                try {
                    arr = JSON.parse(value);
                    if (arr.indexOf(name) < 0) {
                        arr.push(key);
                    }
                    else {
                        key_exist = true;
                    }
                } catch (e) {
                    console.log(e);
                }
            }
            if (!key_exist) {
                db_index.put('002_' + name, JSON.stringify(arr));
            }
        });
        setTimeout(()=>{
            handledData.processedValue++;
            resolve("success");
        },100);
    });
};


module.exports = constructIndex;