
module.exports = async function (data) {
    switch (data.type) {
        case 'start':
            this.cmd.send('score')
            break;
        case 'dialog':
            //获取角色信息
            if (data.dialog === 'score' && data.level) {
                this.userId = data.id;
                this.userLevel = data.level;
                this.userMaxHp = data.max_hp;
                this.cmd.send('cha');
                return;
            }
            // 获取技能信息,填入技能回装，拆技能。
            if (data.dialog === 'skills' && !data.id){
                for (const key in data.items) {
                    if(data.items[key].enable_skill){
                        // 回装技能数组
                        const item = data.items[key];
                        this.enableSkills.push(`enable ${item.id} ${item.enable_skill}`)
                        this.cmd.send(`enable ${item.id} none`)
                    }
                };
                this.cmd.send('pack')
                return;
            }
            //打开背包
            if (data.dialog === 'pack' && !data.eq){
                // 判定是否是拾取。不是拾取的话，获软猬甲并装备，然后去往武庙
                if (data.items){
                    for(const key in data.items){
                        if (data.items[key].name.includes('软猬甲')) {
                            this.cmd.send(`eq ${data.items[key].id}`);
                        }
                    }
                    this.cmd.send(this.gameInfo.temple.way);
                    return;
                }
                if (data.name){
                    // 分解除白色、橙色之外的装备
                    if (!data.name.includes('<hio>') && !data.name.includes('<wht>') && data.name.includes('君子')){
                        this.cmd.send(`fenjie ${data.id}`);
                    }
                    return;
                }
            }
            break;
            
        case 'room':
            this.room = data.name
            //上线一分钟后，帮战未开启则终止流程
            if (this.room === '扬州城-武庙' && this.war === 'none'){
                await sleep(60);
                if(this.war === 'none'){
                    this.war = 'finish';
                    this.enableSkills.forEach(enableCmd => {
                        this.cmd.send(enableCmd)  
                    });
                    await sleep(5);
                    this.emit('Data',{type:'end'});
                }
            }
            break;
            
        case 'items':
            //当所处房间为帮战房间时 
            if( this.room === '华山派-客厅'){
                // 先判定一波尸体拾取，用于撞红后死亡复活回来拾取
                for(const key in data.items){
                    const item = data.items[key];
                    if(item && item.name.includes('的尸体') && !item.p){
                        this.cmd.send(`get all from ${item.id}`);
                    }
                };
                // 回到房间的时候如果败天存在，则下杀败天，否则等待眩晕
                if (this.warNpcId[0].id){
                    this.cmd.send(`kill ${this.warNpcId[0].id}`)
                   }
            }
            break;
            
        case 'status':
            // 多重判定跟随眩晕转火
            if(this.room === '华山派-客厅' && this.war === 'start' && data.action === 'add' && data.sid === 'faint'){
                this.cmd.send(`kill ${data.id};kill ${data.id}`,false)
            }
            break;
            
        // 死亡复活
        case 'die':
            if (data.relive) {
                return;
            }
            this.cmd.send('relive')
            await sleep(3);
            this.cmd.send(this.gameInfo.war.way);
            break;
        case 'itemadd':
            // 新增败天的时候获取赋值
            if(this.room === '华山派-客厅' && data.name.includes('独孤败天')){
                this.warNpcId[0].id = data.id;
            }
            break;
        case 'msg':
            if(data.ch === 'pty'){
                if(data.content.includes('即刻起开始进攻')){
                    this.war = 'start';
                    this.cmd.send(this.gameInfo.war.way);
                }
                else if(data.content.includes('最终胜利') || data.content.includes('点子扎手') || data.content.includes('无法开启帮战')){
                    this.war = 'finish'
                    // 添加等待，防止死亡后未拾取物品
                    await sleep(6);
                    this.emit('Data',{type:'end'}); 
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

