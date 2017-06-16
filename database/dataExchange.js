/**
 * Created by Administrator on 2017/6/16.
 */

const sqlite=require('./sqliteOperate');
const mongoDB=require('./mongoOperate');

const dbExchange={};

dbExchange.sqliteToMongo=function(){
    sqlite.queryInfoHashDB().then((rows)=>{
        rows.forEach(row=>{
            mongoDB.addInfoHashRecord(row);
        })
    }).catch(error=>{
        console.log(error)
    });
};


module.exports=dbExchange;
