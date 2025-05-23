const path = require('path');
const logger = require(path.resolve(__dirname, '../../../server/logger'));
const start = require('../start/start.js');

module.exports = async function (data) {
    switch (data.type) {
        case 'login':
            start();
            if(this.userConfig.war.family === true){
                this.emit('Data',{type:'start'});
            }else {
                if (this.room !== '帮会-练功房') {
                    this.cmd.send('jh fam 0 start;go south;go south;go east;go east;go east;go north')
                 }
            }
        case 'room':
            this.room = data.name;
            if(data.name === '帮会-练功房'){
                if (this.userConfig.war.leader === true) {
                    this.off('Data', require('../war/leader.js'))
                    this.on('Data', require('../war/leader.js'))
                }else {
                    this.off('Data', require('../war/participant.js'))
                    this.on('Data', require('../war/participant.js'))
                }
                this.emit('Data', { type: 'start' });  
            }
            break
        case 'end':
            if(this.userConfig.war.leader === true){
                this.cmd.send('enable blade yuanyuewandao')
            } else if(this.userConfig.war.leader === false){
                this.enableSkills.forEach(enableCmd => {
                    this.cmd.send(enableCmd)
                });
            }
            this.cmd.send(
                /ord|hio/.test(this.userLevel)
                    ? 'jh fam 0 start;go west;go west;go north;go enter;go west;xiulian'
                    : 'wakuang',
            );
            break;
        case 'tip':
            if (data.data.includes('说：')) {
                return;
            }
            if (/你挥着铁镐开始认真挖矿|你盘膝坐下开始闭关修炼|你开始在在药店当学徒....../.test(data.data)){
                clearTimeout(this.timers.fix);
                clearInterval(this.timers.pfm);
                this.cmd.send(this.userConfig.logoutCommand);
                logger.success(`「${this.userConfig.name}」退出登录`);
                this.socketClose();
                return;
            }           
            if (/你身上没有挖矿工具/.test(data.data)) {
                this.cmd.send('jh fam 0 start;go east;go east;go south');
                return;
            }
            if (/你没有那么多的钱。/.test(data.data)) { //打工
                this.cmd.send("jh fam 0 start;go east;go east;go north;work",);
                return;
            }
            break;
        case 'items':
            if (this.room === '扬州城-铁匠铺'){
                data.items.forEach(item => {
                    if (item && !item.p && item.name.includes('铁匠')) {
                        this.tiejiang = item.id;
                        this.cmd.send(`list ${item.id}`);
                    }
                });
            }
            break;
        case 'dialog':
            if (data.dialog === 'list') {
                data.selllist.forEach(item => {
                    if (item.name.includes('铁镐')) {
                        this.cmd.send(`buy 1 ${item.id} from ${this.tiejiang};wakuang`);
                    }
                })
            }
            break;
        default:
            break;
    }
};