const indexOperation=require("../indexOperation");
const Leveldb=require("../database/levelOperate");
const redis = require("redis");

let client = redis.createClient();
const {promisify} = require('util');
const getAsync = promisify(client.get).bind(client);
let leveldb=new Leveldb();


client.on("error", function (err) {
    console.log("Error " + err);
});


let getCache=async function(){

};


module.exports=function(target){
    return new Promise((resolve,reject)=>{
        indexOperation.indexSearch(target).then(value => {
            console.log(value[0]);
            resolve(value);
        });
    })
};
