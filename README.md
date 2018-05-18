# DHTSpider

## Introduction
A torrents-spider program in nodejs.  

According to the "distributed sloppy hash table"(DHT) Protocol,this dhtSpider can help you to get the infohash code (use for the magnet download) and its torrents.

There is a integrated search engine that can construct the indexes for these torrents. However,considering a indexes including files information is useless and redundant, it merely support index construction based on its name.

Database: leveldb and redis(used for cache the search result).

一个以nodejs实现的种子爬虫程序.

本程序实现了infohash的抓取以及种子下载,内置一个对种子的搜索引擎.

然而因考虑到要支持对种子内部文件的搜索无用且冗余,该程序只支持对种子名称的索引.

数据库类型:leveldb 和 redis(用于缓存搜索结果).

## Usage

#### 1.Install the dependency 

    npm install
    
 And install redis.
    
#### 2.Initialize the software

You can modified the configuration(in config.js) to initialize the plugin.Here is a sample configuration.

    const config={
         address:"0.0.0.0",
    		port:6881,
         databaseType:'levelDB',
         databaseAddress:{
             target:process.cwd()+"/data/metadata",
             index:process.cwd()+"/data/index",
             backup:process.cwd()+"/data/index_backup"
         },
         maxNodeNumber:200,
         maxRequestLength:800,
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
    

    

#### 3.start it
        node index.js
        
        
### Additional Function

#### 1.backup indexes

Such program will backup the index database to a additional database named "index_backup" for index database really play an important role in this program.

You can load in by use the loadBackup function in /lib/indexOperation

#### 2.value filter

After running it for weeks, I find out that there is a great deal of useless torrents and these torrents have allocated a large space.
Most of these torrents have some meaningless name, such as 12345.ts and �����.

In light of this, the valueFilter funtions are used to delete those meaningless torrents (its infohash, name, or even files information are still saved in the index database).

According to my experiment, about 8% of torrents are meaningless (to me).

#### 3.server

This program is integrated a koa2-based server too.

The interface /btSearch are able to be used to search the torrents you want (only if they have already been saved in the database).

Additionally, /getInfo could return the current number of saved torrents and its previous search record.

#### 4.export torrents

By /btSearch, you will only get the infohash of your target torrents.

If you want to get its original torrent files, a function exportTorrents is offered (located at /lib/dhtspider/torrentController).

Well, I think generally a infohash is enough for this.



## Else

#### Demo address: [www.bthub.info](http://www.bithub.info)


Cheers.









        