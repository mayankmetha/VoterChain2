const data = require('./data');
const block = require('./block');
const logger = require('./logger');

var blockchain = [];

var initBlockchain = () => {
    blockchain.push(genesisBlock());
}

var genesisBlock = () => {
    var genData = new data.data("0","0",0,"0");
    return new block.block(0,"0","0",genData);
}

var getChain = () => {
    return JSON.stringify(blockchain);
}

var lastBlock = () => {
    return blockchain[blockchain.length - 1];
}

var genBlock = (uid, conid, eleid, parid) => {
    var index = lastBlock().index + 1;
    var prevHash = lastBlock().hash;
    var time = Math.round(new Date().getTime()/1000);
    var blkData = new data.data(uid, conid, eleid, parid);
    return new block.block(index, prevHash, time, blkData);
}

var validateBlk= (newBlk, prevBlk) => {
    if((prevBlk.index + 1) !== newBlk.index) {
        logger.error("index error");
        return false;
    } else if(prevBlk.hash !== newBlk.prevHash) {
        logger.error("previous hash error");
        return false;
    } else if(block.genBlockHash(newBlk) !== newBlk.hash) {
        logger.error("hash error");
        return false;
    }
    return true;
}

var isDataDuplicated = (blk) => {
    for(var i=1;i<blockchain.length;i++) {
        if(data.duplicateData(blk.data.uid,blk.data.eleid,blockchain[i].data)) {
            return true;
        }
    }
    return false;
}

var addBlock = (blk) => {
    if(validateBlk(blk, lastBlock()) && !isDataDuplicated(blk)) {
        blockchain.push(blk);
        //broadcast(last blk added);
        logger.info("Block added: "+JSON.stringify(blk));
        return true;
    } 
    logger.error("invalid block");
    return false;
}

var validateChain = (chain) => {
    if(JSON.stringify(chain[0]) !== JSON.stringify(genesisBlock())) {
        return false;
    }
    var tempChain = [chain[0]];
    for (var i = 1; i < chain.length; i++) {
        if (validateBlk(chain[i], tempChain[i - 1])) {
            tempChain.push(chain[i]);
        } else {
            return false;
        }
    }
    return true;
}

var replaceChain = (chain) => {
    if (validateChain(chain) && chain.length > blockchain.length) {
        logger.info("Fetching longest chain");
        blockchain = chain;
        //broadcast(blockchain);
    } else {
        logger.error("Error fetching longest chain");
    }
}

module.exports = {
    initBlockchain: initBlockchain,
    getChain: getChain,
    genBlock: genBlock,
    addBlock: addBlock
}