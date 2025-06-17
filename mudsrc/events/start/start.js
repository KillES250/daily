const path = require('path');
const logger = require(path.resolve(__dirname, '../../../server/logger'));

module.exports = function start(data,cmd){
    logger.success(`「${data.name}」登录成功`);
    cmd.send('setting auto_pfm 0;setting auto_pfm2 0;setting auto_work 0;setting auto_get 1;setting no_message 1');
    cmd.send('relive;cr over;lkfb ok')
    cmd.send('stopstate');
    cmd.send(data.loginCommand);
}
