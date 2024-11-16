const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const logger = require(path.resolve(__dirname, '../../../server/logger'));

module.exports = function (data) {
    switch (data.type) {
        case 'start':
            this.cmd.send("jh fam 0 start;go west;go west;go north");
            this.off('Data', require(`./miscfile/${this.misclist[0]}.js`));
            this.on('Data', require(`./miscfile/${this.misclist[0]}.js`));
            this.emit('Data',{type:'startmisc'});
            break;
        case 'nextmisc':
            if (this.misclist.length > 0) {
                this.off('Data' , require(`./miscfile/${this.misclist[0]}.js`));
                this.misclist.shift();
            }
            if (this.misclist.length > 0){
                this.on('Data', require(`./miscfile/${this.misclist[0]}.js`));
                // const path = (`./misc/${this.misclist[0]}.js`)
                // const data = require(path)
                // const datatype = typeof data
                // console.log ('导入的数据类型为',datatype)
                // const data2 = data.toString()
                // console.log (this.userConfig.name,'导入的数据内容为：',data2)
                this.emit('Data',{type:'startmisc'});
            } else if (this.misclist.length === 0){
                this.emit('Data',{type:'next'});
            }
            break;
        default:
            break;
    }
}