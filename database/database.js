/**
 * Created by Administrator on 2017/6/15.
 */


const sqliteOperator=require('./sqliteOperate');
const mongoDBOperator=require('./mongoOperate');

const config=require('../config');

if(config.databaseType==='sqlite'){
    module.exports=sqliteOperator;
}
else if(config.databaseType==='mongoDB'){
    module.exports=mongoDBOperator;
}