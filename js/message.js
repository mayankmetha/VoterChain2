const QUERY_LATEST = 0;
const QUERY_ALL = 1;
const RESPONSE_BLOCKCHAIN = 2;

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

var respondLatestBlk = (blk) => {
    return {
        'type': RESPONSE_BLOCKCHAIN,
        'data': blk
    }
}

var respondChain = (chain) => {
    return {
        'type': RESPONSE_BLOCKCHAIN,
        'data': chain
    }
}

module.exports = {
    queryLatestBlk: queryLatestBlk,
    queryChain: queryChain,
    respondLatestBlk: respondLatestBlk,
    respondChain: respondChain
}