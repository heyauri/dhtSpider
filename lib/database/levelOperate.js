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
const lzString=require("lz-string");

const utils=require("../dhtSpider/utils.js");
let metadata_path =  config.databaseAddress.target;
let infohash_path =  config.databaseAddress.index;
let db_metadata = level(metadata_path,{maxFileSize:67108864,cacheSize:128108864,writeBufferSize:67108864});
let db_infohash = level(infohash_path,{maxFileSize:67108864,cacheSize:12810886,writeBufferSize:6710886});

class LevelDB {
    constructor() {
        this.db_metadata = db_metadata;
        this.db_infohash = db_infohash;
    }

    getDB(){
        return{
            db_index:this.db_infohash,
            db_target:this.db_metadata
        }
    }


    insertMetadata(infoHash, data) {
        let data_str=lzString.compressToUTF16(JSON.stringify(data));
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

    updateInfohash(data) {
        let infoHash=data.infoHash;
        db_infohash.get(infoHash,function(err,value){
            if(!value&&err){
                try{
                    if(err.type==="NotFoundError"){
                        let content={
                            name:data.name,
                            size:data.size,
                            filePaths:data.filePaths
                        };
                        let obj={
                            q:1,
                            t:moment().format('YYYY/MM/DD hh:mm:ss'),
                            c:lzString.compressToUTF16(JSON.stringify(content))
                        };
                        db_infohash.put(infoHash,JSON.stringify(obj));
                    }
                }catch(e) {}
            }
            else{
                try{
                    let obj=JSON.parse(value);
                    if(data.name&&!obj.c){
                        let content={
                            name:data.name,
                            size:data.size,
                            filePaths:data.filePaths
                        };
                        obj.c=lzString.compressToUTF16(JSON.stringify(content));
                    }
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

        let stream=db_metadata.createReadStream()
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
        db_infohash.createReadStream()
            .on('data', function (data) {
                console.log(data.key+" : "+data.value);
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