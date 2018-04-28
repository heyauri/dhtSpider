const natural = require('natural');
const langjudge = require("langjudge");
const Segmentit = require('segmentit').default;
const useDefault = require('segmentit').useDefault;
const segmentit = useDefault(new Segmentit());
let NGrams = natural.NGrams, tokenizerJP = new natural.TokenizerJa(), tokenizerDefault = new natural.WordTokenizer();
let tokenizerRu=natural.AggressiveTokenizerRu();
let tokenizerFr=natural.AggressiveTokenizerFr();
let tokenizerEs=natural.AggressiveTokenizerEs();



let getToken=function(str){
    let result=[];
    try{
        let types = langjudge.langAllContain(str);
        if (types.indexOf("Japanese") > -1) {
            let arr = tokenizerJP.tokenize(str);
            for (let item of arr) {
                result.push(item);
            }
        }
        else if (types.indexOf("Chinese") > -1) {
            let arr = segmentit.doSegment(str, {
                stripPunctuation: true
            });
            for (let item of arr) {
                result.push(item.w);
            }
        }
        else if(types.indexOf("English") > -1) {
            let arr = tokenizerDefault.tokenize(str);
            for (let item of arr) {
                result.push(item);
            }
        }
        else{
            let arr = tokenizerDefault.tokenize(str);
            for (let item of arr) {
                result.push(item);
            }
        }
        try{
            if (types.indexOf("Cyrillic") > -1) {
                let arr = tokenizerRu.tokenize(str);
                for (let item of arr) {
                    result.push(item);
                }
            }
            else if(types.indexOf("French") > -1) {
                let arr = tokenizerFr.tokenize(str);
                for (let item of arr) {
                    result.push(item);
                }
            }
            else if(types.indexOf("Spanish") > -1) {
                let arr = tokenizerEs.tokenize(str);
                for (let item of arr) {
                    result.push(item);
                }
            }
        }catch (e) {

        }
    }catch (e) {
        console.log(e);
    }
    return result;
};
let tokenize = function (str) {
    let arr = str.split(" "),result=[];
    for(let item  of arr){
        result=result.concat(getToken(item));
    }
    result=deduplication(result);
    return result;
};

let deduplication=function(arr){
    let result=[];
    let delMarks = [];
    for (let i = 0; i < arr.length - 1; i++) {
        for (let j = i + 1; j < arr.length; j++) {
            if (arr[i] === arr[j]) {
                delMarks.push(j);
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

let getShortKeys=function(str){
    str=str.replace(/[\ |\~|\`|\!|\@|\#|\$|\%|\^|\&|\*||\-|\_|\+|\=|\||\\||\{|\}|\;|\:|\"|\'|\,|\<|\.|\>|\/|\?]/g,"");
    let result=str.split("");
    return deduplication(result);
};


module.exports={
    tokenize,
    getShortKeys,
    deduplication
};