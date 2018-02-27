
const Leveldb=require("./lib/database/levelOperate");
const torrentController=require("./torrentController");
const utils=require("./lib/utils");

let db=new Leveldb();

//db.readAllMetadata();
//db.readAllInfohash();
/*console.log(db.getInfoHashQueryTimes("1442244"));
console.log(db.getInfoHashQueryTimes("3298f1800aeebd0081ec4d190e4704346225a220"));*/
/*db.getMetadata("fe2b41a96cc9cb5e5372a65fe490c45d53efd015").then(function(val){
    console.log(val);
});*/

let tr=new torrentController();
tr.exportTorrent("fe2b41a96cc9cb5e5372a65fe490c45d53efd015");