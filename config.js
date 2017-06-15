/**
 * Created by Administrator on 2017/5/27.
 */
module.exports={
    address:"0.0.0.0",
    port:6881,
    databaseType:'sqlite',
    sqliteConfig:{
        sqliteType:'multi',
        sqliteMultiPrefixLength:2
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