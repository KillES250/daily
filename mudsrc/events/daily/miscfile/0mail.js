const path = require('path');
const logger = require(path.resolve(__dirname, '../../../../server/logger'));

module.exports = async function (data) {
    switch (data.type) {
        case 'startmisc':
            this.cmd.send('message system')
            break;
        case 'dialog':
            if (data.dialog === 'message' && data.items) {
                console.log(data.items)
                for(const item of data.items){
                    if(!item.rec){
                        this.cmd.send(`receive system ${item.index}`)
                    }
                }
                this.cmd.send('tm 结束流程')
            } else if (data.dialog === 'message' && !data.items){
                this.cmd.send('tm 结束流程')
            }
            break;
        case 'msg':
            if(data.ch === 'tm' && data.content === '结束流程'){
                this.emit('Data',{ type:'nextmisc' });
            }
            break;
        default:
            break;
    }
}