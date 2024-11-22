module.exports = async function (data){
    // 自创技能装备、卸下
    const changeSkills = (action) => {
        if (action === 'add') {
            for (const key in this.enableSkillList) {
                const item = this.enableSkillList[key];
                this.cmd.send(`enable ${item.type} ${item.id}`);
            }
        } else if (action === 'remove') {
            for (const key in this.enableSkillList) {
                const item = this.enableSkillList[key];
                this.cmd.send(`enable ${item.type} none`);
            }
        }
    };
    switch (data.type){
        case 'start':
            this.cmd.send('tm 开始妖神流程')
            /* this.canSeamless在主进程启动时会获得
                null（未知错误）
                false（不能无缝）
                ture（能无缝）
                三种状态的判定
            */
            if(this.canSeamless === null){ 
                this.cmd.send('tm 结束妖神流程')
                return;
            }
            this.cmd.send('jh fam 0 start;score'); //前往广场(为破碎虚空做准备)开始捕获准备数据
            break;
        case 'room':
            if(this.room === '墓园-弑妖塔' && this.canSeamless === false){ //进入妖塔后吃药
                this.cmd.send(`use ${this.xuanlingdan.id}`)
                this.xuanlingdan.num -= 1
                return;
            }
            if(this.room === '古大陆-墓园'){
                if(this.xuanwuOK){
                    this.cmd.send('tm 结束妖神流程1')
                    return;
                }
                if(this.canSeamless === false && !this.xuanlingdan.id && this.xuanlingdan.num <= 1){ //这是吃药无缝失败后药没了的判定
                    this.cmd.send('tm 结束妖神流程1')
                    return;
                }
                if(this.yaoshenTestNum <= 3){
                    const intervalId = setInterval(() => {
                        if (this.userStatus.size === 0 && this.cd.size === 0) {
                            this.cmd.send('tm 准备进入妖塔');
                            clearInterval(intervalId);
                        } 
                    }, 1000); // 每1秒自检一次等待buff消失、技能全部冷却
                    return;
                }
                if (this.yaoshenTestNum > 3){
                    this.cmd.send('tm 结束妖神流程1')
                }

            }
            break;
        case 'itemadd':
            if(this.room === '墓园-弑妖塔'){//当妖塔内触发人物添加事件，将妖神KO状态设置为false
                this.yaoshenOK = false;
            }
            break;
        case 'tip':
            if(data.data.includes('说：')){
                return;
            }
            if(data.data.includes('你的挑战失败了。')){
                this.yaoshenTestNum += 1;
            }
            if(/不能开启弑妖塔。|不能挑战妖神。|你本周已经挑战过妖神/.test(data.data)){
                this.cmd.send('tm 结束妖神流程1')
                return;
            }
            if( data.data.includes('崩解为碎片。')){
                this.yaoshenOK = true;
                this.xuanwuOK = /玄武/.test(data.data) ? true : this.xuanwuOK;
            }
            break;
        case 'combat':
            if(this.room === '墓园-弑妖塔' && data.end === 1){//妖塔内战斗结束后
                if(this.yaoshenOK && this.xuanwuOK){//如果妖神是被击败的，并且击败的是玄武
                    this.cmd.send('lkfb ok');
                    return;
                }
                if (this.yaoshenOK && !this.xuanwuOK) {//如果妖神是被击败的，并且击败的不是玄武
                    const intervalId = setInterval(() => {
                        if (this.userStatus.size === 0 || !this.cd.has('force.ding')) {
                            //施法重组
                            this.skillsBanList = this.userSkills.filter(skill => !this.skillsToYaoShen.includes(skill));
                            this.cmd.send('lkfb next');
                            clearInterval(intervalId);
                        } 
                    }, 1000); // 每1秒自检一次等待buff全消失，并且等待定乾坤冷却
                    return;
                }
                if (!this.yaoshenOK){//如果妖神不是被击败的，放弃奖励离开副本
                    this.yaoshenTestNum += 1
                    this.cmd.send('lkfb gu');
                    return;
                }
            }
            break;
        case 'status':
            if(this.room === '墓园-弑妖塔'){
                // 无缝黄玄灵判定
                if(data.action === 'remove' && data.sid === 'food' && data.id === this.userId){
                    if(this.xuanlingdan.num >= 1){
                        this.cmd.send(`use ${this.xuanlingdan.id}`)
                        this.xuanlingdan.num -= 1
                    }
                }
                // 妖神之力消失候解开全自动施法
                if(data.action === 'remove' && data.sid === 'bite' && data.id !== this.userId){
                    this.skillsBanList = []
                }
            }
            break;
        case 'cmds':
            if (this.room !== '墓园-弑妖塔'){
                const muyuan = data.items.find(way => way.name.includes('传送到古大陆-墓园'));
                muyuan ? this.cmd.send(muyuan.cmd) : this.cmd.send('tm 结束妖神流程');
                return;
            }
            break;
        case 'msg':
            if(data.ch === 'tm'){
                if(data.content === '结束妖神流程1'){
                    if (this.userSkills.includes('blade.ru')){
                        changeSkills('remove')
                        this.cmd.send('zc pfmdel force jiuyangshengong power ok2;zc pfmdel force taixuangong shi ok2;')
                        this.cmd.send('zc pfmadd force cihangjiandian xin ok;zc pfmadd force kumushengong tu ok;zc pfmadd force changshengjue zhen ok;')
                        this.cmd.send('enable force changshengjue;perform force.zhen')
                        changeSkills('add')
                        this.cmd.send('enable parry qiankundanuoyii')
                        this.cmd.send(`enable parry ${this.userId}`)
                        this.cmd.send('tm 结束妖神流程')
                    }
                    return;
                }
                if(data.content === '准备进入妖塔'){//魔刀判定
                    if(this.userSkills.includes('blade.ru')){
                        changeSkills('remove')
                        this.cmd.send('zc pfmdel force cihangjiandian xin ok2;zc pfmdel force changshengjue zhen ok2;zc pfmdel force nitiandao nian ok2;zc pfmdel force kumushengong tu ok2')
                        this.cmd.send('zc pfmadd force jiuyangshengong power ok;zc pfmadd force taixuangong shi ok;')
                        this.cmd.send('enable force changshengjue;perform force.zhen')
                        changeSkills('add')
                        this.cmd.send('enable parry qiankundanuoyi')
                    }
                    // 施法重组
                    this.skillsBanList = this.userSkills.filter(skill => !this.skillsToYaoShen.includes(skill));
                    this.cmd.send(`sss muyuan`)
                }
                if (data.content === '结束妖神流程'){
                    this.emit('Data',{ type:'next' });
                    return;
                }
            }
            break;
        case 'dialog':
            if(data.dialog === 'score'){
                if(data.level){ //无说明
                    this.userId = data.id
                    this.userLevel = data.level
                    this.userMaxHp = data.max_hp
                    this.cmd.send('score2');
                    return;
                }
                if(data.distime){
                    if(!this.canSeamless){ //如果不能无缝
                        this.danColor = getDanColor(data.distime) //获取丹药颜色
                        if(this.danColor === null){ //如果拿不到可使用的丹药颜色
                            this.cmd.send('tm 结束妖神流程');
                        }
                    }
                    this.cmd.send('cha');
                    return;
                }
            }
            if(data.dialog === 'skills' && data.items){
                for(const key in data.items){
                    const skill = data.items[key]
                    if(skill.enable_skill && skill.enable_skill === this.userId){ //自创技能
                        this.enableSkillList.push({ type: skill.id, id: this.userId });
                    }
                    if(skill.id === 'kongmingquan' && skill.level >= 5000){ //如果空明拳大于5000级,则装备空明拳(这里会强制玩家调整控制自己的空明等级)
                        this.kongmingquan = true;//这个变量为autopfm.js服务的，用于区别流程。
                        this.cmd.send('enable unarmed kongmingquan');
                    }
                }
                this.cmd.send('pack');
                return;
            }
            if (data.dialog === 'pack' && data.items ){
                if(!this.canSeamless){ //背包背部关于吃药无缝的判定
                    for(const key in data.items){
                        const item = data.items[key]
                        if(item.name.includes(this.danColor)){
                            this.xuanlingdan.id = item.id;
                            this.xuanlingdan.num = item.count;
                            break;
                        }
                    }
                    // 循环结束后没有找到丹药或者丹药数量等于0
                    if(!this.xuanlingdan.id || this.xuanlingdan.num === 0){
                        this.cmd.send('tm 结束妖神流程')
                    }
                }
                this.cmd.send('psxk')
            }
            break;
        default:
            break;
    }
}

function getDanColor(data){
    const match = data.match(/(\d+(\.\d+)?)秒\+(\d+)%/);
    if (match) {
        const fixed = parseFloat(match[1]);
        const pre = parseInt(match[3], 10);
        const nendDanPre = (1 - 10 / (60 - fixed)) * 100 - pre;
        if (nendDanPre <= 10){ return '<hiy>玄灵丹</hiy>'; } 
        if (nendDanPre <= 15){ return '<HIZ>玄灵丹</HIZ>'; }
        if (nendDanPre <= 20){ return '<hio>玄灵丹</hio>'; } 
        if (nendDanPre > 20 ){ return null; }
    } else {
        return null;
    }
}