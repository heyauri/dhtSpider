const redis = require("redis");
let client = redis.createClient();
const {promisify} = require('util');
const getAsync = promisify(client.get).bind(client);

module.exports={
    client,
    getAsync
};