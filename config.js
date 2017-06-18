/**configuration of the spider
 * databaseType:
 * 1.sqlite  2.mongoDB
 *
 *
 */


const config={
    address:"0.0.0.0",
    port:6881,
    databaseType:'sqlite',
    //databaseType:'mongoDB',
    sqliteConfig:{
        //sqliteType:'multi',
        sqliteType:'single',
        sqliteMultiPrefixLength:2
    },
    mongoConfig:{
        address:'mongodb://127.0.0.1:27017/dht'
    },
    maxNodeNumber:95000,
    intervalTime:60000,
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
module.exports=config;