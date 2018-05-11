const indexOperation = require("../indexOperation");
const Leveldb = require("../database/levelOperate");
const redis = require("../database/redis");
const lzString = require("lz-string");
const utils=require("../utils");
const log=require("../log");

let client = redis.client;
let getAsync = redis.getAsync;
let leveldb = new Leveldb();
let db_index = leveldb.getDB().db_index;
let target='';


getAsync('targets').then(function(val) {
    if(!val){
        client.set('targets',JSON.stringify([]));
    }
    else{

    }
});

setInterval(()=>{
    log.logSearch();
},86400000);

client.on("error", function (err) {
    console.log("Error " + err);
});
let searchInDB = async function (target) {
    return await indexOperation.indexSearch(target);
};
let getKeys = async function (arr) {
    let items = [];
    for (let item of arr) {
        try {
            let infoHash = await db_index.get('003_' + item.name);
            let keys=JSON.parse(infoHash);
            for(let key of keys){
                items.push({
                    key:key,
                    weight:item.weight
                })
            }
        } catch (e) {
            console.log(e);
        }
    }
    return items;
};
let getDetail = async function (arr) {
    let result = [];
    let items = await getKeys(arr);
    for (let item of items) {
        try {
            let val = await db_index.get(item.key);
            let obj = JSON.parse(val);
            let content = JSON.parse(lzString.decompressFromUTF16(obj.c));
            result.push({
                time: obj.t,
                queryTimes: obj.q,
                weight:item.weight,
                name: content.name,
                size: content.size,
                infoHash:item.key,
                filePaths: JSON.parse(content.filePaths)
            });
        } catch (e) {
            console.log(e);
        }
    }
    orderAdjust(result);
    return result;
};

let orderAdjust=function(arr){
    for(let item of arr){
        item.weight+=item.queryTimes/200;
        for(let file of item.filePaths){
            if(file.indexOf(target)>-1){
                item.weight+=0.1;
            }
        }
    }
    return utils.weightSort(arr);
};


let getResult = async function (target, page) {
    try {
        let result = await  getAsync(target + '_p' + page);
        let queryCache = await  getAsync(target);
        let queryLength = await  getAsync(target+'_length');
        let action = 1;
        let totalLength=0;
        //1:都不过期 2:result过期 3:queryCache过期;
        if (!result && !queryCache) {
            action = 3;
        } else if (!result) {
            let qcObj = JSON.parse(queryCache);
            if (new Date().getTime() - qcObj.time > 600000) {
                action = 3;
            }
            else {
                action = 2
            }
        } else {
            let obj = JSON.parse(result);
            if (new Date().getTime() - obj.time > 600000) {
                action = 2;
                let qcObj = JSON.parse(queryCache);
                if (new Date().getTime() - qcObj.time > 600000) {
                    action = 3;
                }
            }
            else {
                action = 1;
            }
        }
        let value, max, arr, obj;
        switch (action) {
            case 1:
                result = JSON.parse(lzString.decompressFromUTF16(JSON.parse(result).result));
                totalLength=queryLength;
                break;
            case 2:
                value = JSON.parse(lzString.decompressFromUTF16(JSON.parse(queryCache).result));
                max = Math.min(page * 10, value.length);
                arr = value.slice((page - 1) * 10, max);
                result = await getDetail(arr);
                obj = {
                    time: new Date().getTime(),
                    result: lzString.compressToUTF16(JSON.stringify(result))
                };
                totalLength=value.length;
                client.set(target + '_p' + page, JSON.stringify(obj));
                client.set(target + '_length', totalLength);
                break;
            case 3:
                value = await searchInDB(target);
                obj = {
                    time: new Date().getTime(),
                    result: lzString.compressToUTF16(JSON.stringify(value))
                };
                client.set(target, JSON.stringify(obj));
                max = Math.min(page * 10, value.length);
                arr = value.slice((page - 1) * 10, max);
                result = await getDetail(arr);
                obj = {
                    time: new Date().getTime(),
                    result: lzString.compressToUTF16(JSON.stringify(result))
                };
                totalLength=value.length;
                client.set(target + '_p' + page, JSON.stringify(obj));
                client.set(target + '_length', totalLength);
                break;
            default:
        }
        console.log(action);

        return {
            result:result,
            currentPage:page,
            pages:Math.floor(totalLength/10),
            totalLength:totalLength
        };
    } catch (e) {
        return false;
    }
};


module.exports = function (obj) {
    target = obj.target;
    getAsync('targets').then((val)=>{
        let arr=JSON.parse(val);
        let count=0;
        for (let item of arr){
            if(item.target===target){
                item.weight++;
                count++;
            }
        }
        if(!count){
            arr.push({
                target:target,
                weight:1
            });
        }
        client.set('targets',JSON.stringify(arr));
    });
    let page = obj.page || 1;
    return new Promise((resolve, reject) => {
        setTimeout(()=>{
            reject("timeout");
        },60000);
        getResult(target, page).then(val => {
            if (val) {
                resolve(val);
            } else {
                reject('error');
            }
        }).catch(e => {
            console.log("get cache error" + e);
            reject('error');
        });
    })
};
