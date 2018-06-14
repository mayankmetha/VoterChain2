const chalk = require('chalk');

var error = (msg) => {
    console.log(chalk.bold.red(msg));
}

var warn = (msg) => {
    console.log(chalk.bold.yellow(msg));
}

var info = (msg) => {
    console.log(chalk.bold.green(msg));
}

var log = (msg) => {
    console.log(chalk.bold.white(msg));
}

module.exports = {
    error: error,
    warn: warn,
    info: info,
    log: log
};