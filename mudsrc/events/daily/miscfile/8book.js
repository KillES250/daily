const path = require('path');
const logger = require(path.resolve(__dirname, '../../../../server/logger'));

module.exports = async function (data) {
    const cmd = (data) => {
        const item = data[this.booksindex]
        console.log (item)
        if(!item){
            this.cmd.send('tm 结束流程')
            return;
        }

        if((item.name.includes('秘籍') || item.name === '<hio>武道</hio>') && !item.name.includes('门派秘籍更换券')){
            this.cmd.send(`qu ${item.count} ${item.id}`)
            this.bookscmds = `sj store ${item.count} ${item.id}`
        } else {
            this.booksindex++;
            cmd(data);
        }
    }
    switch (data.type) {
        case 'startmisc':
            if ( this.userSj.id && this.userSj.count > 150){
                this.cmd.send('store')
            } else {
                this.cmd.send('tm 结束流程')
            }
            break;
        case 'dialog':
            // 仓库
            if(data.dialog === "list" && !data.bookshelf && !data.id){
                this.userStore.data = data.stores;
                this.userStore.count = data.max_store_count;
                cmd(this.userStore.data);
                return;
            }
            break;
        case 'tip':
            if(data.data.includes('你从仓库里取出')){
                this.booksindex++;
                this.cmd.send(this.bookscmds);
                return;
            }
            if(data.data.includes('放到书架上面')){
                cmd(this.userStore.data);
                return;
            }
            if(data.data.includes('只有秘籍，进阶秘籍，武道秘籍可以放在书架上面。')){
                this.booksindex++;
                cmd(this.userStore.data);
            }
            break;
        case 'msg':
            if(data.ch === 'tm')
                if(data.content === '结束流程'){
                this.emit('Data',{ type:'nextmisc' });
            }
            break;
        default:
            break;
    }
}