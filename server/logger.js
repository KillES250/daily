const fs = require('fs');
const chalk = require('chalk');
const dayjs = require('dayjs');
const { EOL } = require('os');
const pushplus = require('./pushplus');

dayjs.locale('zh-cn');

function print(msg, type = 'info') {
  const color = {
    success: 'green',
    warning: 'yellow',
    error: 'red',
    info: 'blue',
    debug: 'cyan',
  };

  const logMsg = `${dayjs().format('YYYY-MM-DD HH:mm:ss')} [${chalk[color[type]](type)}] ${msg}`;
  fs.appendFileSync('daily.log', logMsg + EOL);
  console.log(logMsg);
}

function success(msg) {
  print(msg, 'success');
}

function warning(msg) {
  print(msg, 'warning');
  pushplus(msg);
}

function error(msg) {
  print(msg, 'error');
  pushplus(msg);
}

function info(msg) {
  print(msg);
}

function debug(msg) {
  if (global.debugMode) {
    print(msg, 'debug');
  }
}

module.exports = {
  success,
  warning,
  error,
  info,
  debug,
};
