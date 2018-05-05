const indexOperation=require("../indexOperation");
const Leveldb=require("../database/levelOperate");

let leveldb=new Leveldb();

module.exports=function(target){
    return new Promise((resolve,reject)=>{
        indexOperation.indexSearch(target).then(value => {
            console.log(value);
            resolve(value);
        });
    })
};
