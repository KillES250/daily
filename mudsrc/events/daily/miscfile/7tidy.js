
/* 构造器部分数据结构
        this.userBag = { id:null,data:[], count: 0, };
        this.userStore = { data:[], count: 0 };
        this.userSc1 = { id:null, data:[], count: 0 };
        this.userSc2 = { id:null, data:[], count: 0 };
        this.userSc3 = { id:null, data:[], count: 0 };

        data示例：data:[{name:a,id:b,count:c}]
        
        this.bag = new Map();
        this.store = new Map();
        this.sc1 = new Map();
        this.sc2 = new Map();
        this.sc3 = new Map();
*/
const path = require('path');
const logger = require(path.resolve(__dirname, '../../../../server/logger'));
module.exports = async function (data) {
    // 定义用于执行的指令数组(整理对象入参)
    const cmd = (tidyBody) => {
        //------结束判定部分------
        const deepJudge = this.userBag.count + this.userStore.count + this.userSc1.count + this.userSc2.count + this.userSc3.count;
        
        if (deepJudge === 600){ // 深度整理判定
            // 判定tidyBody中findNumOfTimes之和是否等于0，等于的话则返回一个['end']的数组
            const totalFindNumOfTimes = tidyBody.reduce((sum, item) => sum + item.findNumOfTimes, 0);
            console.log('tidyBody中findNumOfTimes之和',totalFindNumOfTimes);
            if (totalFindNumOfTimes === 0) {
                this.cmd.send('tm 指令已返回');
                return ['end'];
            }
        } else { //浅整理判定,只遍历背包
            if(tidyBody[0].findNumOfTimes === 0) { //如果该对象findNumOfTimes等于0，等于则返回一个['end']的数组
                this.cmd.send('tm 指令已返回');
                return['end'];
             }
        }
        //------结束判定部分------

        // 变量初始化
        this.cmdoftidy = [];                   //  执行指令数组初始化
        this.targetObjoftidy = {};             //  定义一个空对象

        if ( deepJudge === 600 ) {  // 深度整理判定
            // for (const item of tidyBody) {  //开始遍历<整理对象>
            //     console.log('当前循环','拥有物品数：',item.name.data.length,'当前优先级:',item.seachPriority,'<<--and-->>,',this.minPriority);
            //     if (item.findNumOfTimes > 0 && item.seachPriority <= this.minPriority) { //找出还未查找完毕，且空间最小的对象
            //         this.minPriority = item.seachPriority;   //将当前对象设置为最小对象
            //         this.targetObjoftidy = item;                   //获得当前需要比对的对象(此时还是tidyBody的元素)
            //     }
            // }
            // 使用 reduce 方法找到 seachPriority 最小的对象
            const targetObj = this.tidyBody.reduce((minItem, currentItem) => {
                if (currentItem.findNumOfTimes > 0 && (minItem === null || currentItem.seachPriority < minItem.seachPriority)) {
                    return currentItem;
                }
                return minItem;
            }, null);
            // 直接更新属性
            this.targetObjoftidy = targetObj;
            console.log('当前最小优先级对象',this.targetObjoftidy);
            const targetItem = this.targetObjoftidy.name.data[this.targetObjoftidy.indexNum]; //从tidyBody.name拿到对象，.data拿到该对象物品数据，.indexNum为该物品数据的key值
            console.log('当前最小优先级对象待比对物品',targetItem);
            this.targetObjoftidy.findNumOfTimes -= 1;      //对应的tidyBody对元素对象中的findNumOfTimes-1
            console.log('当前最小优先级对象剩余查找次数',this.targetObjoftidy.findNumOfTimes);
            const targetItemName = targetItem.name.match(/[\u4e00-\u9fa5]+/g)[0];   //key值的name正则获取中文名称，因为yaml中物品数据没有录入标签
            // const targetItemName = targetItem.name.match(/<([a-z]+)>(.*?)<\/\1>/)?.[2] || '';
            console.log('当前最小优先级对象待比对物品的中文名',targetItemName);
            const dictionaries = [this.bag, this.store, this.sc1, this.sc2, this.sc3];  //需要参与比对的词典
            for (const dict of dictionaries){   //遍历数组
                if(dict.has(targetItemName)){   //如果Map中含有该物品的中文名
                    /*调用创建cmd指令的函数，传入：
                        1、当前比对的对象(参与对比的物品所在对象)、
                        2、物品归属位置、
                        3、该物品的数据(指向注释中的data示例) 
                    */
                    const cmd = creatcmd(this.targetObjoftidy, dict, targetItem);
                    this.cmd.send('tm 指令已返回');
                    return cmd; //返回该指令数组
                }
            }
            if (this.cmdoftidy.length === 0){ //遭遇未录入的物品
                logger.warning(`整理物品时遇到未录入物品：${targetItemName}`);//浅整理会反复触发，测试完成记得删除这句代码
                this.targetObjoftidy.indexNum += 1;    // indexNum+1,下次查找时略过改物品
                this.cmd.send('tm 指令已返回');
                return [null,null];         // 返回一个包含两个为空元素的数组
            };
        } else { //浅整理判定
            const bagItem = tidyBody[0].name.data[tidyBody[0].indexNum] //拿到数据
            tidyBody[0].findNumOfTimes -= 1;  // 对应的tidyBody[0](this.userBag)的查找次数findNumOfTimes-1
            const store = tidyBody[1].name.data.find(storeItem  => storeItem.name === bagItem.name) //比对名字
            console.log('当前查找位置：',tidyBody[0].indexNum,'   当前待比对物品：',bagItem.name)
            if (store) {  //如果存在，则将物品存入仓库
                this.cmdoftidy = [`store ${bagItem.count} ${bagItem.id}`, null]
                tidyBody[0].indexNum += 1; //查找位置加1 返回空指令执行以跳过改条
                this.cmd.send('tm 指令已返回');
                return this.cmdoftidy;
            } else {
                tidyBody[0].indexNum += 1; //查找位置加1 返回空指令执行以跳过改条
                this.cmd.send('tm 指令已返回');
                return [null,null];
            }
        }
    }

    //创建用于执行的执行数组的函数
    const creatcmd = (targetObj, dict, targetItem) => {
        console.log('开始执行创建指令函数');
        this.fromIdoftidy = null;  //初始化来源id
        this.toIdoftidy = null;    //初始化目标id
        this.creatcmdoftidy = [];       //初始化cmd命令数组
        if ( targetObj.name === this.userBag) { this.fromIdoftidy = this.userId; }              // 如果数据来源是背包，那么id来源则是玩家
        else if ( targetObj.name === this.userSc1 ) { this.fromIdoftidy = this.userSc1.id; }    // 如果数据来源是随从1，那么id来源则是随从1
        else if ( targetObj.name === this.userSc2 ) { this.fromIdoftidy = this.userSc2.id; }    // 如果数据来源是随从2，那么id来源则是随从2
        else if ( targetObj.name === this.userSc3 ) { this.fromIdoftidy = this.userSc3.id; };   // 如果数据来源是随从3，那么id来源则是随从3
        console.log('来源id',this.fromIdoftidy);
        if ( dict === this.bag ) { this.toIdoftidy = this.userId; }                // 如果物品归属是背包，那么id归属则是玩家
        else if ( dict === this.sc1 ) { this.toIdoftidy = this.userSc1.id; }       // 如果物品归属是随从1，那么id归属则是随从1
        else if ( dict === this.sc2 ) { this.toIdoftidy = this.userSc2.id; }       // 如果物品归属是随从2，那么id归属则是随从2
        else if ( dict === this.sc3 ) { this.toIdoftidy = this.userSc3.id; };      // 如果物品归属是随从3，那么id归属则是随从3
        console.log('目标id',this.toIdoftidy);

        if (this.fromIdoftidy === this.toIdoftidy){           // 如果来源与归属一致则不执行任何动作(表示该物品无需移动)
            targetObj.indexNum += 1;    // indexNum+1,下次查找时略过改物品
            return [null,null];         // 提前返回一个包含两个为空元素的数组
        }
        if (!this.fromIdoftidy){                           //如果来源id为空，则代表是要对仓库获取物品，添加一个仓库取东西的动作
            this.creatcmdoftidy.push(`qu ${targetItem.count} ${targetItem.id}`)
        } else if (this.fromIdoftidy === this.userId){     //如果来源id为玩家，则代表物品已经准备好移动了，添加一个为空的指令
            this.creatcmdoftidy.push(null)
        } else {                                //否则的话来源就是随从，添加一个从随从身上取东西的的动作
            this.creatcmdoftidy.push(`dc ${this.fromIdoftidy} give ${this.userId} ${targetItem.count} ${targetItem.id}`)
        }
        // 在对应的原始对象中删除该条数据，让原对象中的data下一条的indexNum-1自动对齐到当前的indexNum上来
        const indexToDelete = targetObj.name.data.findIndex(item => item.id === targetItem.id)
        targetObj.name.data.splice(indexToDelete, 1);

        if (!this.toIdoftidy){         //如果归属id为空，则代表是要对仓库获存物品，添加一个仓库存东西的动作
            this.creatcmdoftidy.push(`store ${targetItem.count} ${targetItem.id}`)
        } else if (this.toIdoftidy === this.userId){
            this.creatcmdoftidy.push(null)  //如果归属id为玩家，则代表物品已经准备好移动了，添加一个为空的指令
        } else {            //否则的话归属id就是随从，添加一个给随从东西的的动作
            this.creatcmdoftidy.push(`give ${this.toIdoftidy} ${targetItem.count} ${targetItem.id}`)
        }
        
        console.log('即将返回指令数组',this.creatcmdoftidy);
        return this.creatcmdoftidy;     //返回指令数组
    }
    switch (data.type) {
        case 'startmisc':
            // console.log('开始整理1!-----');
            const that = this;
            this.tidyBody = [
                {
                    get name() { return that.userBag; },//通过getter返回的最新的对象
                    indexNum: 0, //该对象.data数组需要获取数据的key值
                    findNumOfTimes: that.userBag.data.length, //需要查找的次数
                    get seachPriority() { return that.userBag.count - that.userBag.data.length; }//getter返回的数值，遍历的优先级，最终数字越小，越先遍历
                },
                {
                    get name() { return that.userStore; },
                    indexNum: 0,
                    findNumOfTimes: that.userStore.data.length,
                    get seachPriority() { return that.userStore.count - that.userStore.data.length; }
                },
                {
                    get name() { return that.userSc1; },
                    indexNum: 0,
                    findNumOfTimes: that.userSc1.data.length,
                    get seachPriority() { return that.userSc1.count - that.userSc1.data.length; }
                },
                {
                    get name() { return that.userSc2; },
                    indexNum: 0,
                    findNumOfTimes: that.userSc2.data.length,
                    get seachPriority() { return that.userSc2.count - that.userSc2.data.length; }
                },
                {
                    get name() { return that.userSc3; },
                    indexNum: 0,
                    findNumOfTimes: that.userSc3.data.length,
                    get seachPriority() { return that.userSc3.count - that.userSc3.data.length; }
                }
            ];
            //用于跳过，所有背包空间之和小于等于0的话，无法进行整理，跳过流程
            const totalSearchPriority = this.tidyBody.reduce((sum, item) => sum + (item?.seachPriority || 0), 0);
            if (totalSearchPriority <= 0) {
                this.cmd.send('tm 结束归类');
                return;
            }

            this.cmd.send('tm 开始整理');
            break;
        case 'msg':
            if(data.ch === 'tm'){
                if(data.content === '开始整理'){
                    // console.log('开始整理2!-----');
                    this.newCmd = cmd(this.tidyBody);
                    return;
                }
                if(data.content === '指令已返回'){
                    if ( this.newCmd[0] === 'end' ) {this.cmd.send('tm 结束归类');break;} //1返回的为end则代表结束
                    if ( this.newCmd[0] !== null ) {this.cmd.send(this.newCmd[0]);this.newCmd[0] = null;break;}  //1不为空，则发送1,并且将1转为空
                    if ( this.newCmd[0] === null && this.newCmd[1] === null ) {this.cmd.send('tm 开始整理');break;} //1、2都为空 继续分析流程
                    if ( this.newCmd[0] === null && this.newCmd[1] !== null ) {this.cmd.send(this.newCmd[1]);this.newCmd[1] = null;break;} //1为空，2不为空，则发送2，并且将2转为空
                }
                if(data.content === '结束归类'){
                    this.emit('Data',{ type:'nextmisc' });
                }
            }
        case 'tip':
            if(/给了你|你给了|你从仓库里取出|存入仓库/.test(data.data)){    //这里的tip返回，至少是执行了1个指令的情况[0]或者[1]
                if(this.newCmd[1] !== null) {this.cmd.send(this.newCmd[1]);this.newCmd[1] = null;break;} //2不为空，则发送2，并且将2转为空 (将会继续跳转到tip判定)
                if(this.newCmd[0] === null && this.newCmd[1] === null) {this.cmd.send('tm 开始整理');break;}    //1、2为空，则继续分析流程
            }
            break;
        case 'dialog':
            if ((data.dialog === 'list' && data.store === -1) || (data.dialog === 'pack' && data.name)) {
                // 判定为从仓库取出来,或者从随从背包拿到东西的返回数据
                // 如果2不为空，则将2中的id替换为当前物品的id
                // 这是为了处理当来源物品与背包物品名字一致,id不一致时,来源物品的id会改变为背包id存在背包中。导致newCmd[1]中的id不正确
                if (this.newCmd[1] !== null) {
                    this.newCmd[1] = this.newCmd[1].replace(/(\s+\S+)$/, ` ${data.id}`);
                    // console.log('指令以被更改为',this.newCmd[1]);
                }
                return;
            }
            break;
        default:
            break;
    }
}