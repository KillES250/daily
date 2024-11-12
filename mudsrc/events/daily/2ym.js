const path = require('path');
const logger = require(path.resolve(__dirname, '../../../server/logger'));
const { fix } = require('../../../server/timers');

module.exports = function (data) {
    switch (data.type) {
        case 'start':
            this.cmd.send('stopstate');
            this.cmd.send(this.gameInfo.hunt.way)
            // 任务终点 this.emit('Data',{type:'next'});  
            break;
        case 'items':
            clearTimeout(this.timers.fix);

            for (const item of data.items) {
                if (!item || item.p || !item.name) {
                    continue;
                }
            
                if (item.name === this.gameInfo.hunt.npc) {
                    this.huntTaskInfo.taskerId = item.id;
                    this.cmd.send(`ask1 ${item.id}`);
                    return;
                }
            
                if (item.name === `<red>衙门逃犯</red> ${this.huntTaskInfo.name}`) {
                    this.cmd.commandClear();
                    this.cmd.send(`kill ${item.id}`, false);
                    return;
                }
            }
        
            if (this.huntTaskInfo.place && this.huntTaskInfo.nowTaskWay.length < 1) {
                this.huntTaskInfo.nowTaskWay = JSON.parse(
                    JSON.stringify(this.gameInfo.hunt.path[this.huntTaskInfo.place].split(';')),
                );
            }
        
            if (this.nowRoomId !== this.gameInfo.temple.pathId) {
                const cmd = this.huntTaskInfo.nowTaskWay.shift();
                this.cmd.send(cmd);
                cmd === 'break bi' && this.cmd.send(this.huntTaskInfo.nowTaskWay.shift(), false);
                this.timers.fix = setTimeout(fix.bind(this), 6e4);
            }
            break;
        case 'room':
            this.isCombat = false;
            this.nowRoomId = data.path;
            if (data.path === this.gameInfo.temple.pathId) {
                setTimeout(() => {
                    if (this.combatFailedNum >= 3) {
                        this.huntTaskInfo.place = null;
                        this.huntTaskInfo.nowTaskWay = [];
                        this.combatFailedNum = 0;
                        this.cmd.send(this.gameInfo.hunt.way);
                    } else {
                        this.huntTaskInfo.nowTaskWay = JSON.parse(
                            JSON.stringify(this.gameInfo.hunt.path[this.huntTaskInfo.place].split(';')),
                        );
                        this.cmd.send(this.huntTaskInfo.nowTaskWay.shift());
                    }
                }, 40000);
            }
            break;
        case 'tip':
            if (data.data.includes('说：')) {
                return;
            }
            
            if (data.data.includes('你的扫荡符不够')) {
                this.cmd.send(`shop 0 20;ask3 ${this.huntTaskInfo.taskerId}`);
            }
            
            if (data.data.includes('大于你的最大连续次数')) {
                this.cmd.send(
                `ask1 ${this.huntTaskInfo.taskerId};ask2 ${this.huntTaskInfo.taskerId};ask3 ${this.huntTaskInfo.taskerId}`,
                );
            }
            
            if (data.data.includes('听说他最近在')) {
                const reg = data.data.match(
                /程药发对你说道：(.+?)作恶多端，还请.+?为民除害，听说他最近在(.+?)-.+?出现过。/,
                );
                this.huntTaskInfo.name = reg[1];
                this.huntTaskInfo.place = reg[2];
                if (!this.gameInfo.hunt.path[this.huntTaskInfo.place]) {
                    logger.warning(
                        `「${this.userConfig.name}」无法获取逃犯路径，逃犯位置为为「${this.huntTaskInfo.place}」`,
                    );
                    this.cmd.send(`ask2 ${this.huntTaskInfo.taskerId};ask1 ${this.huntTaskInfo.taskerId}`);
                    return;
                }
            
                this.huntTaskInfo.nowTaskWay = JSON.parse(
                    JSON.stringify(this.gameInfo.hunt.path[this.huntTaskInfo.place].split(';')),
                );
            
                this.combatFailedNum = 0;
                this.cmd.send(this.huntTaskInfo.nowTaskWay.shift());
            }
            
            if (data.data.includes('石壁的石头掉了下来')) {
                this.cmd.send('break bi;go enter');
            }
            
            if (data.data.includes('你现在没办法移动')) {
                setTimeout(() => {
                this.cmd.send(this.gameInfo.hunt.way);
                }, 3e4);
            }
            
            if (data.data.includes('你要攻击谁')) {
                this.huntTaskInfo.nowTaskWay = JSON.parse(
                    JSON.stringify(this.gameInfo.hunt.path[this.huntTaskInfo.place].split(';')),
                );
                this.cmd.send(this.huntTaskInfo.nowTaskWay.shift());
            }
            
            if (/你的追捕任务完成了|你的追捕任务失败了/.test(data.data)) {
                if (data.data.includes('失败了')) {
                    this.huntTaskInfo.taskFailedNum++;
                }
            
                this.cmd.commandClear();
                this.huntTaskInfo.place = null;
                this.huntTaskInfo.nowTaskWay = [];
                setTimeout(() => {
                    if (this.huntTaskInfo.cai) {
                        this.emit('Data',{type:'next'});
                        return;
                    }
                    this.cmd.send(this.gameInfo.hunt.way);
                }, 15000);
            }
            
            if (data.data.includes('你不是在追捕吗')) {
                this.huntTaskInfo.taskFailedNum++;
                if (this.huntTaskInfo.taskFailedNum >= 3) {
                    this.huntTaskInfo.cai = true;
                    this.cmd.send(`ask3 ${this.huntTaskInfo.taskerId}`);
                    return;
                }
            
                this.cmd.send(`ask2 ${this.huntTaskInfo.taskerId};ask1 ${this.huntTaskInfo.taskerId}`);
            }
            if (/最近没有在逃的逃犯了|你等一会再来吧。|你没有那么多的元宝。/.test(data.data)) {
                logger.info(`「${this.userConfig.name}」追捕任务已完成`);
                this.emit('Data',{type:'next'});
            }
            
            if (data.data.includes('只能在战斗中使用')) {
                this.isCombat = false;
                clearInterval(this.timers.pfm);
            }
            break;
        default:
            break;
    }
}