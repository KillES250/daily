const path = require('path');
const logger = require(path.resolve(__dirname, '../../../server/logger'));
const start = require('../start/start.js');
const pushMsg = require(path.resolve(__dirname, '../../../server/pushplus'));

module.exports = async function (data) {
    switch (data.type) {
        case 'login':
            start();
            this.cmd.send('team dismiss;jh fam 0 start;go west;go west;go north');
            this.cmd.send('tm 开始工作')
            break;
        case 'loginerror':
            logger.error(`「${this.userConfig.name}」登录失败`);
            this.socketClose();
            break;
        case 'next':
            if (this.weeklist.length > 0) {
                this.off('Data', require(`./${this.weeklist[0]}.js`));
                this.weeklist.shift();
            }
            if (this.weeklist.length > 0) {
                this.on('Data', require(`./${this.weeklist[0]}.js`));
                this.emit('Data', { type: 'start' });
            } else if (this.weeklist.length === 0) {
                this.off('Data', require(`./end.js`));
                this.on('Data', require(`./end.js`));
                this.emit('Data', { type: 'end' });
            }
            break;
        case 'msg':
            if (data.ch === 'tm' && data.content === '开始工作') {
                this.off('Data', require(`./${this.weeklist[0]}.js`));
                this.on('Data', require(`./${this.weeklist[0]}.js`));
                this.emit('Data', { type: 'start' });
            }
            break;
        case 'tip':
            console.log(data.data);
            break;
        case 'room':
            clearTimeout(this.roomTimer);
            this.room = data.name;
            this.roomPath = data.path;
            this.roomTimer = setTimeout(() => {
                const msg = `「${this.userConfig.name}」在 ${this.room} 停留超过30分钟，请及时处理！`
                pushMsg(msg)
            }, 30 * 60 * 1000);
            break;
        default:
            break;
    }

}