
const Leveldb=require("./lib/database/levelOperate");
const utils=require("./lib/utils");

let db=new Leveldb();

//db.readAllMetadata();
db.readAllInfohash();

db.db_metadata.get("84d29d33290b8b8e76a270ae784132c1e3804d83",function(err,value){
    if(err) return console.log(err);
    let obj=JSON.parse(value);
    console.log(obj);
    console.log(utils.bufferRecover(obj).info.files[0].path.toString());
});
