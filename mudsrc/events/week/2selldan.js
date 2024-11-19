const path = require('path');
const logger = require(path.resolve(__dirname, '../../../server/logger'));

module.exports = async function (data){
    switch (data.type){
        case 'start':
            this.cmd.send('score;jh fam 0 start;go east;go south');
            break;
        case 'items':
            if ( this.room === '扬州城-杂货铺'){
                for (const item of data.items) {
                    if (item && !item.p && item.name.includes('杂货铺老板')){
                        this.zahuoId = item.id
                        this.cmd.send('pack');
                        return;
                    }
                }
            }
            break;
        case 'dialog':
            if ( data.dialog === 'pack' && data.items &&!data.remove ){
                for (const item of data.items){
                    if (item.name.includes('聚气丹') || item.name.includes('培元丹')){
                        // sell 3 s2x4deda063 to gfwxe3152ca
                        this.cmd.send(`sell ${item.count} ${item.id} to ${this.zahuoId}`)
                    }
                }
                this.cmd.send(this.homeWay);
                this.cmd.send('tm 结束售卖丹药流程')
                return;
            }
            if (data.dialog === 'score'){
                this.userId = data.id;
                this.userLevel = data.level;
            }
            break;
        case 'msg':
            if (data.ch === 'tm' && data.content === '结束售卖丹药流程') {
                    this.emit('Data',{type:'next'});
            }
            break;
        default:
            break;
    }
}