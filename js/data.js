const cryptoJs = require('crypto-js');

class data {
    constructor(uid, conid, eleid, parid) {
        this.uid = uid;
        this.conid = conid;
        this.eleid = eleid;
        this.parid = parid;
        this.eleHash = genEleHash(uid,eleid);
    }
}

var genEleHash = (uid, eleid) => {
    return cryptoJs.SHA512(uid+eleid).toString();
}

var duplicateData = (uid, eleid, data) => {
    if(data.eleHash == genEleHash(uid, eleid)) {
        return true;
    }
    return false;
}

module.exports = {
    data: data,
    duplicateData: duplicateData
};