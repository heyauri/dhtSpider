const natural = require('natural');
const langjudge = require("langjudge");
const Segmentit = require('segmentit').default;
const useDefault = require('segmentit').useDefault;
const segmentit = useDefault(new Segmentit());
let NGrams = natural.NGrams, tokenizerJP = new natural.TokenizerJa(), tokenizerDefault = new natural.WordTokenizer();


let tokenize = function (str) {
    let result = [];
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
        else if (types.indexOf("English") > -1) {
            let arr = tokenizerDefault.tokenize(str);
            for (let item of arr) {
                result.push(item);
            }
        }
        let delMarks = [];
        for (let i = 0; i < result.length - 1; i++) {
            for (let j = i + 1; j < result.length; j++) {
                if (result[i] === result[j]) {
                    delMarks.push(j);
                }
            }
        }
        for (let item of delMarks) {
            result.splice(item, 1)
        }
    }catch (e) {
        console.log(e);
    }
    return result;
};


module.exports=tokenize;