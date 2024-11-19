const fs = require('fs');
const path = require('path');
const logger = require(path.resolve(__dirname, '../../../server/logger'));

module.exports = async function (data) {
    switch (data.type) {
        case 'login':
            logger.success(`「${this.userConfig.name}」登录成功`);
            this.cmd.send('setting auto_pfm 0;setting auto_pfm2 0;setting auto_work 0;setting auto_get 1;setting no_message 1');
            await sleep(1);
            this.cmd.send('cr over')
            this.cmd.send('score');
            await sleep(3)
            this.cmd.send('tasks');
            this.cmd.send('stopstate');
            this.cmd.send(this.userConfig.loginCommand);
            // 测试用代码
                const logFilePath = path.join(__dirname, 'bosslogs', `${this.userConfig.name}BOSS.log`);
                const dir = path.dirname(logFilePath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                fs.writeFileSync(logFilePath, '');
            // 测试用代码
            break;
        case 'loginerror':
            logger.error(`「${this.userConfig.name}」登录失败`);
            this.socketClose();
            break;
        case 'dialog':
            if(data.dialog === 'tasks'&& !data.id){
                const result = getTaskList(data,this.allTaskList,this.userConfig.redboss);
                this.taskList = result.taskList;
                this.userJl = result.userJl;
                if(this.taskList.length > 0){
                    this.off('Data', require(`./${this.taskList[0]}.js`));
                    this.on('Data', require(`./${this.taskList[0]}.js`));
                    this.emit('Data',{type:'start'});
                }else{
                    this.off('Data', require(`./end.js`));
                    this.on('Data', require(`./end.js`));
                    this.emit('Data',{type:'end'});
                }
            }else if (data.dialog === 'score' && data.level){
                this.userLevel = data.level;
                this.userId = data.id;
            }
            if (data.dialog === 'pack' && data.id && data.uneq === 0 && this.isCombat){
                this.cmd.send(`eq ${data.id}`);
            }
            break;
        case 'next':
            if (this.taskList.length > 0) {
                this.off('Data' , require(`./${this.taskList[0]}.js`));
                this.taskList.shift();
            }
            if(this.taskList.length > 0){
                this.on('Data', require(`./${this.taskList[0]}.js`));
                this.emit('Data',{type:'start'});
            }else if(this.taskList.length === 0){
                this.off('Data', require(`./end.js`));
                this.on('Data', require(`./end.js`));
                this.emit('Data',{type:'end'});
            }
            break;
        case 'tip':
            if (data.data.includes('说：')) {
                return;
            }
            console.log(data.data);
            break;
        case 'room':
            this.room = data.name;
            this.roomPath = data.path;
            console.log(data.name);
            break;
        default:
            break;
        }
};

function getTaskList(data,allTaskList,bossState){
    const taskOfBanList = []
    const taskMsg = data.items.find(item => item.id ==='signin')
    const taskOfSm = data.items.find(item => item.id ==='sm')
    const taskOfYm = data.items.find(item => item.id ==='yamen')
    const fb = taskMsg.desc.match(/精力消耗：<...>(\d+)\/200<....>/);
    const tower = taskMsg.desc.match(/<...>武道塔(.+)，进度(\d+)\/(\d+)<....>/);
    const boss = taskMsg.desc.match(/挑战(\d+)次武神BOSS/);
    if (parseInt(fb[1], 10) === 200) {
        taskOfBanList.push('4fb')
    } 
    const userJl =  200 - parseInt(fb[1], 10)
    if (tower && tower[1] === '已重置' && tower[2] === tower[3]) {
        // tower[3] !== '0'为未爬过塔的角色
        taskOfBanList.push('3tower')
    } else if(!tower) {
        taskOfBanList.push('3tower')
    }
    if (!boss || bossState === null) {
        taskOfBanList.push('5boss')
    }
    if(taskOfSm.state === 3){
        taskOfBanList.push('1sm')
    }
    if(taskOfYm.state === 3){
        taskOfBanList.push('2ym')
    }
    const taskList = allTaskList.filter(item => !taskOfBanList.includes(item))
    return { taskList , userJl}
}

async function sleep(seconds) {
    return new Promise(resolve => {
        setTimeout(resolve, seconds * 1000);
    });
}