const path = require('path');
const logger = require(path.resolve(__dirname, '../../../server/logger'));

module.exports = function (data) {
    switch (data.type) {
        case 'start':
            this.cmd.send('stopstate');
            this.cmd.send('score');
            // 任务终点 this.emit('Data',{type:'next'});  
            break;
        case 'dialog':
            if(data.dialog === 'score'){
                const userSect = this.gameInfo.sect.find(({ name }) => name === data.family);
                if (!userSect) {
                    logger.error(`「${this.userConfig.name}」无法确认用户门派，用户门派为「${data.family}}」`);
                    return this.socketClose();
                }
              
                const jingReg = data.jingli.match(/(\d+)\/(\d+)<hig>\(\+\d+\)<\/hig>/);
              
                if (jingReg[1] / jingReg[2] > 0.8) {
                    logger.warning(`「${this.userConfig.name}」未使用精力已超过80%，请及时处理。`);
                }
              
                this.sect = JSON.parse(JSON.stringify(userSect));
                this.userLevel = data.level;
                this.cmd.send('stopstate');
                this.cmd.send(this.sect.taskerWay);
            }
            if (data.dialog === 'list') {
                const taskGood = data.selllist.find((good) => good.name === this.sectTaskInfo.taskItem);
                this.cmd.send(taskGood ? `buy 1 ${taskGood.id} from ${data.seller}` : ``);
                this.cmd.send(this.sect.taskerWay);
            }
            break;
        case 'cmds':
            const submit = data.items.find((button) => button.name === `上交${this.sectTaskInfo.taskItem}`);
            this.cmd.send(submit ? submit.cmd : `task sm ${this.sectTaskInfo.taskerId} giveup`);
            break;
        case 'items':
            if (!this.sect) {
                return;
            }
            
            for (const item of data.items) {
                if (!item || item.p || !item.name) {
                    continue;
                }
            
                if (item.name === this.sect.tasker) {
                    this.sectTaskInfo.taskerId = item.id;
                    this.cmd.send(`task sm ${item.id}`);
                }
            
                if (item.name === this.sectTaskInfo.seller) {
                    this.cmd.send(`list ${item.id}`);
                }
            
                if (item.name.includes(this.sect.chiefTitle)) {
                    this.cmd.send(`ask2 ${item.id}`);
                    this.emit('Data',{type:'next'}); 
                }
            }
            break;
        case 'tip':
            if (data.data.includes('说：')) {
                return;
            }
            
            if (data.data.includes('你去帮我找')) {
                this.sectTaskInfo.taskItem = data.data.match(/<.+?>.+?<\/.+?>/)[0];
                const seller = this.gameInfo.store.find(({ goods }) =>goods.includes(this.sectTaskInfo.taskItem),
            );
                if (seller) {
                    this.sectTaskInfo.seller = seller.seller;
                    this.cmd.send(seller.way);
                } else {
                    this.cmd.send(`task sm ${this.sectTaskInfo.taskerId}`);
                }
            }
            if (/师父让别人去找|你的师门任务完成了/.test(data.data)) {
                this.cmd.send(`task sm ${this.sectTaskInfo.taskerId}`);
            }
        
            if (/你拿不下那么多东西|你没有那么多的钱|神功盖世，千秋万代|多了会惹人烦的|堂堂武神大人就不要凑热闹了好吧|你没有那么多的元宝。/.test(data.data)) {
                    this.emit('Data',{type:'next'}); 
            }
            if (/你先去休息一下吧/.test(data.data)) {
                this.sect.tasker = null;
                logger.info(`「${this.userConfig.name}」师门任务完成`);
                if(this.sect.chiefWay){
                    this.cmd.send(this.sect.chiefWay);
                }else{
                    this.emit('Data',{type:'next'}); 
                }
            }
            break;
        default:
            break;
    }
}