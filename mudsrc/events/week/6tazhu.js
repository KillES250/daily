const path = require('path');
const logger = require(path.resolve(__dirname, '../../../server/logger'));

module.exports = async function (data){
    switch (data.type){
        case 'start':
            if ( this.userConfig.week.tazhu !== null){
                this.cmd.send('tm 开始塔主流程');
                this.cmd.send('score');
            } else {
                this.cmd.send('tm 结束塔主流程')
            }
            break;
        case 'room':
            if (data.name === '扬州城-武庙'){
                this.cmd.send('liaoshang');
            }
            break;
        case 'items':
            if(this.room === '武道塔-第一百层'){
                for(const target of data.items){
                    if(target.id && !target.p && target.name.includes('武道塔主')){
                        // 嗜血的判定，禁用所有技能
                        if(this.userConfig.week.tazhu === false){
                            this.skillsBanList = this.userSkills
                        }
                        this.cmd.send(`kill ${target.id}`)
                    }
                }
            }
            break;
        case 'tip':
            if(data.data.includes('说：')){
                return;
            }
            if(data.data.includes('你目前可以直接去挑战第')){
                const num = data.data.match(/\d+/g)[0];
                if(num === 100){
                    this.cmd.send('go enter');
                } else {
                    this.cmd.send('tm 结束塔主流程');
                }
                return;
            }
            if(data.data.includes('你先处理好自己的状态再说！')){
                this.cmd.send(this.gameInfo.temple.way)
                return;
            }
            if(data.data.includes('慢慢的你又恢复了知觉') && !this.isCombat){
                this.cmd.send(this.gameInfo.temple.way)
                return;
            }
            if(data.data.includes('你的挑战失败了。')){
                if(this.tazhuTestNum <= 3){
                    this.cmd.send(this.gameInfo.temple.way)
                    this.tazhuTestNum++
                }else{
                    this.cmd.send('tm 结束塔主流程');
                }
                return;
            }
            if(data.data.includes('恭喜你战胜了<ord>武道塔主</ord>。')){
                this.cmd.send('tm 结束塔主流程');
                return;
            }

            if(data.data.includes('<hiy>你疗伤完毕，深深吸了口气，脸色看起来好了很多。</hiy>')){
                //嗜血且当前任务是塔主的判定
                if(this.userConfig.week.tazhu === false){
                    this.skillsBanList = this.userSkills;
                }
                this.cmd.send('jh fam 9 start')
                return;
            }
            break;
        case 'sc':
            if(data.id === this.userId && data.hp  && this.room === '武道塔-第一百层'){
                const hpPercent = data.hp / this.userMaxHp;
                // 嗜血气血低于0.5的时候，只禁用血海魔刀（解开全自动施法）
                if(this.userConfig.week.tazhu === false && hpPercent < 0.5){
                    this.skillsBanList = ['blade.xue'];
                }
            }
            break;
        case 'msg':
            if(data.ch === 'tm' && data.content === '结束塔主流程'){
                this.emit('Data',{ type:'next' });
            }
            break;
        case 'dialog':
            if(data.dialog === 'score' && data.level){
                this.userId = data.id
                this.userLevel = data.level
                this.userMaxHp = data.max_hp
                this.cmd.send('jh fam 9 start');
                return;
            }
            break;
        default:
            break;
    }
}