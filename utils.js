/**
 * Created by Administrator on 2017/5/30.
 */

const crypto=require('crypto');

function getRandomId(){
    return crypto.createHash('sha1').update(crypto.randomBytes(20)).digest();
}

function getNeighborId(target, nid) {
    return Buffer.concat([target.slice(0, 15), nid.slice(15)]);
}

function decodeNodes(nodes) {
    let arr = [];
    const len = nodes.length;
    if (len % 26 !== 0) {
        return arr;
    }

    for (let i = 0; i + 26 <= nodes.length; i += 26) {
        arr.push({
            nid: nodes.slice(i, i + 20),
            address: nodes[i + 20] + '.' + nodes[i + 21] + '.' +
            nodes[i + 22] + '.' + nodes[i + 23],
            port: nodes.readUInt16BE(i + 24)
        });
    }

    return arr;
}

module.exports={
    getRandomId,
    getNeighborId,
    decodeNodes
}