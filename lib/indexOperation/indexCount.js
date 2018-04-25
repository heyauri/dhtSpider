const level=require("level");
const path=require("path");

module.exports=function(options){
    let db_index,db_target;
    if (options.length) {
        let indexPath =  options[0] || '/data/index';
        let targetPath = options[1];
        console.log(indexPath);
        console.log(targetPath);
        db_index = level(indexPath);
        db_target = level(targetPath);
        let promise_1=new Promise((resolve,reject)=>{
            let count=0;
            let stream = db_index.createReadStream();
            stream.on('data', function (data) {
                if (data.key.indexOf('001_') <0 && data.key.indexOf('002_')<0 ) {
                    count++;
                }
            }).on('error', function (err) {
                console.log('Oh my!', err);
                reject(err);
            }).on('close', function () {
                console.log('Stream closed');
            }).on('end', function () {
                console.log('Stream ended');
                resolve(count);
                console.log("scan count:"+count);
            });
        });
        let promise_2=new Promise((resolve,reject)=>{
            let count=0;
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
                console.log("scan count:"+count);
            });
        });

        return new Promise((resolve,reject)=>{
            Promise.all([promise_1,promise_2]).then((values)=>{
                resolve(values);
            }).catch((e)=>{
                console.log(e);
            });
        });



    }
    else {
        throw new Error("options invalid");
    }
};