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
                if (item === 'type' && obj[item] === 'Buffer') {
                    return new Buffer(obj);
                }
                break;
            default:
                break;
        }
    }
    return obj;
}


let fileNameJudge = function (str) {
    let result = true;
    let list = '文宣,文本,网址,�,宣傳,网站,官网,在线真人,博彩,宣传';
    let arr = list.split(',');
    for (let item of arr) {
        if (str.indexOf(item) > -1) {
            result = false;
        }
    }
    return result;
};

function metadataWrapper(infoHash, metadata) {
    let torrentType = "single";
    let filePaths = [];
    let size = 0;
    try{
        if (!metadata.info.name.toString()||metadata.info.name.toString().indexOf('�')>-1) {
            console.log(metadata.info.name.toString());
            return false;
        }
    }catch (e) {
        return false;
    }
    if (Object.prototype.toString.call(metadata.info.files) === "[object Array]") {
        torrentType = "multiple";
        let arr = [];
        for (let item of metadata.info.files) {
            try{
                if (item['path']) {
                    let str=item['path'].toString();
                    if (fileNameJudge(str)) {
                        str = str.replace(/_{3,}[^ \t\n\x0B\f\r]*_{3,}/, '');
                        if(str!==''){
                            arr.push(str);
                        }
                    }
                }
                if (item['length']) {
                    size += item['length'];
                }
            }catch (e) {
            }
        }
        filePaths = arr;
    }
    else if (metadata.info.files) {
        if (metadata.info.files['path']) {
            filePaths = metadata.info.files['path'].toString();
        }
    }
    else if (!metadata.info.files && metadata.info["length"]) {
        size = metadata.info.length;
        filePaths.push(metadata.info.name.toString());
    }

    filePaths = JSON.stringify(filePaths);
    return {
        infoHash: infoHash,
        name: metadata.info.name.toString(),
        info: metadata.info,
        size: size,
        torrentType: torrentType,
        filePaths: filePaths
    };

}


let weightSort=function(arr){
    for(let i=0;i<arr.length-1;i++){
        let maxIndex=i;
        for(let j=i+1;j<arr.length;j++){
            if(arr[j].weight>arr[maxIndex].weight){
                maxIndex=j;
            }
        }
        if(i!==maxIndex){
            let temp=arr[i];
            arr[i]=arr[maxIndex];
            arr[maxIndex]=temp;
        }
    }
    return arr;
};

module.exports = {
    getRandomId,
    getNeighborId,
    decodeNodes,
    encodeNodes,
    bufferRecover,
    metadataWrapper,
    weightSort,
    fileNameJudge
};