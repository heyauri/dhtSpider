/**configuration of the spider
 * databaseType:
 * 1.sqlite  2.mongoDB 3.levelDB(default and recommended)
 *
 *
 */


const config={
    address:"0.0.0.0",
    port:6881,
    databaseType:'levelDB',
    sqliteConfig:{
        //sqliteType:'multi',
        sqliteType:'single',
        sqliteMultiPrefixLength:2
    },
    mongoConfig:{
        address:'mongodb://127.0.0.1:27017/dht'
    },
    maxNodeNumber:1000,
    maxRequestLength:10000,
    intervalTime:30000,
    downloadMaxTime:60000,
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
module.exports=config;