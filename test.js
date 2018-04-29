
//const Leveldb=require("./lib/database/levelOperate");
/*const torrentController=require("./lib/torrentController");
const utils=require("./lib/utils");*/
const config=require("./config");
const indexOperation=require("./lib/indexOperation");

//let db=new Leveldb();

//db.readAllMetadata();
//db.readAllInfohash();
/*console.log(db.getInfoHashQueryTimes("1442244"));
console.log(db.getInfoHashQueryTimes("3298f1800aeebd0081ec4d190e4704346225a220"));*/
/*db.getMetadata("ffb937bfed1087d7d04a4a6200f615d1d6b10d80").then(function(val){
    //console.log(JSON.parse(val));
/!*    let metadata=JSON.parse(val);
    metadata.info=utils.bufferRecover(metadata.info);
    console.log(metadata.info);
    console.log(metadata.info.name.toString());
    let filePaths='';
    if (Object.prototype.toString.call(metadata.info.files) === "[object Array]") {
        let arr=[];
        for(let item of metadata.info.files){
            if(item['path']){
                arr.push(filePaths+item['path'].toString());
            }
        }
        filePaths=arr.join(",");
    }
    else if(metadata.info.files){
        if(metadata.info.files['path']){
            filePaths=metadata.info.files['path'].toString();
        }
    }

    console.log(filePaths);*!/
});*/

/*
let tr=new torrentController();
tr.exportTorrent("fe2b41a96cc9cb5e5372a65fe490c45d53efd015");*/
/*

const moment=require('moment');
console.log(moment().format('YYYY/MM/DD hh:mm:ss'));*/

/*indexOperation.indexCount().then((values)=>{
   console.log(values);
});*/
/*let indexConstruction=indexOperation.indexConstruction();
indexConstruction.on("constructFinish",function(){
   console.log("event:construct finish");
});*/


//indexOperation.indexConstruction({source:config.databaseAddress.target,index:config.databaseAddress.index});

indexOperation.indexSearch("电影 1978 1080p hjfdbksjd bsfdkb aadad 666");