const logger = require('./js/logger');
const blockchain = require('./js/blockchain');

blockchain.initBlockchain();
logger.log(blockchain.getChain());
//blockchain.addBlock(blockchain.genBlock("1","1","1","1"));
//blockchain.socketServer("127.0.0.1","6000");
blockchain.socketServer("127.0.0.1","6001");
blockchain.connectToPeer("ws://127.0.0.1:6000")