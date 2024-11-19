const path = require('path');
const logger = require(path.resolve(__dirname, '../../../server/logger'));
// transmoney 返回 <hic>你身上有0元宝。</hic> 账号转入：0 每日签到：0/1000
//
module.exports = async function (data){
    switch (data.type){
        case 'end':
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
            if (/你挥着铁镐开始认真挖矿|你盘膝坐下开始闭关修炼|你开始在在药店当学徒....../.test(data.data)) {
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
            //
            break;
        case 'items':
            data.items.forEach(item => {
                if (item && !item.p && item.name.includes('铁匠')) {
                    this.tiejiang = item.id;
                    this.cmd.send(`list ${item.id}`);
                }
            });
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
}
