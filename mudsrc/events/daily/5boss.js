const fs = require('fs');
const path = require('path');
const logger = require(path.resolve(__dirname, '../../../server/logger'));
const { tipback } = require('../../example/tipback.js');

module.exports = async function (data) {
    const logFilePath = path.join(__dirname, 'bosslogs', `${this.userConfig.name}BOSS.log`);
    switch (data.type) {
        case 'start':
            this.cmd.send('team dismiss;team out')
            this.cmd.send('stopstate');
            // 这里需要获取玩家id
            this.cmd.send('score')
            // 移动到客栈
            this.cmd.send('jh fam 0 start;go north;go east')
            break;
        
        case 'dialog':
            if(data.dialog === 'score' && data.id){
                //id用于嗜血切内功
                this.userId = data.id
                //境界用于闭关判定
                this.userLevel = data.level;
            }
            // 判定为拾取
            else if(data.dialog === 'pack' && data.name){
                // 副本掉落分解
                this.gameInfo.useLessItems.includes(data.name) && this.cmd.send(`fenjie ${data.id}`);
                // 白色掉落丢弃
                data.name.includes('<wht>') && !data.name.includes('东厢钥匙') && this.cmd.send(`drop ${data.count} ${data.id}`);
            }
            break;
            
        case 'room':
            this.room = data.name;
            this.roomPath = data.path;
            fs.appendFileSync(logFilePath,`${this.room}\n`);
            // 这里会跳转到item中拿到为推床次数做赋值
            if(this.room === '移花宫-邀月宫(副本区域)' || this.room === '移花宫-涟星宫(副本区域)'){
                this.cmd.send('look hua')
            }
            // 云梦沼泽 围墙重复判定
            // 冰火岛 石洞重复判定
            // 燕子坞 后堂重复判定
            // 论剑台 重复判定
            if(
                this.room === '云梦沼泽-茅屋(副本区域)' ||
                this.room === '冰火岛-石洞(副本区域)' ||
                this.room === '燕子坞-还施水阁(副本区域)' ||
                this.roomPath === 'huashan/lunjian/top'
            ){
                this.executed = false;
            }
            break;
        
        case 'item':
            if(data.desc){
                const moveBedNum = data.desc.match(/你数了下大概有(.*?)朵花/);
                if(this.room === '移花宫-邀月宫(副本区域)'){
                    this.pushBedLeftNum = moveBedNum[1];
                } else if (this.room === '移花宫-涟星宫(副本区域)'){
                    this.pushBedRightNum = moveBedNum[1];
                }
            }
            break;
        
        case 'die':
            if(!data.relive){
                // 死亡
                this.relive = false;
            } else {
                // 已经复活
                this.relive = true;
                this.bossFightTestNum++;
                // 尝试次数小于3次，继续调用击杀流程，否则退出副本
                if (this.bossFightTestNum < 3) {
                    this.cmd.send('tm 调用击杀')
                } else {
                    logger.warning(`「${this.userConfig.name}」击杀${this.bossName}已失败超过3次，准备退出副本。`);
                    this.cmd.send('cr over');
                    this.cmd.send('tm 调用结束')
                } 
            }
            break;
            
        case 'combat':
            /*  逻辑说明：
                这里只处理被NPC主动叫杀战斗结束的情况
                如果是被boss击杀，则会先返回战斗结束end，天师符3秒站立起来后，会返回新的items，并且从items返回处继续跳转流程
                【战斗结束————> 买天师符 ————> 复活 ————> 获得新的items返回(boss存在)】这种情况不会在这里得到处理。
            */
            if (data.end && this.relive === true){
                if(this.bossId){
                    //清空路径
                    this.fbPath = [];
                    this.cmd.send('tm 调用击杀')
                    break;
                } 
                // 删除路径逻辑
                // 如果是进入房间堵路，则已经删除过一次上次运动的轨迹了，【主动】叫杀前此变量为false，战斗结束后则不删除路径，继续执行下一次路径
                // 删+下
                
                // 否则为进入房间【被叫杀】，进入房间后还未删除上一次的路径，变量会默认为ture，
                // 此时战斗结束后则会删除上一次的行动轨迹(无需重置)跳转至下方的下一次路径判定
                // 删+下
                if (this.delpath === true){
                    this.fbPath.shift()
                } else {
                    // 否则重置删除路径标记
                    this.delpath = true;
                }

                // 及其的特殊处理主动被叫杀后需要解密的房间(二联特殊处理)
                if (this.roomPath === 'bj/shenlong/lin1'){
                    this.cmd.send('kan bush');
                    // 这里会从tip处等待下一次路径的处理
                    break;
                } 
                if (this.roomPath === 'cd/yunmeng/zhaoze4'){
                    this.cmd.send('kan lu');
                    // 这里会从tip处等待下一次路径的处理
                    break;
                }
                
                // 添加一个循环判定，确保items返回被解析完成后再进行下一步动作
                while (this.itemsResult === false) {
                    await sleep(1);
                    if(this.itemsResult === true){
                        this.cmd.send('tm 调用下次路径判定');
                        break;
                    }
                }
                this.cmd.send('tm 调用下次路径判定');
            }
            break;
        
        case 'items':
            if(this.room === '扬州城-有间客栈'){
                for (const item of data.items) {
                    if (item && !item.p && item.name.includes('店小二')) {
                        this.cmd.send(`give ${item.id} 20000 money`);
                    }
                }
            }
            if(this.room.includes('副本区域')){
                this.npclist = [];
                for (const item of data.items) {
                    if (item && !item.p && item.hp) {
                        if(item.name.includes(this.bossName)){
                            this.bossId = item.id;
                            this.fbPath = [];
                        } else {
                            this.npclist.push({name:item.name, id:item.id})
                        }
                    }
                }
                // 解析完毕，更改解析状态
                this.itemsResult = true;
                // 如果处于战斗会等待战斗结束跳转到上面的combat-end处进行处理
                if(this.isCombat === false){
                    this.cmd.send('tm 调用当前路径判定');
                }
            }
            break;
        
        case 'nowPath':
            // boss存在
            if(this.bossId){
                //清空路径
                this.fbPath = [];
                this.cmd.send('tm 调用击杀')
            } 
            // boss不存在
            else {

                /* ——————————————位移部分————————————*/
                // 温府大门立即处理 (在删除路径之前)
                if(this.roomPath === 'cd/wen/damen'){
                    this.cmd.send('climb tree');
                        //这里直接跳出，等待items信息返回    
                    break;
                }
                // 云梦沼泽围墙位移判定(在删除路径之前)
                if(this.roomPath === 'cd/yunmeng/weiqiang' && this.executed === true){
                    this.cmd.send('jump wei');
                    // 这里循环被跳出后来等待茅屋 的items的返回继续
                    break;
                }
                // 冰火岛钻洞判定
                if(this.roomPath === 'mj/bhd/shishan2' && this.executed === true){
                    this.cmd.send('zuan dong');
                     // 这里循环被跳出后来到山洞，等待山洞 的items的返回继续
                    break;
                }
                // 移花宫迷宫判定(在删除路径之前)
                if(this.roomPath === 'huashan/yihua/yihua0'){
                    this.cmd.send('go south');
                        // 这里循环被跳出后来到山道，等待 山道 的items的返回继续
                    break;
                }
                
                // 缥缈峰位移判定(在删除路径之前)
                if(this.roomPath === 'lingjiu/jian'){
                    this.cmd.send('zou tiesuo');
                    // 这里直接跳出，等待items成功或者tip失败的返回继续
                    break;
                }
                
                // 华山论剑台只有在未去过华山绝顶的情况下才发送解密信息(在删除路径之前)
                if(this.roomPath === 'huashan/lunjian/tai' && this.executed === true){
                    this.cmd.send('jump bi')
                    // 这里直接跳出，等待items返回继续
                    break;
                }
                /* ——————————————位移部分————————————*/
                
                // 删除上一步(已经成功执行得到正确返回的)路径
                this.fbPath.shift()
                // 重置items解析状态
                this.itemsResult = false;
                
                /* ——————————————无位移部分————————————*/
                // 地主家判定
                // 可能出现没打到钥匙，员外还在这里就走不到西厢房，却收到没有钥匙的开门提示，提前结束副本
                if(this.roomPath === 'yz/cuifu/houyuan'){
                    if(this.npclist.length === 0){
                        this.cmd.send('open men')
                    } else {
                        // 否则直接跳出，等待执行去西厢房被拦路跳转下杀
                        this.cmd.send('tm 调用下次路径判定')
                    }
                    break;
                }
                
                //宫主房间判定(这里可能存在卡主的情况，暂不调整)
                if(this.roomPath === 'huashan/yihua/woshi'){
                    this.cmd.send('pushstart bed')
                    this.cmd.send(`${'pushleft bed;'.repeat(this.pushBedLeftNum)}`)
                    this.cmd.send(`${'pushright bed;'.repeat(this.pushBedRightNum)}`)
                    // 这里直接跳出等待tip返回继续
                    break;
                }
                // 燕子坞牌位判定
                if(this.roomPath === 'murong/houting' && this.executed === true){
                    this.cmd.send(`${'bai pai;'.repeat(3)}`)
                    // 这里直接诶跳出，等待tip返回继续
                    break;
                }
                /* ——————————————无位移部分————————————*/
                
                // 其他特殊房间的解密动作
                const decrypt = tipback.specPath.find(item => item.id === this.roomPath);
                if(decrypt){
                    this.cmd.send(decrypt.act)
                } //如果不是解密房间则继续跳转路径判定
                else {
                    this.cmd.send('tm 调用下次路径判定')
                }
            }
            break;
        
        case 'nextPath':
            // 如果路径长度不为0，则继续执行路径数组第一个指令
            // 对特殊情况的下脱战进行处理
            if(this.bossId){
                this.cmd.send('tm 调用击杀');
                break;
            }
            if(this.fbPath.length > 0){
                this.cmd.send(this.fbPath[0]);
            } else {
                this.cmd.send('cr over')
                this.cmd.send('tm 调用结束');
            }
            break;
        
        case 'readyForKill':
            // 嗜血模式(血剑刀典)
            // 1、无需击杀npc
            if(this.userConfig.redboss === false && !data.kill){
                // 等待技能冷却
                await sleep(60);
                // 清空技能黑名单
                this.skillsBanList = [];
                // 将血海加入黑名单
                this.skillsBanList = this.userSkills.filter(skill => !this.skillsForRedBoss.includes(skill));
                // 剑心+探龙
                this.cmd.send('enable force none;enable force cihangjiandian')
                this.cmd.send(`perform force.xin;perform ${this.tanlong}`)
            } 
            // 2、需击杀npc
            else if (this.userConfig.redboss === false && data.kill) {
                this.cmd.send('enable force changshengjue;perform force.zhen;enable force cihangjiandian');
                this.npclist.forEach(item => {
                    killCommands += `kill ${item.id};`;
                });
                this.cmd.send(killCommands,false);
                // 等待战斗结束自动跳转至上方击杀boss调用处
            }
            // 直接击杀
            else {
                this.cmd.send(`kill ${data.id}`)
            }
            break;
        
        case 'msg':
            if (data.ch === 'tm') {
                if(data.content === '调用击杀'){
                    this.emit('Data', { type: 'readyForKill' , id:this.bossId});
                    return;
                } 
                if(data.content === '调用击杀2'){
                    this.emit('Data', { type: 'readyForKill' , id:this.bossId , npc:'kill'});
                    return;
                } 
                if (data.content === '调用结束') {
                    this.emit('Data', { type: 'next' });
                    return;
                }
                if (data.content === '调用当前路径判定'){
                    this.emit('Data', { type: 'nowPath' });
                    return;
                }
                if (data.content === '调用下次路径判定'){
                    this.emit('Data', { type: 'nextPath' });
                    return;
                }
                // 测试代码
                if (data.content.includes('这位客官，我最近听不少人说是')) {
                    const bossMsg = data.content.match(/我最近听不少人说是在(.*?)见到过(.*?)。/);
                    // 获取副本，boss名字
                    this.bossName = bossMsg[2].trim();
                    const dest = bossMsg[1].trim();
                    const fbWayArray = Object.entries(this.gameInfo.fbWay);
                    const fbWayEntry = fbWayArray.find(entry => entry[0] === dest);
                    if (fbWayEntry) {
                        // 建立数组，开始执行寻路
                        this.fbPath = fbWayEntry[1].split(';');
                        this.cmd.send(this.fbPath[0]);
                    } else {
                        logger.warning(`「${this.userConfig.name}」解析boss信息失败，准备退出流程。`);
                        this.cmd.send('tm 调用结束');
                    }
                }
                // 测试代码
            }
            break;
        
        case 'tip':
            if (data.data.includes('说：')) {
                break;
            }
            // 彻底卡主代码
            if(data.data.includes('这个方向没有出路。')){
                logger.warning(`${this.userConfig.name}，彻底卡住，即将退出副本流程`);
                this.fbPath = []
                this.cmd.send('cr over')
                this.cmd.send('tm 调用结束');
            }
            fs.appendFileSync(logFilePath, `${data.data}\n`);
            // 黑木崖密道二次判定
            if(data.data === '你点燃了火折，发现墙上有个铁环，似乎是个机关。'){
                this.cmd.send('push')
                // 这里跳出，等待下一个tip的返回
                break;
            }
            // 解密失败的返回
            if(tipback.fail.test(data.data)){
                logger.warning(`${this.userConfig.name}，缺少副本必要条件，即将退出副本流程`);
                this.fbPath = []
                this.cmd.send('cr over')
                this.cmd.send('tm 调用结束');
                break;
            }
            // 堵路的返回
            if(tipback.blocking.test(data.data)){
                // 不允许主动删除路径
                this.delpath = false;
                this.itemsResult = true;
                let killCommands = '';
                this.npclist.forEach(item => {
                    killCommands += `kill ${item.id};`;
                });
                this.cmd.send(killCommands,false);
                // 这里直接跳出,等待combat的end返回
                break;
            }
            // 解密动作反馈成功的返回
            if(tipback.success.test(data.data)){
                this.cmd.send('tm 调用下次路径判定')
                // 跳出
                break;
            }
            
            // 探龙成功继续调用击杀流程
            if(/结果你什么都没偷到|偷到了|没什么值钱/.test(data.data)){
                this.cmd.send('tm 调用击杀2');
                break;
            }
            
            // 流程失败判定
            if(/没有那么多的钱|店小二不要你的钱。/.test(data.data)){
                this.cmd.send('tm 调用结束');
                return
            }
            
            // 执行判定
            if (data.data.includes('这位客官，我最近听不少人说是')) {
                const bossMsg = data.data.match(/我最近听不少人说是在(.*?)见到过(.*?)。/);
                // 获取副本，boss名字
                this.bossName = bossMsg[2].trim();
                const dest = bossMsg[1].trim();
                const fbWayArray = Object.entries(this.gameInfo.fbWay);
                const fbWayEntry = fbWayArray.find(entry => entry[0] === dest);
                if (fbWayEntry) {
                    // 建立数组，开始执行寻路
                    this.fbPath = fbWayEntry[1].split(';');
                    this.cmd.send(this.fbPath[0]);
                } else {
                    logger.warning(`「${this.userConfig.name}」解析boss信息失败，准备退出流程。`);
                    this.cmd.send('tm 调用结束');
                }
            }
            break;
        
        case 'itemremove':
            if(this.bossId && this.bossId === data.id){
                // 发现boss的时候路径被全部删除，
                // 这里赋值为空，会在战斗结束后调用路径，跳转至路径判定(路径为0处)，然后结束副本
                this.fbPath = [];
                this.bossId = null;
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