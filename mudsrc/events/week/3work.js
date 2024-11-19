module.exports = async function (data) {
    switch (data.type) {
        case 'start':
            if ( this.roomPath === "home/woshi"){
                this.cmd.send('go south;go northeast')
            } else {
                this.cmd.send('tm 结束随从恢复工作流程')
            }
            break;
        case 'items':
            if (this.roomPath === "home/huayuan") {
                this.npclist.forEach(item => {
                    this.cmd.send(`dc ${item} diao;dc ${item} cai`)
                })
                this.cmd.send('team dismiss');
                this.cmd.send('tm 结束随从恢复工作流程')
            }
            break;
        case 'msg':
            if(data.ch === 'tm' && data.content === '结束随从恢复工作流程'){
                this.emit('Data',{type:'next' });
                return;
            }            
            break;
        default:
            break;
    }
}
