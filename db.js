
const Leveldb=require("./lib/database/levelOperate");

let db=new Leveldb();

db.db_metadata.put("test",[12,13,14]);
db.db_metadata.put("Object",{a:12});
db.db_metadata.get("Object",{asBuffer: false},function(err,value){
    console.log(value);
});

let testBuffer=new Buffer('21212');
let testobj={
    buffer:testBuffer
};

console.log(testobj);
console.log(new Buffer(JSON.parse(JSON.stringify(testobj)).buffer).toString());


db.insertMetadata("121",{aa:1222});
db.readAllMetadata();
