/**configuration of the spider
 * databaseType:
 * 1.sqlite(abandoned)  2.mongoDB(abandoned) 3.levelDB(default and recommended)
 *
 *
 */


const config={
    address:"0.0.0.0",
    port:6881,
    databaseType:'levelDB',
    databaseAddress:{
        target:process.cwd()+"/data/metadata",
        index:process.cwd()+"/data/index"
    },
    maxNodeNumber:200,
    maxRequestLength:10000,
    intervalTime:30000,
    downloadMaxTime:160000,
    bootstrapNodes:[{
        address: 'router.utorrent.com',
        port: 6881
    }, {
        address: 'router.bittorrent.com',
        port: 6881
    }, {
        address: 'dht.transmissionbt.com',
        port: 6881
    }],
    languageForbidden:['']
};
module.exports=config;