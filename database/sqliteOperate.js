/**
 * Created by Administrator on 2017/6/12.
 */
const Sqlite3 = require('./sqlite3');
const config = require('../config').sqliteConfig;

const dbOperator = {};

if (config.sqliteType == 'single') {
    dbOperator.handler = new Sqlite3();
    dbOperator.handler.openSingleDB();
    dbOperator.handler.createInfoHashTable();
} else {
    if (config.sqliteMultiPrefixLength < 1) {
        config.sqliteMultiPrefixLength = 1
    }
}

dbOperator.saveInfoHash = function (infoHash) {
    let obj = {
        tableName: 'info_hash',
        key: 'key',
        value: infoHash
    };

    let sqlite3 = new Sqlite3();
    switch (config.sqliteType) {
        case 'single':
            sqlite3 = this.handler;
            break;
        case 'multi':
            console.log('create new handler');
            sqlite3.openMultiDB(infoHash.substr(0, config.sqliteMultiPrefixLength));
            break;
        default:
            console.log("storage type of database haven't been set");
            return;
    }
    sqlite3.createInfoHashTable();
    sqlite3.fetchRow(obj, function (rows) {
        if (Object.prototype.toString.call(rows) === '[object Array]' && rows.length > 0) {
            sqlite3.updateRecord({tableName: 'info_hash', id: rows[0]['id'], items: {value: rows[0]['value'] + 1}})
        }
        else {
            sqlite3.addRecord({tableName: 'info_hash', items: {key: infoHash, value: 1, torrent_download: 0}})
        }

        if (config.databaseType === 'multi') {
            sqlite3.closeDB();
        }
    });
};

dbOperator.singleToMulti = function () {
    let singleDB = new Sqlite3();
    singleDB.openSingleDB('temp.db');

    let indexDB = new Sqlite3();
    indexDB.openSingleDB('index.db');
    indexDB.createIndexTable();

    let queryObj = {
        tableName: 'temp'
    };
    //singleDB.fetchRow(queryObj, function (rows) {
    singleDB.fetchAllRow(queryObj, function (rows) {
        console.log(rows.length);
        let execRows=rows;
        //execRows = rows.slice(16000, 19000);
        execRows.forEach((row, index) => {
            let prefix = row['key'].substr(0, config.sqliteMultiPrefixLength);
            let indexOperate = new Promise((resolve, reject) => {
                let indexObj = {
                    tableName: 'index_table',
                    key: 'prefix',
                    value: prefix
                };
                indexDB.fetchRow(indexObj, (indexRows) => {
                    if (Object.prototype.toString.call(indexRows) === '[object Array]' && indexRows.length == 0) {
                        let obj = {
                            tableName: 'index_table',
                            items: {
                                prefix: prefix
                            }
                        };
                        indexDB.addRecord(obj, () => {
                            resolve('success');
                        })
                    }
                    else if (Object.prototype.toString.call(indexRows) === '[object Array]') {
                        resolve('success');
                    }
                    else {
                        reject('error')
                    }
                })
            });

            indexOperate.then((type) => {
                if (type === 'success') {
                    let infoHash = row.key;
                    let value = row.value;
                    let torrent_download = 0;
                    if (row.torrent_download === 1 || row.torrent_download === '1') {
                        torrent_download = 1;
                    }
                    let multiHandler = new Sqlite3();
                    multiHandler.openMultiDB(prefix);
                    multiHandler.createInfoHashTable().then(() => {
                        console.log(index + '/' + rows.length);
                        let multiQuery = {
                            tableName: 'info_hash',
                            key: 'key',
                            value: infoHash
                        };
                        multiHandler.fetchRow(multiQuery, (multiRows) => {
                            if (Object.prototype.toString.call(multiRows) === '[object Array]' && multiRows.length > 0) {
                                let updateObj = {
                                    tableName: 'info_hash',
                                    items: {
                                        value: value,
                                        torrent_download: torrent_download || 0
                                    },
                                    conditions: {
                                        key: infoHash
                                    }
                                };
                                multiHandler.updateRecord(updateObj, () => {
                                    //multiHandler.closeDB();
                                })
                            }
                            else {
                                multiHandler.addRecord({
                                        tableName: 'info_hash',
                                        items: {key: infoHash, value: value, torrent_download: torrent_download}
                                    },
                                    () => {
                                        //multiHandler.closeDB();
                                    }
                                );
                            }
                        });
                    });
                }
            }).catch(error => {
                console.log('error', error);
            })
        })

    })
};


module.exports = dbOperator;