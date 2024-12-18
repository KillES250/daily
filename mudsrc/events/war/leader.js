const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const time = yaml.load(fs.readFileSync(path.resolve(__dirname, '../../../userconfig/userconfig.yaml')));

module.exports = async function (data) {
    switch (data.type) {
        case 'start':
            this.off('Data',require('../autopfm/autopfm.js'));
            this.on('Data',require('../autopfm/autopfm.js'));
            this.cmd.send('score');
            break;
            
        case 'dialog':
            //获取角色信息
            if (data.dialog === 'score' && data.level) {
                this.userId = data.id
                this.userLevel = data.level
                this.userMaxHp = data.max_hp
                this.cmd.send('enable blade none')
                this.warMode = initWarmode();
                if (this.warMode === 'r'){
                    this.cmd.send('enable blade yuanyuewandao');
                    this.startKill = true;
                }else if (this.warMode === 'o'){
                    this.cmd.send('enable blade xiuluodao');
                    this.skillsForGangleader.push('unarmed.qi');
                    this.skillsForGangleader.push('force.ding');
                }
                // 切换技能后等待pfm的返回绑定自动出招
                await sleep(5);
                // 为自动出招提供自动施法的技能
                this.skillsBanList = this.userSkills.filter(skill => !this.skillsForGangleader.includes(skill));
                this.cmd.send('go south');
                this.cmd.send('perform force.tu');
                // 加入一个等待参者准备的等待
                await sleep(15);
                this.cmd.send('party fam HUASHAN');
                if (this.warMode === 'r'){
                    this.cmd.send('pty 开始华山红');
                }else if (this.warMode === 'o'){
                    this.cmd.send('pty 开始华山橙');
                }
            }
            // 拾取分解 
            else if (data.dialog === 'pack' && data.name) {
                if (!data.name.includes('<hio>') && !data.name.includes('<wht>') && data.name.includes('君子')){
                    this.cmd.send(`fenjie ${data.id}`);
                }
            }
            break;
            
        case 'tip':
            if(data.data.includes('加油，加油！！') || data.data.includes('你要捡什么东西？') || data.data.includes('说：')){
                return;                
            }
            if(data.data.includes('你现在是灵魂状态，不能那么做。')){
                this.cmd.send('relive')
                return;
            }
            if(data.data.includes('正在进攻别的门派') || data.data.includes('帮派活跃度不够，无法开启门派战。')){
                this.cmd.send('pty 无法开启帮战');
            }
            break;
            
        case 'msg':
            // 此处的命令可以被所有人调用
            // 不想被调用则在if条件中添加data.name或者data.uid加以限制
            if(data.ch === 'pty'){
                // 开始判定()
                if(data.content.includes('即刻起开始进攻')){
                    this.war = 'start';
                    // 设置一个号令计时器
                    this.timerOfHaoLing = setInterval(() => {
                        this.cmd.send('pty 开始击杀!');
                    }, 1500000); // 25分钟为1500000毫秒
                    this.cmd.send(this.gameInfo.war.way);
                    return;
                }
                // 结束流程破判定
                if(data.content.includes('最终胜利') || data.content.includes('点子扎手') || data.content.includes('无法开启帮战')){
                    this.war = 'finish';
                    // 清除号令计时器
                    if (this.timerOfHaoLing) {
                        clearInterval(this.timerOfHaoLing);
                    }
                    await sleep(5);
                    this.emit('Data',{type:'end'}); 
                    return;
                }
                // 开始击杀
                if(data.content.includes('开始击杀')){
                    // 清空banlist技能列表，开启所有技能出招
                    this.skillsBanList = []
                    // 将击杀状态设为<可击杀>
                    this.startKill = true;
                    // 获取最后一个不为空的id下杀，确保掌门不被提前击杀
                    const killId = findLastId(this.warNpcId)
                    this.cmd.send(`kill ${killId}`)
                    return;
                }
                // 一组pty调用手动转火的指令
                if(data.content.includes('切换掌门') && this.warNpcId[1].id){
                    this.cmd.send(`kill ${this.warNpcId[1].id}`)
                    return;
                }
                if(data.content.includes('切换大长老') && this.warNpcId[2].id){
                    this.cmd.send(`kill ${this.warNpcId[2].id}`)
                    return;
                }
                if(data.content.includes('切换二长老') && this.warNpcId[3].id){
                    this.cmd.send(`kill ${this.warNpcId[3].id}`)
                    return;
                }
            }
            break;
            
        case 'items':
            if(this.room === '华山派-客厅'){
                // 如果独孤败天败天id存在，则下杀独孤败天(处理意外死亡返回)
                if (this.warNpcId[0].id) {
                    this.cmd.send(`kill ${this.warNpcId[0].id}`);
                    return;
                } 
                // 否则 掌门id存在，则连续下杀两次掌门
                if (this.warNpcId[1].id){
                    this.cmd.send(`kill ${this.warNpcId[1].id};kill ${this.warNpcId[1].id}`,false);
                    return;
                } 
                // 否则 掌门id为空的情况下，开始获取全部id赋值
                if (!this.warNpcId[1].id){
                    for(const key in data.items){
                        const item = data.items[key];
                        // 获取 岳不群的id
                        if(item.id && !item.p && item.name.includes('岳不群')){
                            this.warNpcId[1].id = item.id;
                        }
                        // 获取长老id
                        else if (item.id && !item.p && item.name.includes('华山派长老')){
                            // 如果 长老1_ID为空
                            if(!this.warNpcId[2].id){
                                // 获取长老1_ID
                                this.warNpcId[2].id = item.id;
                            }else{
                                // 获取长老2_ID
                                this.warNpcId[3].id = item.id;
                            }
                        }
                    }
                    // 循环结束，对长老1_进行下杀
                    this.cmd.send(`kill ${this.warNpcId[2].id}`)
                }
            }
            break;

        case 'itemadd':
            // 当房间内出现独孤败天时，获取其id
            if(this.room === '华山派-客厅' && data.name.includes('独孤败天') && !data.p){
                this.warNpcId[0].id = data.id;
                // 执行psxk，等待cmds返回
                this.cmd.send(this.gameInfo.week.way.yaoshen);
            }
            break;
        
        case 'itemremove':
            if(this.room === '华山派-客厅'){
                this.warNpcId.forEach(npc => {
                    if(npc.id === data.id){
                        //forEach会改变原数组
                        npc.id = null;
                        // 重新寻找数组中最后一个不为空的id进行下杀，确保掌门最后一个是死亡
                        const killId = findLastId(this.warNpcId)
                        this.cmd.send(`kill ${killId}`)
                    }else{
                        return;
                    }
                })
            }
            break;
        
        case 'cmds':
            // cmds的返回。请确保工具人至少有一个破碎虚空定位到古大陆-墓园
            const muyuan = data.items.find(way => way.name.includes('传送到古大陆-墓园'));
            // 该返回包含.cmd[]元素
            if(muyuan){
                this.cmd.send(muyuan.cmd)
            }
            break;
        
        case 'room':
            this.room = data.name;
            if(this.room === '古大陆-墓园'){
                while (true) {
                    await sleep(1);
                    //每秒循环一次，直到自身状态没有绿色的忙乱震慑为止
                    if(!this.userStatus.has('bss')){
                        // 切换回修罗刀
                        this.cmd.send('enable blade xiuluodao');
                        // 将<开始击杀>设置为不可执行状态
                        this.startKill = false;
                        this.cmd.send(this.gameInfo.war.way);
                        break;
                    }
                }
            }
            break;
               
        case 'sc':
            // 伤害返回解析
            if (this.room === '华山派-客厅') {
                // 遍历warNpcId，找到对应id的npc，更新其血量百分比
                for (const npc of this.warNpcId) {
                    if (npc.id === data.id) {
                        const hpPer = data.hp / npc.maxHp;
                        npc.hpPer = hpPer;
                        break;
                    }
                }
            }
            break;
            
        case 'shift':
            // 实例创建时会建立一个血量监控，目标血量低于50%时，发出shift事件
            // 事件触发时，如果击杀未开启
            if (this.startKill === false){
                // 跳转到目标
                this.cmd.send(`kill ${data.id};kill ${data.id}`, false);
                // 施放修罗清空增伤层数,然后化蝶
                this.cmd.send('perform blade.xiu;perform dodge.yao');
                // 寻找帮战npc顺序中下一个不为空的id进行下杀
                const nextId = getNextId(data.id, this.warNpcId);
                this.cmd.send(`kill ${nextId}`);
            }
            break;
            
        case 'dispfm':
            // 当检测到施放化蝶后
            if(data.id === 'dodge.yao'){
                // 建立一个递归函数，每0.5秒执行一次监测,当冷却技能菜单中不包含<枯木决>，则施放<枯木诀>并跳出。
                const pfmtuloop = () => {
                    if (!this.cd.has('force.tu')){
                        this.cmd.send('perform force.tu');
                        return;
                    }
                    setTimeout(pfmtuloop, 500);
                }
                // 立即执行
                pfmtuloop();
            }
            break;
        default:
            break;
    }
}
async function sleep(seconds) {
    return new Promise(resolve => {
        setTimeout(resolve, seconds * 1000);
    });
}

function initWarmode() {
    let warTimes = [];
    const currentHour = new Date().getHours();
    if (time.wartime.includes('|')) {
        warTimes = time.wartime.split('|');
    } else {
        warTimes = [time.wartime];
    }
    for (let time of warTimes) {
        const match = time.match(/^(\d{2}):(\d{2})(\S+)$/);
        if (match) {
            const hourStr = parseInt(match[1]);
            const mode = match[3];
            const hour = parseInt(hourStr);
            if (hour === currentHour) {
                if (mode === '红') {
                    const warmode = 'r';
                    return warmode;
                } else if (mode === '橙') {
                    const warmode = 'o';
                    return warmode;
                }else {
                    return 'none';
                }
            }
        }
    }
}

function getNextId(element,arr) {
    if (arr[0].id !== null){
        const result = arr[0].id;
        return result;
    } else {
        const arrtmp = arr.filter(item=>item.id != null)
        const index = arrtmp.findIndex(item => item.id === element);
        // const index = arr.filter(item => item.id != null).findIndex(item => item.id === element);
        const nextIndex = (index + 1) % arrtmp.length;
        return arrtmp[nextIndex].id;
    }
}

function findLastId(arr) {
    if (arr[0].id !== null){
        return arr[0].id;
    }
    const arrtmp = [...arr]
    const result = arrtmp.reverse().find(item => item.id !== null);
    return result ? result.id : null;
}
