const Leveldb = require("../database/levelOperate");
const tokenize = require("./tokenize");
const moment = require("moment");
let levelDB = new Leveldb();
let langjudge=require("langjudge");

module.exports = function () {
    let db_index, db_target;
    let dbs = levelDB.getDB();
    db_target = dbs.db_target;
    db_index = dbs.db_index;
    let promise_1 = new Promise((resolve, reject) => {
        let count = 0;
        let stream = db_index.createReadStream();
        stream.on('data', function (data) {
            if (data.key.indexOf('001_') < 0 && data.key.indexOf('002_') < 0 && data.key.indexOf('003_') < 0) {
                count++;
            }
            if (data.value.indexOf('t') < 0) {
                let obj={
                    q:data.value,
                    t:moment().format('YYYY/MM/DD hh:mm:ss')
                };
                //db_index.put(data.key,JSON.stringify(obj));
            }
        }).on('error', function (err) {
            console.log('Oh my!', err);
            reject(err);
        }).on('close', function () {
            console.log('Stream closed');
        }).on('end', function () {
            console.log('Stream ended');
            resolve(count);
            console.log("indexCount scan index:" + count);
        });
    });
    let promise_2 = new Promise((resolve, reject) => {
        let count = 0;
        let stream = db_target.createKeyStream();
        stream.on('data', function (data) {
            count++;
        }).on('error', function (err) {
            console.log('Oh my!', err);
            reject(err);
        }).on('close', function () {
            console.log('Stream closed');
        }).on('end', function () {
            console.log('Stream ended');
            resolve(count);
            console.log("indexCount scan target:" + count);
        });
    });

    return new Promise((resolve, reject) => {
        Promise.all([promise_1, promise_2]).then((values) => {
            resolve(values);
        }).catch((e) => {
            console.log(e);
        });
    });

};