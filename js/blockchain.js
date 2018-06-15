const cryptoJs = require('crypto-js');
const webSocket = require('ws');
const logger = require('./logger');

const QUERY_LATEST = 0;
const QUERY_ALL = 1;
const RESPONSE_BLOCKCHAIN = 2;
var sockets = [];
var socketsAddr = [];
var blockchain = [];

class data {
    constructor(uid, conid, eleid, parid) {
        this.uid = uid;
        this.conid = conid;
        this.eleid = eleid;
        this.parid = parid;
        this.eleHash = genEleHash(uid,eleid);
    }
}

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

var genEleHash = (uid, eleid) => {
    return cryptoJs.SHA512(uid+eleid).toString();
}

var duplicateData = (uid, eleid, data) => {
    if(eleHash == genEleHash(uid, eleid)) {
        return true;
    }
    return false;
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

var initBlockchain = () => {
    blockchain.push(genesisBlock());
}

var genesisBlock = () => {
    var genData = new data("0","0",0,"0");
    return new block(0,"0","0",genData);
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
    var blkData = new data(uid, conid, eleid, parid);
    return new block(index, prevHash, time, blkData);
}

var validateBlk= (newBlk, prevBlk) => {
    if((prevBlk.index + 1) !== newBlk.index) {
        logger.error("index error");
        return false;
    } else if(prevBlk.hash !== newBlk.prevHash) {
        logger.error("previous hash error");
        return false;
    } else if(genBlockHash(newBlk) !== newBlk.hash) {
        logger.error("hash error");
        return false;
    }
    return true;
}

var isDataDuplicated = (blk) => {
    for(var i=1;i<blockchain.length;i++) {
        if(duplicateData(blk.data.uid,blk.data.eleid,blockchain[i].data)) {
            return true;
        }
    }
    return false;
}

var addBlock = (blk) => {
    if(validateBlk(blk, lastBlock()) && !isDataDuplicated(blk)) {
        blockchain.push(blk);
        broadcast(responseLatestBlk());
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
        broadcast(responseLatestBlk());
    } else {
        logger.error("Error fetching longest chain");
    }
}

var queryLatestBlk = () => {
    return {
        'type': QUERY_LATEST
    }
}

var queryChain = () => {
    return {
        'type': QUERY_ALL
    }
}

var responseLatestBlk = () => {
    return {
        'type': RESPONSE_BLOCKCHAIN,
        'data': JSON.stringify([lastBlock()])
    }
}

var responseChain = () => {
    return {
        'type': RESPONSE_BLOCKCHAIN,
        'data': JSON.stringify(blockchain)
    }
}

var socketServer = (ip, ipPort) => {
    var server = new webSocket.Server({port: ipPort, host: ip});
    server.on('connection', ws => initConnection(ws));
    logger.socketInfo("Your p2p socket server is ws://"+ip+":"+ipPort+"");
}

var initConnection = (ws) => {
    var addr = "ws://"+ws._socket.remoteAddress+":"+ws._socket.remotePort;
    logger.socketInfo("Client "+addr+" connected!");
    socketsAddr.push(addr);
    sockets.push(ws);
    initMessageHandler(ws);
    initErrorHandler(ws);
    write(ws, queryLatestBlk());
}

var connectToPeer = (newPeer) => {
    logger.socketInfo("Connection to "+newPeer);
    var ws = new webSocket(newPeer);
    ws.on('open', () => initConnection(ws));
    ws.on('error', () => {
        logger.socketError("Connection to "+newPeer+" failed!");
    });
}

var write = (ws, msg) => {
    ws.send(JSON.stringify(msg));
}

var broadcast = (msg) => {
    sockets.forEach(socket => write(socket, msg));
}

var initMessageHandler = (ws) => {
    ws.on('message', (data) => {
        var msg = JSON.parse(data);
        logger.message("Incoming message: "+JSON.stringify(msg));
        switch(msg.type) {
            case QUERY_LATEST:
                write(ws, responseLatestBlk());
                break;
            case QUERY_ALL:
                write(ws, responseChain());
                break;
            case RESPONSE_BLOCKCHAIN:
                handleBlockchainResponse(msg);
                break;
        }
    });
}

var initErrorHandler = (ws) => {
    var closeConnection = (ws) => {
        var peer;
        if(ws.url === undefined) {
            peer = "Client "+socketsAddr[sockets.indexOf(ws)]+" disconnected";
        } else {
            peer = "Disconnecting from "+ws.url+"";
        }
        logger.socketInfo(peer);
        socketsAddr.splice(socketsAddr.indexOf(ws),1);
        sockets.splice(sockets.indexOf(ws),1);
    }
    ws.on('close', () => closeConnection(ws));
    ws.on('error', () => closeConnection(ws));
}

var handleBlockchainResponse = (msg) => {
    var receivedBlks = JSON.parse(msg.data).sort((b1,b2) => (b1.index - b2.index));
    var latestBlkReceived = receivedBlks[receivedBlks.length - 1];
    var latestBlkHeld = lastBlock();
    if(latestBlkReceived.index>latestBlkHeld.index) {
        logger.message("Blockchain possibly behind.");
        logger.message("Blocks we got: "+latestBlkHeld.index+"");
        logger.message("Blocks peer got: "+latestBlkReceived.index+"");
        if(latestBlkHeld.hash == latestBlkReceived.prevBlk) {
            logger.message("Appending received block to our blockchain!");
            blockchain.push(latestBlkReceived);
            broadcast(responseLatestBlk());
        } else if(receivedBlks.length == 1) {
            logger.message("Quering blockchain from peer!");
            broadcast(queryChain());
        } else {
            logger.message("Received blockchain is longer!");
            replaceChain(receivedBlks);
        }
    } else {
        logger.message("Received blockchain is not longer than current chain!");
    }
}

var closeSockets = () => {
    sockets.forEach((s) => {
        logger.socketInfo("Disconnecting from "+socketsAddr[sockets.indexOf(s)]+"");
        s.terminate();
        socketsAddr.splice(socketsAddr[sockets.indexOf(s)],1);
        sockets.splice(sockets[sockets.indexOf(s)],1);
    });
}

module.exports = {
    initBlockchain: initBlockchain,
    getChain: getChain,
    genBlock: genBlock,
    addBlock: addBlock,
    socketServer: socketServer,
    connectToPeer: connectToPeer,
    closeSockets: closeSockets
}