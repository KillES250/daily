const path = require('path');
const logger = require(path.resolve(__dirname, '../../../server/logger'));
const timers = require('../../../server/timers');
const buffList = [
    { name:'入魔', id:'blade.wu'},
    { name:'嗜血', id:'blade.shi'},
    { name:'剑雨', id:'sword.yu'},
    { name:'剑心', id:'force.xin'},
    { name:'九阳护体', id:'force.power'},
    { name:'混沌', id:'force.busi'},
    { name:'鬼影' , id:'dodge.gui'},
    { name:'凌波', id:'dodge.lingbo'}
];

module.exports = async function (data){
    switch(data.type){
        case 'combat':
            this.isCombat = data.start ? true : false;
            if (!this.isCombat) {
              clearInterval(this.timers.pfm);
            } else {
              this.timers.pfm = setInterval(timers.pfm.bind(this), 5e2);
            }
            break;
        case 'die':
            if (data.relive) {
                return;
            }
            clearInterval(this.timers.pfm);
            clearInterval(this.timers.up);
            this.userStatus = new Set();
            this.combatFailedNum++;
            if (this.room && this.room.includes('副本区域')){
                await sleep(1);
                this.cmd.send('shop 1 1;relive locale')
            }else {
                this.cmd.send('relive');
            }
            if(this.war === 'start'){
                this.cmd.send(this.gameInfo.war.way);
            }
            break;
        case 'dispfm':
            // 左右剑罡or剑来
            if((data.id === 'sword.lai' || data.id === 'sword.ji') && this.kongmingquan){
                this.cmd.send('perform unarmed.zuo');
            }
            // 当塔主跟boss以及帮战开始时，如果出招返回有这些buff，则直接跳出并指向————>case 'status':add位置
            if(this.userConfig.week.tazhu === true || this.war === 'start' || this.userConfig.redboss === true){
                if(buffList.some(buff => buff.id === data.id)){
                    return;
                }
            }
            if (data.id && data.distime) {
                this.cd.add(data.id);
                setTimeout(() => this.cd.delete(data.id), data.distime);
            }
            if (data.rtime) {
                this.gcd = true;
                setTimeout(() => (this.gcd = false), data.rtime);
            } else {
                this.gcd = false;
            }
            break;
        case 'ERROR':
            this.logger.error(data);
            break;
        case 'perform':
            // 是否要吃玄灵丹判定
            for (const key in data.skills){
                const skill = data.skills[key];
                if(skill.name === '剑心通明' || skill.name === '定乾坤' || skill.name === '天地决' || skill.name === '一念轮回'){
                    this.canSeamless = skill.distime > 10000 ? false : true;
                }
            }
            
            if (this.userConfig.redboss === false){
                data.skills.forEach(item => {
                    if(item.name === '探龙'){
                        this.tanlong = item.id;
                    }
                });
            }
            const skillPriority = {
                'force.ding': 0,
                'force.busi': 0,
                'force.xin': 0,
                'force.cui': 0,
                'blade.shi': 1,
                'sword.wu': 1,
                'sword.yi': 1,
                'blade.ref': 1,
                'force.ling': 1,
                'dodge.gui': 1,
                'force.zhen': 2,
                'dodge.fo': 2,
                'dodge.power': 2,
                'dodge.lingbo': 2,
                'force.power': 2,
                'force.wang': 3,
                'sword.yu': 4,
                'parry.yi': 5,
                'throwing.ding': 5,
                'unarmed.duo': 5,
                'unarmed.chan': 5,
                'sword.po': 5,
                'sword.chan': 5,
                'force.tu': 6,
                'blade.xue': 6,
                'throwing.luo': 6,
                'sword.ji': 6,
            };
            const banSkills = ['force.tuoli', 'unarmed.ref', 'force.jiu', 'force.xi', 'force.hama','unarmed.zuo','dodge.yao','unarmed.luo'];
            this.userSkills = Array.from(data.skills, (item) => item.id);
            this.userSkills = this.userSkills.sort((a, b) => {
                const skillsAPriority = skillPriority[a] ? skillPriority[a] : 9;
                const skillsBPriority = skillPriority[b] ? skillPriority[b] : 9;
                return skillsAPriority - skillsBPriority;
            });
            this.userSkills = this.userSkills.filter((skill) => !banSkills.includes(skill));
            break;
        case 'status':
            if (data.id !== this.userId) {
                return;
            }
            if(data.action === 'add') { 
                this.userStatus.add(data.sid);
                if(this.userConfig.week.tazhu === true || this.war === 'start' || this.userConfig.redboss === true){
                    const thisBuffskill = buffList.find(buff => buff.name === data.name);
                    if(thisBuffskill){
                        this.cd.add(thisBuffskill.id);
                        setTimeout(()=>this.cd.delete(thisBuffskill.id), data.duration);
                    }
                }
            }
            else if(data.action === 'remove') { 
                if (Array.isArray(data.sid)) {
                    data.sid = data.sid.filter(item => item !== 0);
                    data.sid.forEach(sid => this.userStatus.delete(sid));
                } else {
                    this.userStatus.delete(data.sid);
                }
            }
            else if(data.action === 'clear') {
                 this.userStatus = new Set();
            }
            break;
        // case 'tip':
        //     logger.debug(`「${this.userConfig.name}」${tip}`);
        //     break;
        default:
            break;
    }
}

async function sleep(seconds) {
    return new Promise(resolve => {
        setTimeout(resolve, seconds * 1000);
    });
}