// transmoney 返回 <hic>你身上有0元宝。</hic> 账号转入：0 每日签到：0/1000
// give 9towe3152ca 1000 cash
// 1000 2000 3000 5000 7000 10000 15000
module.exports = async function (data){
    switch (data.type){
        case 'start':
            this.cmd.send('taskover signin;taskover zz1;taskover zz2');
            this.cmd.send('jh fam 0 start;go east;go south');
            this.cmd.send('transmoney');
            break;
        case 'tip':
            if (data.data.includes('每日签到')) {
                const cashArr = data.data.match(/\d+/g)
                const cashPer = cashArr[2]/cashArr[3]
                if (cashArr[2] >= 1000 && this.dabieye === false){
                    this.cmd.send('jh fam 0 start;go west;go west;go north')
                    return;
                }
                if (cashPer >= 0.9){
                    if (!this.userSc1.id || !this.userSc2.id || !this.userSc3.id)
                        this.cmd.send('shop 9 1')
                    else{
                        this.cmd.send('shop 0 100')
                    }
                } else {
                    this.cmd.send('score')
                }
                return;
            }
            if(data.data.includes('完成度未满100%，未能解锁下个副本。')){
                this.jlxhoverflow -=1;
                if(this.jlxhoverflow > 0){
                    this.cmd.send('cr zsd/damen 1 0');
                } else {
                    this.cmd.send('tm 消耗结束')
                }
                return;
            }
            if(data.data.includes('你买太多了。')){
                this.cmd.send('score')
            }
            //
            break;
        case 'room':
            if(data.name.includes('副本区域')){
                this.cmd.send('cr over');
            }

            break;
        case 'items':
            if ( this.room === '扬州城-大门' ){
                data.items.forEach(item => {
                    if (item && !item.p && item.name.includes('管家')) {
                        this.cmd.send(`give ${item.id} 1000 cash`);
                        this.cmd.send('score')
                    }
                })
            }
            break;
        case 'dialog':
            if (data.dialog === 'pack') {
                if(data.name.includes('随从礼包') || data.name.includes('扫荡符')){
                    this.cmd.send('score')
                }
                this.cmd.send('score')
            }
            if(data.dialog === 'score'){
                const jingReg = data.jingli.match(/(\d+)\/(\d+)<hig>\(\+\d+\)<\/hig>/);
                if (jingReg[1] > 14000 && this.userLevel.includes('hio')) {
                    this.jlxhoverflow = Math.ceil((14000 - jingReg[1])/10);
                    this.cmd.send('cr zsd/damen 1 0');
                } else {
                    this.cmd.send('tm 消耗结束');
                }
            }
            break;
        case 'msg':
            if (data.ch === 'tm' && data.content === '消耗结束') {
                    this.emit('Data',{type:'next'});
            }
            break;
        default:
            break;
    }
}