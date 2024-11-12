const path = require('path');
const logger = require(path.resolve(__dirname, '../../../../server/logger'));
const familyWay = {
    "无门无派":"jh fam 0 start;go south;go south;go west",
    "武当派":"jh fam 1 start;go west",
    "少林派":"jh fam 2 start;go north",
    "华山派":"jh fam 3 start;go westup;go north",
    "峨眉派":"jh fam 4 start;go west;go south;go west",
    "逍遥派":"jh fam 5 start;go east",
    "丐帮":"jh fam 6 start;go down;go east;go east",
    "杀手楼":"jh fam 7 start;go north;go up;go up;go east",
}

module.exports = async function (data) {
    switch (data.type) {
        case 'startmisc':
            this.cmd.send('score')
            break;
        case 'dialog':
            if(data.dialog === 'score'){
                if(data.level.includes('ord') && data.gongji > 15000){
                    const familyCommand = familyWay[data.family];
                    if (familyCommand){
                        this.cmd.send('pack');
                        this.cmd.send(familyCommand);
                    } else {
                        console.log('查找门派发生错误,退出当前流程')
                        this.cmd.send('jh fam 0 start;go west;go west;go north;tm 结束流程')
                    }
                } else { //不是武神境界且门贡不足15000
                    this.cmd.send('jh fam 0 start;go west;go west;go north;tm 结束流程')
                }
                return;
            }
            if(data.dialog === 'pack' && data.items){
                const redItem = data.items.find(itmes => itmes.name.includes('神魂碎片'))
                if (redItem && redItem.count < 50){
                    this.mischouqinbuy = true;
                }
                return;
            }
            if(data.dialog === 'list' && data.selllist){
                const buy1 = data.selllist.find(itmes => itmes.name.includes('元晶'))
                const buy2 = data.selllist.find(itmes => itmes.name.includes('神魂碎片'))
                if(this.mischouqinbuy && buy2.count > 0){
                    this.cmd.send(`buy 1 ${buy2.id} from ${this.mischouqin}`)
                } else if (!this.mischouqinbuy && buy1.count > 0){
                    this.cmd.send(`buy 1 ${buy1.id} from ${this.mischouqin}`)
                } else {
                    this.cmd.send('jh fam 0 start;go west;go west;go north;tm 结束流程')
                    return;
                }
                this.cmd.send('jh fam 0 start;go west;go west;go north;tm 结束流程')
            }
            break;
        case 'items':
            for (const item of data.items) {
                if (item && !item.p && item.name.includes('后勤')) {
                    this.mischouqin = item.id
                    this.cmd.send(`ask1 ${item.id}`)
                }
            }
            break;
        case 'msg':
            if(data.ch === 'tm' && data.content === '结束流程'){
                this.emit('Data',{type:'nextmisc' });
            }
            break;
        // case 'tip':
        //     购买买了一块<ord>神魂碎片</ord>。
        //     购买了一块<hio>元晶</hio>。
        default:
            break;
    }
}