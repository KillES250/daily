const path = require('path');
const logger = require(path.resolve(__dirname, '../../../server/logger'));
module.exports = async function (data) { 
    switch (data.type) {
        case 'login':
            logger.success(`「${this.userConfig.name}」登录成功`);
            this.cmd.send('setting auto_pfm 0;setting auto_pfm2 0;setting auto_work 0;setting auto_get 1;setting no_message 1');
            this.cmd.send('relive;cr over')
            this.cmd.send('stopstate');
            this.cmd.send(this.userConfig.loginCommand);
            this.cmd.send('team dismiss;jh fam 0 start;go west;go west;go north');
            this.cmd.send('tm 开始工作')
            break;
        case 'loginerror':
            logger.error(`「${this.userConfig.name}」登录失败`);
            this.socketClose();
            break;
        case 'next':
            if (this.weeklist.length > 0) {
                this.off('Data' , require(`./${this.weeklist[0]}.js`));
                this.weeklist.shift();
            }
            if (this.weeklist.length > 0){
                this.on('Data', require(`./${this.weeklist[0]}.js`));
                this.emit('Data',{type:'start'});
            } else if (this.weeklist.length === 0){
                this.off('Data', require(`./end.js`));
                this.on('Data', require(`./end.js`));
                this.emit('Data',{type:'end'});
            }
            break;
        case 'msg':
            if(data.ch === 'tm' && data.content === '开始工作'){
                this.off('Data' , require(`./${this.weeklist[0]}.js`));
                this.on('Data', require(`./${this.weeklist[0]}.js`));
                this.emit('Data',{ type:'start' });
            }
            break;
        case 'tip':
            console.log(data.data);
            break;
        case 'room':
            this.room = data.name;
            this.roomPath = data.path;
            console.log(data.name);
            break;
        default:
            break;
    }

}