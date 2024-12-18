const path = require('path');
const logger = require(path.resolve(__dirname, '../../../../server/logger'));

module.exports = async function (data) {
    switch (data.type) {
        case 'startmisc':
            this.cmd.send('shop');
            break;
        case 'upgradeItems':
            // 定义需要购买的石头数量的对象
            this.addstone = {
                bag: (100 - this.userBag.count) / 10,
                sc1: (100 - this.userSc1.count) / 10,
                sc2: (100 - this.userSc2.count) / 10,
                sc3: (100 - this.userSc3.count) / 10,
                store: (200 - this.userStore.count) /10
            }
            // 所需之和
            const total = this.addstone.bag + this.addstone.sc1 + this.addstone.sc2 + this.addstone.sc3 + this.addstone.store
            // 为0则代表不需要购买,可以直接跳过当前流程进行整理
            if (total === 0){
                // 为0代表可以进行整理
                this.cmd.send('tm 开始整理')
            } 
            // 否则
            else {
                // 背包判定条件(含元宝判定)
                if(this.addstone.bag > 0 && this.addstone.bag * 80 <= this.Yuanbao){
                    this.Yuanbao -= this.addstone.bag * 80;// 定义元宝的变化
                    this.useStoneTaget = this.userId;// 定义一个标签，用于判定石头购买谁来使用石头
                    this.userBag.count = 100;// 定义背包的变化
                    this.cmd.send(`shop 2 ${this.addstone.bag}`);
                    return;
                } 
                // 随从1判定条件(含元宝判定),需要判定背包是否已满
                if (this.addstone.sc1 > 0 && this.addstone.sc1 * 80 <= this.Yuanbao && this.userSc1.data.length < this.userSc1.count){                  
                    this.Yuanbao -= this.addstone.sc1 * 80;// 定义元宝的变化
                    this.useStoneTaget = this.userSc1.id; // 定义一个标签，用于判定石头购买谁来使用石头
                    this.userSc1.count = 100;// 定义背包的变化
                    this.cmd.send(`shop 2 ${this.addstone.sc1}`);
                    return;
                } 
                // 随从2判定条件(含元宝判定),需要判定背包是否已满
                if (this.addstone.sc2 > 0 && this.addstone.sc2 * 80 <= this.Yuanbao && this.userSc2.data.length < this.userSc2.count){
                    this.Yuanbao -= this.addstone.sc2 * 80;// 定义元宝的变化
                    this.useStoneTaget = this.userSc2.id;// 定义一个标签，用于判定石头购买谁来使用石头
                    this.userSc2.count = 100;// 定义背包的变化
                    this.cmd.send(`shop 2 ${this.addstone.sc2}`)
                    return;
                }
                // 随从3判定条件(含元宝判定),需要判定背包是否已满
                if (this.addstone.sc3 > 0 && this.addstone.sc3 * 80 <= this.Yuanbao && this.userSc3.data.length < this.userSc3.count){
                    this.Yuanbao -= this.addstone.sc3 * 80;// 定义元宝的变化
                    this.useStoneTaget = this.userSc3.id;// 定义一个标签，用于判定石头购买谁来使用石头
                    this.userSc3.count = 100;// 定义背包的变化
                    this.cmd.send(`shop 2 ${this.addstone.sc3}`)
                    return;
                } 
                // 仓库判定条件(含元宝判定)
                // 新增一个仓库判定(为新号服务的代码)
                if(this.addstone.store > 0 ){
                    if(this.addstone.store * 80 <= this.Yuanbao){
                        this.Yuanbao -= this.addstone.store * 80;// 定义元宝的变化
                        this.userStore.count = 200;// 定义仓库的变化
                        this.cmd.send(`shop 3 ${this.addstone.store}`);
                        return;
                    } 
                    if (Math.floor(this.addstone.store / 2) * 80 <= this.Yuanbao) {  //二分升级
                        const baixing = Math.floor(this.addstone.store / 2)
                        this.Yuanbao -= baixing * 80;// 定义元宝的变化
                        this.userStore.count = this.userStore.count + baixing * 10;// 定义仓库的变化
                        this.cmd.send(`shop 3 ${baixing}`);
                        return;
                    }
                } 
                //以上if条件都不满足则跳转跳出
                logger.info(`${this.userConfig.name},元宝不足或随从背包不足`);
                this.cmd.send('tm 开始整理')
            }
            break;
        case 'dialog':
            // 购买升级石头后背包得到一个返回
            if (data.dialog === "pack" && data.name) {
                // 定义一个函数，用于判定如何使用使用石头
                const usestone = (itemId,itemNum,useTaget) => {
                    if(useTaget === this.userId){
                        this.cmd.send(`use ${itemId};`.repeat(itemNum))
                    } else {
                        this.cmd.send(`give ${useTaget} ${itemNum} ${itemId};`)
                        this.cmd.send(`dc ${useTaget} use ${itemId};`.repeat(itemNum))
                    }
                }
                // 如果购买的是背包扩充石，则条用上方的函数，来使用石头
                if(data.name.includes('背包扩充')) {
                    usestone(data.id, data.count, this.useStoneTaget);
                    this.cmd.send('tm 开始判定存储升级')
                }
                // 如果购买的是仓库扩充石，则直接使用，并结束当前流程
                if(data.name.includes('仓库扩充')) {
                    this.cmd.send(`${`use ${data.id};`.repeat(data.count)}`)
                    this.cmd.send('tm 开始整理')
                }
                return;
            }
            // 元宝
            if (data.dialog === "shop" && data.selllist) {
                // 保留20给扫荡
                this.Yuanbao = data.cash_money - 20;
                // 跳转到整理界面
                this.cmd.send('tm 开始判定存储升级')
                return;
            }
            break;
        case 'msg':
            if(data.ch === 'tm'){
                if(data.content === '开始判定存储升级'){
                    this.emit('Data',{type:'upgradeItems'});
                }
                if(data.content === '开始整理'){
                    this.emit('Data',{ type:'nextmisc' });
                }
            }
            break;
        default:
            break;
    }
}