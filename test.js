
const Leveldb=require("./lib/database/levelOperate");
const torrentController=require("./lib/dhtSpider/torrentController");
const utils=require("./lib/utils");

const bencode=require("bencode");
const fs=require("fs");
const path=require("path");
const config=require("./config");
const lzString=require("lz-string");
const indexOperation=require("./lib/indexOperation");
let db=new Leveldb();
/*
let db_index=db.getDB().db_index;
db_index.get('ac154793a0c72b9bceaadf259019a1001806ff31').then(value => console.log(value));*/
/*let db_target=db.getDB().db_target;
let count=0;
db_index.createReadStream().on('data', function (data) {
    console.log(data);
    if(data.key.indexOf("001_")<0&&data.key.indexOf("002_")<0&&data.key.indexOf("003_")<0){
        try{
            let obj=JSON.parse(data.value);
            let c=lzString.decompressFromUTF16(obj.c);
            console.log(c);
        }catch (e) {

        }
    }
}).on('end', function () {
    console.log('Stream ended');
    console.log(count);
});*/





/*
db.db_metadata.get("123").then((val)=>{
    console.log("infohash:"+val);
});*/
/*
db.db_metadata.get("1c96886648b41f9a1236f0b87dd532df1e69d767").then((val)=>{
    let str=lzString.decompressFromUTF16(val);
    console.log(str);
    let obj=JSON.parse(str);
    console.log(utils.bufferRecover(obj).files)
});
*/



//db.readAllInfohash();
//db.indexToLog();
//db.readAllMetadata();
/*
indexOperation.indexCount().then((values)=>{
   console.log(values);
});*/
/*
let count=0;
let delCount=0;

let stream = db.getDB().db_index.createReadStream()
    .on('data', function (data) {
        if(data.value.indexOf("indexed") <0 && (data.key.indexOf('001_') < 0 && data.key.indexOf('002_') < 0 && data.key.indexOf('003_') < 0)){
            count++;
            if(count<20)console.log(data);
        }
    })
    .on('error', function (err) {
        console.log('Oh my!', err)
    })
    .on('close', function () {
        console.log('Stream closed')
    })
    .on('end', function () {
        console.log('Stream ended');
        setTimeout(()=>{
            console.log(count,delCount)
        },1000)
    });*/
let indexConstruction=indexOperation.indexConstruction();
indexConstruction.on("constructFinish",function(){
    console.log("event:construct finish");
});

/*
indexOperation.indexBackup().on('backupFinish',function(){
    console.log('backupFinish');
});*/

//indexOperation.loadBackup();
