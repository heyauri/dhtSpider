/**
 * a class of operating the data of linvodb3
 *
 * Created version:0.3.0
 *
 */
const path = require("path");
const level = require("level");

let metadata_path = path.join(process.cwd(), '/data/metadata');
let infohash_path = path.join(process.cwd(), '/data/infohash');

let db_metadata = level(metadata_path);
let db_infohash = level(infohash_path);

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
                        reject(false);
                    }
                }
                else{
                    resolve(value);
                }
            });
        });
    }

    updateInfohash(infoHash) {
        db_infohash.get(infoHash,function(err,value){
            if(!value&&err){
                if(err.type==="NotFoundError"){
                    db_infohash.put(infoHash,1);
                }
            }
            else{
                db_infohash.put(infoHash,parseInt(value)+1);
            }
        });
    }

    readAllMetadata() {
        db_metadata.createReadStream()
            .on('data', function (data) {
                console.log(data.key, '=', data.value)
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
                console.log(data.key, '=', data.value);
                //db_infohash.put(data.key,data.value.length)
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