//init the database
var fs = require("fs");
var sqlite3 = require('sqlite3').verbose();


var db = new sqlite3.Database('temp.db');


class handler{
    constructor(){
        this.db=false;
        if(!fs.existsSync(__dirname+'/sqliteInfohash/')) {
            console.log("Creating database directory.");
            fs.mkdirSync(__dirname+'/sqliteInfohash/');
        }
    }

    openSingleDB(input){
        var fileName=input||'infohash.db';
        var exists = fs.existsSync(fileName);
        if(!exists) {
            console.log("Creating DB file.");
            fs.openSync(fileName, "w");
        }
        this.db=new sqlite3.Database(fileName)
    }

    openMultiDB(prefix){
        var dirName =__dirname+'/sqliteInfohash/'+prefix.substr(0,1)+'/';
        var fileName =dirName+prefix+".db";
        var dirExists = fs.existsSync(dirName);
        if(!dirExists) {
            console.log("Creating database directory.");
            fs.mkdirSync(dirName);
        }
        var exists = fs.existsSync(fileName);
        if(!exists) {
            console.log("Creating database file.");
            fs.openSync(fileName, "w");
        }
        this.db=new sqlite3.Database(fileName);
    }

    createInfoHashTable() {
        return new Promise((resolve,reject)=>{
            this.db.run("CREATE TABLE IF NOT EXISTS info_hash (id INTEGER PRIMARY KEY AUTOINCREMENT,key VARCHAR(255),value INT(255),torrent_download INT(2))"
                ,function (err) {
                if (err) {
                    console.log('fail on delete ' + err);
                    reject(err)
                } else {
                    resolve('success');
                }
            });
        });
    }
    createIndexTable() {
        return new Promise((resolve,reject)=>{
            this.db.run("CREATE TABLE IF NOT EXISTS index_table (id INTEGER PRIMARY KEY AUTOINCREMENT,prefix VARCHAR(255))",function (err) {console.log(err);
                if (err) {
                    console.log('fail on delete ' + err);
                    reject(err)
                } else {
                    resolve('success');
                }
            });
        });

    }

    addRecord(obj, callback) {
        var sql = "insert into ";
        var table = obj['tableName'];
        var keys = [];
        var valueString = [];
        var values = [];
        for (var key in obj.items) {
            keys.push(key);
            valueString.push("?");
            values.push(obj.items[key]);
        }
        keys = keys.join(",");
        valueString = valueString.join(",");
        sql = sql + table + " (" + keys + ") values(" + valueString + ")";
        this.db.run(sql, values, function (err) {
            if (err) {
                console.log('fail on add ' + err);
                callback && callback(err);
            } else {
                callback && callback();
            }
        })
    }

    fetchAllRow(obj,callback){
        var sql="select * from ";
        var table = obj.tableName;
        this.db.all(sql+table,function(err, rows) {
            if (err) {
                console.log('fail on all ' + err);
                callback && callback(err);
            } else {
                callback && callback(rows);
            }
        });
    }


    fetchRow(obj,callback){
        var sql="select * from ";
        var table = obj.tableName;
        var key=obj.key;
        var value=obj.value;

        sql=sql+table+" where "+key+" = ?";
        this.db.all(sql,[value],function(err, rows) {
            if (err) {
                console.log('fail on all ' + err);
                callback && callback(err);
            } else {
                callback && callback(rows);
            }
        });

    };


    deleteRecord(obj,callback){
        var sql="delete  from  ";
        var table = obj.tableName;

        var keys=[];
        console.log(obj.items);
        for (var key in obj.items) {
            keys.push(key+" = "+obj.items[key]);
        }
        keys = keys.join(" AND ");
        sql = sql + table+" where "  + keys;
        console.log(sql);
        this.db.run(sql, function (err) {
            if (err) {
                console.log('fail on delete ' + err);
                callback && callback(err);
            } else {
                callback && callback();
            }
        })

    }

    updateRecord(obj,callback){
        var sql="update ";
        var table = obj.tableName;

        var keys=[];
        for (var key in obj.items) {
            keys.push(key+" = "+obj.items[key]);
        }
        keys = keys.join(" , ");
        if(obj.id){
            sql = sql + table+" SET "  + keys+" where id="+obj.id;
        }
        else if(obj.conditions){
            var conditions=[];
            for (var key in obj.conditions) {
                conditions.push(key+" = '"+obj.conditions[key]+"'");
            }
            conditions=conditions.join(" , ");
            sql = sql + table+" SET "  + keys+" where "+conditions;
        }
        console.log(sql);
        this.db.run(sql, function (err) {
            if (err) {
                console.log('fail on update ' + err);
                callback && callback(err);
            } else {
                callback && callback();
            }
        })

    };

    closeDB() {
        db.close();
    }
}












module.exports = handler;