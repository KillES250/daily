const scName = [
    '小流氓','韦春芳','双儿','鳌拜','程灵素','温仪','夏雪宜','曲霏烟','黄蓉','阿朱',
    '阿碧','王语嫣','张无忌','周芷若','小昭','小龙女','小师妹','青青','地尼','秦梦瑶',
];

module.exports = async function (data) {
    switch (data.type) {
        // 起始位置，将通过items返回开始寻路豪宅地图
        case 'start':
            this.npclist = [];
            this.cmd.send('go enter');
            break;
        // 人物数据返回
        case 'items':
            for (const item of data.items) {
                // 如果返回的数据存在(莫非最后是0，nmd),且不是玩家，且名字存在于scName随从名字列表中则将其添加至随从列表中
                if (item && !item.p && scName.some(name => item.name.includes(name))){
                    this.npclist.push(item.id);
                    this.cmd.send(`dc ${item.id} stopstate;team with ${item.id}`)
                } else if(item && !item.p && item.name.includes('朱熹')) {
                    this.shuyuanId = item.id;
                }
            }
            if (this.roomPath === "home/yuanzi") {
                this.cmd.send(`go ${this.haozhaiarrive[0]}`);
                return;
            }
            if (this.roomPath === "home/liangong") {
                this.haozhaiarrive.shift();
                this.cmd.send(`go east`);
                return;
            }
            if (this.roomPath === "home/lianyao") {
                this.haozhaiarrive.shift();
                this.cmd.send(`go west`);
                return;
            }
            if (this.roomPath === "home/huayuan") {
                this.haozhaiarrive.shift();
                this.cmd.send(`go southwest`);
                return;
            }
            if (this.roomPath === "home/woshi" || this.roomPath === "home/danjian" || this.roomPath === "yz/qianzhuang") {
                if (this.roomPath === "yz/qianzhuang"){
                    this.homeWay = "jh fam 0 start;go north;go west";
                } else {
                    this.homeWay = "jh fam 0 start;go west;go west;go north;go enter;go north";
                }
                this.cmd.send(`score`)
            }
            break;
        case 'dialog':
            if (data.dialog === 'score'){
                this.userId = data.id;
                this.userLevel = data.level;
                this.cmd.send(`store`)
                return;
            }
            if(data.dialog === "list" && !data.bookshelf && !data.id){
                data.stores.forEach(item => {
                    const reslut = qu(item);
                    if(reslut){
                        this.qucmd.push(reslut)
                    }
                });
                this.cmd.send('pack');
                return;
            }
            // 背包
            if(data.dialog === "pack" && !data.name && !data.id){
                this.userBag.count = data.max_item_count - data.items.length;
                // 请求完背包数据后，如果随从列表不为空，则开始请求随从背包数据，否则直接开始整理
                if(this.npclist.length > 0){
                    this.tmpnpclist = [...this.npclist];
                    this.cmd.send(`pack ${this.tmpnpclist[0]}`)
                } else {
                    this.cmd.send('jh fam 0 start;go east;go north;tm 开始售卖');
                }
                return;
            }
            if (data.dialog === "pack2") {
                // 每次获得一个数据返回后，移除第一个请求的npcId，以方便用于下次请求。
                this.tmpnpclist.shift();

                // 分发数据函数
                const assignUserData = (userSc, data) => {
                    userSc.id = data.id;
                    data.items.forEach(item => {
                        const reslut = qu(item,data.id,this.userId);
                        if(reslut){
                            this.qucmd.push(reslut)
                        }
                    });
                    if(this.tmpnpclist.length > 0){
                        this.cmd.send(`pack ${this.tmpnpclist[0]}`);
                    } 
                    // 如果临时的随从列表为空,将不再请求数据，则开始售卖
                    else {
                        this.cmd.send('jh fam 0 start;go east;go north;tm 开始售卖');
                    }
                };
                // 如果随从1为空，且不会继续请求随从背包的时候，强制返回的数据请求分发给随从1
                if(!this.userSc1.id && this.tmpnpclist.length === 0){
                    this.userSc1.id = data.id;
                    data.items.forEach(item => {
                        const reslut = qu(item,data.id);
                        if(reslut){
                            this.qucmd.push(reslut)
                        }
                    });
                    this.cmd.send('jh fam 0 start;go east;go north;tm 开始售卖')
                    return;
                }
                // 如果随从1为空，且当前数据返回的随从有鱼竿，则将数据插入随从1
                if (!this.userSc1.id && data.eqs[0] && data.eqs[0].name.includes('钓鱼竿')) {
                    assignUserData(this.userSc1, data);
                    return;
                } 
                // 如果随从2为空
                if (!this.userSc2.id) {
                    // 如果当前数据返回的随从有鱼竿，则将鱼竿移除这是为了方便后期整理添加的操作(这段代码只有在随从1不为空时才会执行)
                    if (data.eqs[0] && data.eqs[0].name.includes('钓鱼竿')) {
                        this.cmd.send(`dc ${data.id} uneq ${data.eqs[0].id}`);
                    }
                    assignUserData(this.userSc2, data);
                    return;
                } 
                // 如果随从3为空
                if (!this.userSc3.id) {
                    // 如果当前数据返回的随从有鱼竿，则将鱼竿移除这是为了方便后期整理添加的操作(这段代码只有在随从1不为空时才会执行)
                    if (data.eqs[0] && data.eqs[0].name.includes('钓鱼竿')) {
                        this.cmd.send(`dc ${data.id} uneq ${data.eqs[0].id}`);
                    }
                    assignUserData(this.userSc3, data);
                    return;
                }
            }
            break;
        case 'msg':
            if(data.ch === 'tm' && data.content === '开始售卖'){
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

function qu(data,fromId,ToID) {
    if(data.name.includes('残页') && !jinjie.some(item => data.name.includes(item))) {
        const keepNum = reNum(data);
        if (data.count > keepNum) {
            const quNum = data.count - keepNum;
            if (typeof fromId !== 'undefined') {
                return `dc ${fromId} give ${ToID} ${quNum} ${data.id}`;
            } else {
                return `qu ${quNum} ${data.id}`;
            }
        } else {
            return null;
        }
    } else {
        return null;
    }
}

function reNum (data){
    if(data.name.includes('ord')){ return 500; }
    if(data.name.includes('hio')){ return 200; }
    if(data.name.includes('HIZ')){ return 100; }  
    if(data.name.includes('hiy')){ return 50; }
    if(data.name.includes('hic')){ return 30; }
    if(data.name.includes('hig')){ return 10; }
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