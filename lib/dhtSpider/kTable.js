const utils = require("./utils");
const config = require('../../config');


class KTable {
    constructor() {
        this.nodeList = [];
        setInterval(function () {
            this.nodesStatusScan();
        }.bind(this), 60000);
    }

    getNodeList() {
        return this.nodeList;
    }

    nodeListRefresh(address) {
        for (let i = 0; i < this.nodeList.length; i++) {
            if (this.nodeList[i].address !== undefined && this.nodeList[i].address === address) {
                let obj = this.nodeList[i];
                this.nodeList.splice(i, 1);
                obj['updateTime'] = new Date().getTime();
                this.nodeList.unshift(obj);
                break;
            }
        }
    }

    nodesStatusScan() {
        let currentTime = new Date().getTime();
        for (let i = 0; i < this.nodeList.length; i++) {
            if (currentTime - this.nodeList[i].updateTime > 900000) {
                this.nodeList.splice(i, 1);
                break;
            }
        }
    }

    insert(node) {
        this.nodeList.unshift(node);
        if (this.nodeList.length >= config.maxNodeNumber) {
            this.nodeList.splice(this.nodeList.length - 2, 1);
        }
    }

    findClosestNodes(target) {
        let nodes = [];
        if (!target) {
            let node = this.nodeList[Math.floor(this.nodeList.length / 2)];
            nodes.push({
                nid: node.nid,
                address: node.address,
                port: node.port
            });
        }
        else {
            let min, node;
            for (let i = 0; i < this.nodeList.length; i++) {
                let result = Math.abs(this.nodeList[i].nid ^ target);
                if (min === undefined || result < min) {
                    min = result;
                    node = this.nodeList[i];
                }
            }
            nodes.push({
                nid: node.nid,
                address: node.address,
                port: node.port
            })
        }
        return utils.encodeNodes(nodes);
    }
}

module.exports = KTable;

