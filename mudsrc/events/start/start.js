const path = require('path');
const logger = require(path.resolve(__dirname, '../../../server/logger'));

module.exports = function start(){
    logger.success(`「${this.userConfig.name}」登录成功`);
    this.cmd.send('setting auto_pfm 0;setting auto_pfm2 0;setting auto_work 0;setting auto_get 1;setting no_message 1');
    this.cmd.send('relive;cr over;lkfb ok')
    this.cmd.send('stopstate');
    this.cmd.send(this.userConfig.loginCommand);
}