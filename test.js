
const Leveldb=require("./lib/database/levelOperate");
const utils=require("./lib/utils");

let db=new Leveldb();

db.readAllMetadata();
db.readAllInfohash();
console.log(db.getInfoHashQueryTimes("1442244"));
console.log(db.getInfoHashQueryTimes("3298f1800aeebd0081ec4d190e4704346225a220"));