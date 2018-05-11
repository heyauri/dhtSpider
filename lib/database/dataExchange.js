/**
 * Offer a simple function to transfer the data from sqlite3 to mongodb
 *
 * Created version:0.1.0
 *
 */


const sqlite=require('./sqliteOperate');
const mongoDB=require('./mongoOperate');

const dbExchange={};

dbExchange.sqliteToMongo=function(){
    sqlite.queryInfoHashDB().then((rows)=>{
        rows.forEach((row,index)=>{
            console.log(index);
            mongoDB.addInfoHashRecord(row);
        })
    }).catch(error=>{
        console.log(error)
    });
};


module.exports=dbExchange;
