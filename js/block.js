const cryptoJs = require('crypto-js');

class block {
    constructor(index, prevHash, time, data) {
        this.index = index;
        this.prevHash = prevHash;
        this.time = time;
        this.data = data;
        this.dataHash = genDataHash(this.data);
        this.hash = genHash(index,prevHash,time,this.data,this.dataHash);
    }
}

var genDataHash = (data) => {
    return cryptoJs.SHA512(JSON.stringify(data)).toString();
}

var genHash = (index, prevHash, time, data, dataHash) => {
    return cryptoJs.SHA256(index+prevHash+time+data+dataHash).toString();
}

var genBlockHash = (block) => {
    return genHash(block.index, block.prevHash, block.time, block.data, block.dataHash);
}

module.exports = {
    block: block,
    genBlockHash: genBlockHash
}