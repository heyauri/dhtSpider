/**
 * a class of operating the data of leveldb
 *
 * Created version:0.3.0
 *
 */
const path = require("path");
const level = require("level");
const config=require("../../config.js");
const moment=require('moment');

const utils=require("../utils.js");

let metadata_path =  config.databaseAddress.target;
let infohash_path =  config.databaseAddress.index;

let db_metadata = level(metadata_path,{maxFileSize:67108864,cacheSize:12810886,writeBufferSize:6710886});
let db_infohash = level(infohash_path,{maxFileSize:67108864});

class LevelDB {
    constructor() {
        this.db_metadata = db_metadata;
        this.db_infohash = db_infohash;
    }


    insertMetadata(infoHash, data) {
        let data_str=JSON.stringify(data);
        return new Promise(function (resolve, reject) {
            db_metadata.put(infoHash, data_str, function (err) {
                if (err) return reject(err);
                else {
                    resolve("success");
                }
            });
        });
    }

    getMetadata(infoHash){
        return new Promise(function(resolve,reject){
            db_metadata.get(infoHash,function (err, value) {
                if(err){
                    reject(err);
                }
                else{
                    resolve(value);
                }
            });
        });
    }

    getInfoHashQueryTimes(infoHash){
        return new Promise(function(resolve,reject){
            db_infohash.get(infoHash,function (err, value) {
                if(err){
                    if(err.type==="NotFoundError"){
                        reject("NotFoundError");
                    }
                    else {
                        reject(err);
                    }
                }
                else{
                    try{
                        let obj=JSON.parse(value);
                        resolve(obj.q);
                    }catch(err){
                        console.log(err);
                    }
                }
            });
        });
    }

    updateInfohash(infoHash) {
        db_infohash.get(infoHash,function(err,value){
            if(!value&&err){
                if(err.type==="NotFoundError"){
                    let obj={
                        q:1,
                        t:moment().format('YYYY/MM/DD hh:mm:ss')
                    };
                    db_infohash.put(infoHash,JSON.stringify(obj));
                }
            }
            else{
                try{
                    let obj=JSON.parse(value);
                    obj.q++;
                    db_infohash.put(infoHash,JSON.stringify(obj));
                }catch (e) {
                    console.log(e);
                }
            }
        });
    }

    readAllMetadata() {
        let _this=this;
        db_metadata.createReadStream()
            .on('data', function (data) {
                //console.log(data.key, '=', data.value)
                let metadata=JSON.parse(data.value);
                metadata.info=utils.bufferRecover(metadata.info);
                 /*let filePaths='';
                if (Object.prototype.toString.call(metadata.info.files) === "[object Array]") {
                    let arr=[];
                    for(let item of metadata.info.files){
                        if(item['path']){
                            arr.push(filePaths+item['path'].toString());
                        }
                    }
                    filePaths=arr.join(",");
                }
                metadata.filePaths=filePaths;
                _this.insertMetadata(data.key,metadata)*/
                if(!metadata.name||metadata.name==='???'){
                    console.log(metadata.filePaths);
                    db_metadata.del(data.key);
                    db_infohash.del(data.key);
                    console.log("del");
                }

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

    readAllInfohash() {
        db_infohash.createReadStream()
            .on('data', function (data) {
                console.log(data.key+" : "+data.value);
                //db_infohash.put(data.key,data.value.length)
                /*let obj={
                    q:data.value,
                    t:moment().format('YYYY/MM/DD hh:mm:ss')
                };
                db_infohash.put(data.key,JSON.stringify(obj));*/
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
}

module.exports = LevelDB;