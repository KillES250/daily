const path = require('path');
const logger = require(path.resolve(__dirname, '../../../../server/logger'));

module.exports = async function (data) {
    // 定义 organizeItems 函数（方便内部调用）
    const organizeItems = async (arr) => {
        // 如果没有数据，终止流程
        if (arr.length === 0) {
            this.cmd.send('tm 结束分解物品流程');
            return;
        }
        // 封装arr[0],数组中的第一个对象
        const currentItem = arr[0];
        // 如果对象的data属性有数据，就继续执行
        if (currentItem.data.length > 0) {
            // 封装item，数组中的第一个对象
            const item = currentItem.data[0];
            // 正则名字
            const itemName = item.name.match(/[\u4e00-\u9fa5]+/g)?.[0] || '';
            // const itemName = item.name.match(/<([a-z]+)>(.*?)<\/\1>/)?.[2] || '';
            // 如果名字出现在丢弃列表中
            if (this.fenjie.has(itemName)) {
                // 如果当前对象有id，并且id不等于用户id(判定为随从)
                if (currentItem.id && currentItem.id !== this.userId) {
                    // 执行随从给与物品的指令 (dc + 随从id + give + 目标id + 物品数量 + 物品id )
                    this.cmd.send(`dc ${currentItem.id} give ${this.userId}  ${item.count} ${item.id}`);
                    //通过id找到原背包对象(实例中的this)中的数据,然后删除它
                    const userSc = Object.values(this).find(userSc => userSc && userSc.id !== undefined && userSc.id === currentItem.id);
                    const index = userSc.data.findIndex(itemData => itemData.id === item.id);
                    if (index !== -1) {
                        userSc.data.splice(index, 1);
                    }
                    currentItem.data.shift();
                    return;
                } 
                // 如果当前对象有id，并且id等于用户id(判定为背包)
                else if (currentItem.id && currentItem.id === this.userId) {
                    //通过id找到原背包对象(实例中的this)中的数据,然后删除它
                    const index = this.userBag.data.findIndex(itemData => itemData.id === item.id);
                    if (index !== -1) {
                        this.userBag.data.splice(index, 1);
                    }
                    this.cmd.send(`checkobj ${item.id} from item`)
                    currentItem.data.shift();
                    return;
                } // 如果当前对象没有id，(判定为仓库)
                else {
                    // 执行仓库取物品的指令 (qu + 物品数量+ 物品id)
                    this.cmd.send(`qu ${item.count} ${item.id}`);
                    // 通过id找到原仓库对象(实例中的this)中的数据,然后删除它
                    const index = this.userStore.data.findIndex(itemData => itemData.id === item.id);
                    if (index !== -1) {
                        this.userStore.data.splice(index, 1);
                    }
                    currentItem.data.shift();
                    return;
                }
            }
            // 如果名字未在丢弃列表中
            else {
                // 删除该对象的第一个数据(当前参与比对的数据)
                currentItem.data.shift();
                // 如果对象还有数据，就继续执行
                if (currentItem.data.length > 0) {
                    await organizeItems(arr);
                } else { //否则就删除当前参与比对的整个对象(参与数组中的第一个对象)，继续执行
                    arr.shift();
                    await organizeItems(arr);
                }
            }
        } else { //否则就删除当前参与比对的整个对象(参与数组中的第一个对象)，继续执行
            arr.shift();
            await organizeItems(arr);
        }
    };

    switch (data.type) {
        case 'startmisc':
            this.copyArr = [];
            this.currentcmd = [];
            const userBag = JSON.parse(JSON.stringify(this.userBag))
            const userStore = JSON.parse(JSON.stringify(this.userStore))
            const userSc1 = JSON.parse(JSON.stringify(this.userSc1))
            const userSc2 = JSON.parse(JSON.stringify(this.userSc2))
            const userSc3 = JSON.parse(JSON.stringify(this.userSc3))
            const userSj = JSON.parse(JSON.stringify(this.userSj))
            this.copyArr = [userBag, userStore, userSc1, userSc2, userSc3];
            await organizeItems(this.copyArr);
            break;
        case 'dialog':
            // {type:"dialog",dialog:"pack",name:"<HIZ>★★★★★★周芷若的手镯</HIZ>",id:"jlh66a76643",count:1,unit:"副",can_eq:1,value:50000,money:909820195}
            // 从随从拿到物品时的判定
            if(data.dialog === 'pack' && data.name && data.name !== "<hig>玄晶</hig>"){
                this.cmd.send(`checkobj ${data.id} from item`)
                return;
            }
            // {type:"dialog",dialog:"list",id:"zck9e57c5cc",storeid:"zck9e57c5cc",store:-1}
            // 从仓库拿到物品时的判定
            if (data.dialog === 'list' && data.id && data.store === -1){
                this.cmd.send(`checkobj ${data.id} from item`)
                return;
            }
            // {"type":"dialog","dialog":"pack","from":"item","id":"rbnhd133bb4","desc":"<ord>★★★★★★女娲石</ord>"}
            // 点击物品后的判定
            if (data.dialog === 'pack' && data.from === 'item'){
                const result = data.desc.match(/(<\w+>)([^<]+)([\u4e00-\u9fa5])(<\/\w+>)/)
                const cl = result[1]
                const lv = result[2].replace(/[\u4e00-\u9fa5]+/g, '').length
                if (cl !== '<hio>' && lv < 5){
                    this.cmd.send(`fenjie ${data.id} ok`)
                } else {
                    await organizeItems(this.copyArr);
                }
            }
            break;
        case 'tip':
            if ( data.data.includes('数息后只留下一堆玄色石头。') ){
                await organizeItems(this.copyArr);
                return;
            } 
            if ( data.data.includes('蕴含的力量太弱了，分解不出来什么东西。') ){
                await organizeItems(this.copyArr);
                return;
            }
            break;
        case 'msg':
            if(data.ch === 'tm'){
                if(data.content === '结束分解物品流程'){
                    this.emit('Data',{ type:'nextmisc' });
                }
            }
        default:
            break;
    }
};