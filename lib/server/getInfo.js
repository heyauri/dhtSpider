
const redis = require("../database/redis");
const utils=require("../utils");

let client = redis.client;
let getAsync = redis.getAsync;



client.on("error", function (err) {
    console.log("Error " + err);
});

module.exports =async function () {
    let countStr=await getAsync('currentCounts');
    let valueStr=await getAsync('valFilterData');
    let targetStr=await getAsync('targets');
    let targetsArr=JSON.parse(targetStr);
    targetsArr=utils.weightSort(targetsArr);
    client.set('targets',JSON.stringify(targetsArr));
    let arr=[];
    let limit=Math.min(targetsArr.length,100);
    for (let i=0;i<limit;i++){
        arr.push(targetsArr[i]);
    }
    return {
        counts:JSON.parse(countStr),
        targets:arr,
        val:JSON.parse(valueStr)
    }
};
