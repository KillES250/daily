module.exports = async function (data){
    switch (data.type){
        case 'start':
            if (this.qucmd.length > 0 ){
                this.cmd.send(this.homeWay);
            } else {
                this.cmd.send('pack');
            }
            break;
        case 'room':
            if (this.roomPath === "home/woshi" || this.roomPath === "home/danjian" || this.roomPath === "yz/qianzhuang"){
                if(this.qucmd.length > 0 && this.userBag.count > 0 ){
                    while (this.userBag.count > 0 && this.qucmd.length > 0) {
                        this.cmd.send(this.qucmd[0]);
                        this.qucmd.shift();
                        this.userBag.count -=1;
                        if(this.userBag.count <= 0 || this.qucmd.length === 0 ){
                            this.cmd.send('jh fam 0 start;go east;go north');
                            break;
                        }
                    }
                }else if (this.userBag.count <= 0 || this.qucmd.length === 0 ){
                    // 背包满了或者没有需要售卖的物品了，无法取出残页售卖，结束售卖流程
                    this.cmd.send('tm 结束售卖流程');
                } 
            } 
            if (this.roomPath === "yz/shuyuan"){
                this.cmd.send('pack');
            }
            break;
        case 'dialog':
            if(data.dialog === 'pack' && data.items){
                for(let i = 0;i < data.items.length ;i++){
                    const items = data.items[i]
                    if (items.name.includes('残页') && !jinjie.some(item => items.name.includes(item))){
                        // sell 1 f588e3354ea to 5e2ae3152ca
                        this.cmd.send(`sell ${items.count} ${items.id} to ${this.shuyuanId}`)
                        this.userBag.count +=1;
                    }
                }
                this.cmd.send(this.homeWay);
            }
            break;
        case 'msg':
            if(data.ch === 'tm' && data.content === '结束售卖流程'){
                this.emit('Data',{ type:'next' });
            }
            break;
        case 'tip':
            if (data.data.includes('说：')) {
                return;
            }
            if (data.data.includes('管家拦住你')) {
                this.dabieye = false;
                // 穷光蛋去钱庄…………
                this.cmd.send('jh fam 0 start;go north;go west');
                return;
            }
            break;
        default:
            break;
    }
}

const jinjie = [
    '武道残页',
    '太极拳进阶残页',
    '梯云纵进阶残页',
    '一苇渡江进阶残页',
    '一指禅进阶残页',
    '劈石破玉拳进阶残页',
    '紫霞神功进阶残页',
    '九阴白骨爪进阶残页',
    '诸天化身步进阶残页',
    '北冥神功进阶残页',
    '天山六阳掌进阶残页',
    '混元天罡进阶残页',
    '逍遥游进阶残页',
    '穿心掌进阶残页',
    '杀生决进阶残页',
    '先天太极进阶残页',
    '太极剑法进阶残页',
    '燃木刀法进阶残页',
    '金刚不坏体进阶残页',
    '独孤九剑进阶残页',
    '狂风快剑进阶残页',
    '临济十二庄进阶残页',
    '倚天剑法进阶残页',
    '凌波微步进阶残页',
    '小无相功进阶残页',
    '打狗棒进阶残页',
    '降龙十八掌进阶残页',
    '漫天花雨进阶残页',
    '踏雪寻梅进阶残页',
    '长生诀残页',
    '慈航剑典残页',
    '阴阳九转残页',
    '战神图录残页',
    '覆雨剑法残页',
    '天魔策残页',
    '修罗刀残页',
    '逆天道残页',
    '魔剑残页',
]