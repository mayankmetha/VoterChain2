var block = (index, prevHash, time, data, hash) => {
    this.index = index;
    this.prevHash = prevHash;
    this.time = time;
    this.data = data;
    this.hash = hash;
}

module.exports = {
    block: block
}