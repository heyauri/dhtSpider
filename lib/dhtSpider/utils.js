const crypto = require('crypto');

function getRandomId() {
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

/**encode the node-list on findNode request
 *
 * @param nodes
 * @returns {Buffer}
 */

function encodeNodes(nodes) {
    return Buffer.concat(nodes.map((node) => {
            return Buffer.concat([node.nid, encodeIP(node.address), encodePort(node.port)])
        })
    )
}


function encodeIP(ip) {
    return Buffer.from(ip.split('.').map((i) => parseInt(i)))
}

function encodePort(port) {
    const buffer = Buffer.alloc(2);
    buffer.writeUInt16BE(port, 0);
    return buffer
}

/**Transfer data from Object(Buffer) to Buffer
 *
 * When parse the stringify Buffer, it will return an Object: {type:'Buffer',data:xxxxxxx}
 * And this function is used to recover it from this type of Object yo Buffer
 *
 * @param obj
 * @returns {*}
 */


function bufferRecover(obj) {
    for (let item in obj) {
        switch (Object.prototype.toString.call(obj[item])) {
            case '[object Object]':
                obj[item] = bufferRecover(obj[item]);
                break;
            case '[object Array]':
                bufferRecover(obj[item]);
                break;
            case '[object String]':
                if (item == 'type' && obj[item] == 'Buffer') {
                    return new Buffer(obj);
                }
                break;
            default:
                break;
        }
    }
    return obj;
}

function metadataWrapper(infoHash,metadata,rinfo){
    let torrentType = "single";
    let filePaths='';
    if (Object.prototype.toString.call(metadata.info.files) === "[object Array]") {
        torrentType="multiple";
        let arr=[];
        for(let item of metadata.info.files){
            if(item['path']){
                arr.push(filePaths+item['path'].toString());
            }
        }
        filePaths=arr.join(",");
    }
    else if(metadata.info.files){
        if(metadata.info.files['path']){
            filePaths=metadata.info.files['path'].toString();
        }
    }
    if(!metadata.info.name.toString()){
        console.log(metadata.info.name.toString());
        return false
    }
    else{
        return {
            infoHash:infoHash,
            name:metadata.info.name.toString(),
            info:metadata.info,
            torrentType:torrentType,
            rinfo:rinfo,
            filePaths:filePaths
        };
    }
}

module.exports = {
    getRandomId,
    getNeighborId,
    decodeNodes,
    encodeNodes,
    bufferRecover,
    metadataWrapper
};