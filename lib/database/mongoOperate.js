

const mongoose = require('mongoose');

//config
const config = require('../../config').mongoConfig;

mongoose.connect(config.address);

const db = mongoose.connection;

db.on('error', () => {
    console.log('mongoDB connect error occurred');
});

db.once('open', () => {
    console.log('mongoDB connect successfully');
});

const InfoHashSchema = new mongoose.Schema({
    info_hash: String,
    value: Number,
    torrent_download: Boolean,
    createTime:{
        type:Date,
        default:Date.now
    },
    updateTime:{
        type:Date,
        default:Date.now
    }
});

const InfoHashModel = mongoose.model('infoHash', InfoHashSchema);

const mongoOperator = {};

//from sqlite
mongoOperator.addInfoHashRecord = function (dataObj) {
    let infoHash = dataObj.key;
    InfoHashModel.find({info_hash: infoHash}, function (error, rows) {
        if (error) {
            console.log(error);
            return false;
        }
        if (Object.prototype.toString.call(rows) !== '[object Array]') {
            return false;
        }
        if (rows.length === 0) {
            let infoHashEntity = new InfoHashModel({
                info_hash: infoHash,
                value: dataObj.value,
                torrent_download: dataObj.torrent_download
            });
            infoHashEntity.save((error, result) => {
                if (error) {
                    console.log('mongoDB insert error')
                }
                else {
                    console.log('insert successfully:' + infoHash);
                }
            })
        }
        else {
            if (rows[0].value !== dataObj.value || rows[0].torrent_download != dataObj.torrent_download) {
                /*console.log(rows[0].value!==dataObj.value);
                 console.log(rows[0].torrent_download!=dataObj.torrent_download);*/
                let updateObj = {};
                if (dataObj.value > rows[0].value) {
                    updateObj['value'] = dataObj.value;
                }
                if (rows[0].torrent_download !== dataObj.torrent_download && dataObj.torrent_download == 1) {
                    updateObj['torrent_download'] = 1;
                }
                InfoHashModel.update({info_hash: infoHash}, updateObj, function (error, result) {
                    if (error) {
                        console.log('mongoDB update error')
                    }
                    else {
                        console.log('update successfully:' + infoHash);
                    }
                })
            }
        }
    })
};

//from spider
mongoOperator.saveInfoHash = function (infoHash) {
    InfoHashModel.find({info_hash: infoHash}, function (error, rows) {
        if (error) {
            console.log(error);
            return false;
        }
        if (Object.prototype.toString.call(rows) !== '[object Array]') {
            return false;
        }
        if (rows.length === 0) {
            let infoHashEntity = new InfoHashModel({
                info_hash: infoHash,
                value: 1,
                torrent_download: 0
            });
            infoHashEntity.save((error, result) => {
                if (error) {
                    console.log('mongoDB insert error')
                }
                else {
                    console.log('insert successfully:' + infoHash);
                }
            })
        }
        else {
            let updateObj = {};
            updateObj['value'] = rows[0].value + 1;
            InfoHashModel.update({info_hash: infoHash}, updateObj, function (error, result) {
                if (error) {
                    console.log('mongoDB update error')
                }
                else {
                    console.log('update successfully:' + infoHash);
                }
            })
        }
    })
};

module.exports = mongoOperator;




