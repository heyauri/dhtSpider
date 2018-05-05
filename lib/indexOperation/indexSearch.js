const Leveldb=require("../database/levelOperate");
const tokenizer=require("./tokenize");
const natural=require("natural");

let leveldb=new Leveldb();
let db_index=leveldb.getDB().db_index;

let indexSearch= function(str){
    let keywords=tokenizer.tokenize(str);
    let indexPromiseArr=[];
    for (let keyword of keywords){
        indexPromiseArr.push(getIndex(keyword));
    }
    return new Promise((resolve,reject)=>{
        Promise.all(indexPromiseArr).then(async (values)=>{
            let indexesArr=[];
            for(let item of values){
                indexesArr=indexesArr.concat(item);
            }
            indexesArr=deduplicate(indexesArr);
            indexesArr=indexClean(indexesArr,str);
            let names=await getNames(indexesArr);
            let result=[];
            let threshold=0;
            if(names.length>500){
                threshold=names.length*0.0002;
            }
            threshold>8?threshold=8:threshold;
            for (let name of names){
                let weight=calculateWeight(name,str,keywords);
                if(weight>threshold){
                    result.push({
                        name:name,
                        weight:weight
                    })
                }
            }
            weightSort(result);
            resolve(result);
        });
    });

};

let indexClean=function(indexesArr,target){
    let result=[];
    let threshold=0;
    if(indexesArr.length>200){
        threshold=indexesArr.length*0.001;
    }
    threshold>0.8?threshold=0.8:threshold;
    for(let index of indexesArr){
        if(natural.JaroWinklerDistance(index,target)>threshold){
            result.push(index);
        }
    }
    console.log(result.length);
    return result;
};

let getIndex=function(keyword){
    let indexesArr=[],promiseArr=[];
    let shortKeys=tokenizer.getShortKeys(keyword);
    let threshold=4;
    indexesArr.length>100?threshold=3:threshold;
    for(let key of shortKeys){
        promiseArr.push(db_index.get("001_"+key).then((value)=>{
            try{
                let arr=JSON.parse(value);
                for(let item of arr){
                    if(natural.LevenshteinDistance(item,keyword)<threshold){
                        indexesArr.push(item);
                    }
                }
            }catch (e) {console.log(e);}
        }).catch((e)=>{
            console.log(e);
        }));
    }
    return new Promise((resolve,reject)=>{
        Promise.all(promiseArr).then(()=>{
            indexesArr=deduplicate(indexesArr);
            resolve(indexesArr);
        });
    });
};
let getNames=function(keys){
    let namesArr=[],promiseArr=[];
    for(let key of keys){
        promiseArr.push(db_index.get("002_"+key).then((value)=>{
            try{
                let arr=JSON.parse(value);
                namesArr=namesArr.concat(arr);
            }catch (e) {console.log(e);}
        }).catch((e)=>{
            console.log(e);
        }));
    }
    return new Promise((resolve,reject)=>{
        Promise.all(promiseArr).then(()=>{
            namesArr=deduplicate(namesArr);
            resolve(namesArr);
        });
    });
};

let deduplicate=function(arr){
    let result=[];
    let delMarks = [];
    for (let i = 0; i < arr.length - 1; i++) {
        for (let j = i + 1; j < arr.length; j++) {
            if (arr[i] === arr[j]) {
                if(delMarks.indexOf(j)<0){
                    delMarks.push(j);
                }
            }
        }
    }
    for(let i=0;i<arr.length;i++){
        if(delMarks.indexOf(i)<0){
            result.push(arr[i]);
        }
    }
    return result;
};

let calculateWeight=function(name,target,keywords){
    let result=0;
    let jd=natural.JaroWinklerDistance(name,target);
    let ld=natural.LevenshteinDistance(name,target,{
        substitution_cost: 0.5
    });
    let osad=natural.DamerauLevenshteinDistance(name,target,{restricted:true});
    for(let keyword of keywords){
        if(name.indexOf(keyword)>-1){
            result+=3;
        }
    }
    result+=10/(ld+9)+jd+5/(4+osad);
    return result
};

let weightSort=function(arr){
    for(let i=0;i<arr.length-1;i++){
        let maxIndex=i;
        for(let j=i+1;j<arr.length;j++){
            if(arr[j].weight>arr[maxIndex].weight){
                maxIndex=j;
            }
        }
        if(i!==maxIndex){
            let temp=arr[i];
            arr[i]=arr[maxIndex];
            arr[maxIndex]=temp;
        }
    }
    return arr;
};

module.exports=indexSearch;