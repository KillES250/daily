module.exports = async function (data){
    switch (data.type){
        case 'start':
            this.cmd.send('tm 开始交钱运镖');
            this.cmd.send('jh fam 0 start;go west;go west;go south;go south');
            break;
        case 'items':
            if(this.room === '扬州城-镖局正厅'){
                for(const target of data.items){
                    if(target.id && !target.p && target.name.includes('林震南')){
                        this.biaojuId = target.id
                        this.cmd.send(`ksyb ${this.biaojuId}`)
                    }
                }
            }
            break;
        case 'tip':
            if(data.data.includes('说：')){
                return;
            }
            // 林震南说道：现在有20个委托，你需要支付2000黄金的雇佣费用。
            if(data.data.includes('你需要支付')){
                const packNumForYunbiao = data.data.match(/\d+/g)[0]
                this.packNumForYunbiao = packNumForYunbiao * 3
                this.cmd.send(`task yunbiao ${this.biaojuId} qkstart`)
                return;
            }
            if(/你先休息下吧|钱不够就自己运镖啊|只有总镖头才可以雇佣镖师。|你精力不足，好好休息下再来。/.test(data.data)){
                this.cmd.send('tm 结束运镖流程')
            }
            break;
        case 'dialog':
            if (data.dialog === 'pack'){
                this.packNumForYunbiao -= 1;
                if(this.packNumForYunbiao === 0){
                    this.cmd.send('tm 结束运镖流程')
                }
            }
            break;
        case 'msg':
            if(data.ch === 'tm' && data.content === '结束运镖流程'){
                this.emit('Data',{ type:'next' });
            }
            break;
        default:
            break;
    }
}