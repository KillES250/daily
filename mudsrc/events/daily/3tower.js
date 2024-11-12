const path = require('path');
const logger = require(path.resolve(__dirname, '../../../server/logger'));
const timers = require('../../../server/timers.js');

module.exports = function (data) {
    switch (data.type) {
        case 'start':
            this.cmd.send('stopstate');
            this.cmd.send(this.gameInfo.tower.way)
            this.cmd.send('pack');
            // 任务终点 this.emit('Data',{type:'next'});  
            break;
        case 'msg':
            if(data.ch === 'tm' && data.content.includes('执行下一项')){
                this.emit('Data',{type:'next'});
            }
            break;
        case 'items':
            for (const item of data.items) {
                if (!item || item.p || !item.name) {
                    continue;
                }
            
                if (item.name === this.gameInfo.tower.npc) {
                    this.cmd.send(`ask1 ${item.id};go enter`);
                    this.timers.up = setInterval(timers.up.bind(this), 3e3);
                }
            
                if (item.name.includes(this.gameInfo.tower.guardianTitle)) {
                    this.towerGuardianId = item.id;
                    this.cmd.send(`kill ${item.id}`);
                }
            
                if (item.name.includes('ord')) {
                    clearInterval(this.timers.pfm);
                    clearInterval(this.timers.up);
                    this.cmd.send(this.gameInfo.bank.way);
                }
            }
            break;
        case 'room':
            this.isCombat = false;
            this.nowRoomId = data.path;
            if  (data.path === this.gameInfo.temple.pathId ) {
                setTimeout(() => this.cmd.send(this.gameInfo.tower.way), 3e4);
            }
            else if (data.path ===this.gameInfo.bank.pathId){
                this.cmd.send('pack');
            }
            break;
        case 'dialog':
            if (data.dialog === 'pack'){
                if (this.nowRoomId === this.gameInfo.bank.pathId) {
                    data.items
                        .filter((item) => item && /突破|(?<!武道)残页/.test(item.name))
                        .forEach((item) => this.cmd.send(`store ${item.count} ${item.id}`));

                    this.cmd.send('tm 执行下一项');
                }
                if(data.items && data.eqs[0] !== null){
                    this.weapon = data.eqs[0].id
                }
            }
            break;
        case 'tip':
            if (data.data.includes('说：')) {
                return;
            }
            if (data.data.includes('脱手而出！')) {
                this.cmd.send(`eq ${this.weapon}`)
            }
            if (data.data.includes('打败我')) {
                this.cmd.send(`kill ${this.towerGuardianId}`);
            }
        
            if (data.data.includes('恭喜你战胜了')) {
                this.combatFailedNum = 0;
            }
        
            if (data.data.includes('灵魂状态')) {
                this.cmd.send('relive');
                clearInterval(this.timers.up);
                setTimeout(() => this.cmd.send(this.gameInfo.tower.way), 6e4);
            }
        
            if (data.data.includes('只能在战斗中使用')) {
                this.isCombat = false;
                clearInterval(this.timers.pfm);
            }
        
            if (data.data.includes('挑战失败')) {
                clearInterval(this.timers.up);
                this.combatFailedNum++;
                if (this.combatFailedNum >= 3) {
                    this.combatFailedNum = 0;
                    setTimeout(() => {
                        this.cmd.send(this.gameInfo.bank.way);
                    }, 1e4);
                } else {
                    setTimeout(() => {
                        this.cmd.send(this.gameInfo.temple.way);
                    }, 1e4);
                }
            }
            break;
        default:
            break;
    }
}