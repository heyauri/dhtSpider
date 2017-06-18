# DHTSpider

## Introduction
A simple crawler in nodejs.  
According to the "distributed sloppy hash table"(DHT) Protocol,the dhtSpider can help you to get the infohash code (mainly use for the magnet download,however,the function of downloading bittorrent and their metadata haven't been implemented yet).
For some complicated reasons(GFW,etc.),such crawler support both sqlite3 and mongoDB to meet your demands of Database.

一个以nodejs实现的简单DHT网络爬虫.
现在主要实现了抓取infoHash的功能,可用于创建磁力链接,然而下载种子以及相关信息的功能尚未实现.
由于某些众所周知的网络原因,该爬虫支持sqlite3以及mongoDB两种数据库.

## Usage
#### 1.Install the dependency 

    npm install
    
#### 2.Initialize the software

You can modified the configuration(in config.js) to initialize the plugin.Here is a sample configuration.

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
    

    

#### 3.start it
        node index.js



        