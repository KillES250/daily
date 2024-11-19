module.exports = async function (data){
    switch (data.type){
        case 'start':
            this.cmd.send('tm 开始襄阳交钱');
            this.cmd.send('jh fam 8 start');
            break;
        case 'items':
            if(this.room === '襄阳城-广场'){
                for(const target of data.items){
                    if(target.id && !target.p && target.name.includes('郭靖')){
                        this.cmd.send(`juanxian2 ${target.id}`)
                        this.guojingfound = true;
                    }
                }
                if (!this.guojingfound) {
                    this.cmd.send('tm 结束襄阳流程')
                }
            }
            break;
        case 'tip':
            if(data.data.includes('说：')){
                return;
            }
            if(/才可以再次进入襄阳城|你还是不要去添乱了。|已经有太多人参与守城了/.test(data.data)){
                this.cmd.send('tm 结束襄阳流程')
                return;
            }
            if(this.room === '襄阳城-广场'){
                if(/黄金获得了|你身上的黄金不够。|你的军功已经领取过了！/.test(data.data)){
                    this.cmd.send('tm 结束襄阳流程')
                    return;
                }
            }
            break;
        case 'msg':
            if(data.ch === 'tm' && data.content === '结束襄阳流程'){
                this.emit('Data',{ type:'next' });
            }
            break;
        default:
            break;
    }
}