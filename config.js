/**
 * Created by ruiyeah on 2017/5/27.
 *
 * databaseType:
 * 1.sqlite  2.mongoDB
 *
 */
module.exports={
    address:"0.0.0.0",
    port:6881,
    //databaseType:'sqlite',
    databaseType:'mongoDB',
    sqliteConfig:{
        //sqliteType:'multi',
        sqliteType:'single',
        sqliteMultiPrefixLength:2
    },
    mongoConfig:{
        address:'mongodb://127.0.0.1:27017/dht'
    },
    maxNodeNumber:95000,
    intervalTime:50,
    downloadMaxTime:10000,
    bootstrapNodes:[{
        address: 'router.utorrent.com',
        port: 6881
    }, {
        address: 'router.bittorrent.com',
        port: 6881
    }, {
        address: 'dht.transmissionbt.com',
        port: 6881
    }]
};