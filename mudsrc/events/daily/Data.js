const fs = require('fs');
const path = require('path');
const logger = require(path.resolve(__dirname, '../../../server/logger'));
const start = require('../start/start.js');
const pushMsg = require(path.resolve(__dirname, '../../../server/pushplus'));

module.exports = async function (data) {
    switch (data.type) {
        case 'login':
            start(this.userConfig,this.cmd);
            this.cmd.send('score');
            await sleep(3)
            this.cmd.send('tasks')
            break;
        case 'loginerror':
            logger.error(`「${this.userConfig.name}」登录失败`);
            this.socketClose();
            break;
        case 'dialog':
            if (data.dialog === 'tasks' && !data.id) {
                const result = getTaskList(data, this.allTaskList, this.userConfig.redboss);
                this.taskList = result.taskList;
                this.userJl = result.userJl;
                if (this.taskList.length > 0) {
                    this.off('Data', require(`./${this.taskList[0]}.js`));
                    this.on('Data', require(`./${this.taskList[0]}.js`));
                    this.emit('Data', { type: 'start' });
                } else {
                    this.off('Data', require(`./end.js`));
                    this.on('Data', require(`./end.js`));
                    this.emit('Data', { type: 'end' });
                }
            } else if (data.dialog === 'score' && data.level) {
                this.userLevel = data.level;
                this.userId = data.id;
            }
            if (data.dialog === 'pack' && data.id && data.uneq === 0 && this.isCombat) {
                this.cmd.send(`eq ${data.id}`);
            }
            break;
        case 'next':
            if (this.taskList.length > 0) {
                this.off('Data', require(`./${this.taskList[0]}.js`));
                this.taskList.shift();
            }
            if (this.taskList.length > 0) {
                this.on('Data', require(`./${this.taskList[0]}.js`));
                this.emit('Data', { type: 'start' });
            } else if (this.taskList.length === 0) {
                this.off('Data', require(`./end.js`));
                this.on('Data', require(`./end.js`));
                this.emit('Data', { type: 'end' });
            }
            break;
        case 'tip':
            if (data.data.includes('说：')) {
                return;
            }
            break;
        case 'room':
            // 清除定时器
            clearTimeout(this.roomTimer);
            this.room = data.name;
            this.roomPath = data.path;
            this.roomTimer = setTimeout(() => {
                const msg = `「${this.userConfig.name}」在 ${this.room} 停留超过30分钟，请及时处理！`
                pushMsg(msg)
            }, 30 * 60 * 1000);
            break;
        default:
            break;
    }
};

function getTaskList(data, allTaskList, bossState) {
    const taskOfBanList = []
    const taskMsg = data.items.find(item => item.id === 'signin')
    const taskOfSm = data.items.find(item => item.id === 'sm')
    const taskOfYm = data.items.find(item => item.id === 'yamen')
    const fb = taskMsg.desc.match(/精力消耗：<...>(\d+)\/200<....>/);
    const tower = taskMsg.desc.match(/<...>武道塔(.+)，进度(\d+)\/(\d+)<....>/);
    const boss = taskMsg.desc.match(/挑战(\d+)次武神BOSS/);
    if (parseInt(fb[1], 10) === 200) {
        taskOfBanList.push('4fb')
    }
    const userJl = 200 - parseInt(fb[1], 10)
    if (tower && tower[1] === '已重置' && tower[2] === tower[3]) {
        // tower[3] !== '0'为未爬过塔的角色
        taskOfBanList.push('3tower')
    } else if (!tower) {
        taskOfBanList.push('3tower')
    }
    if (!boss || bossState === null) {
        taskOfBanList.push('5boss')
    }
    if (taskOfSm.state === 3) {
        taskOfBanList.push('1sm')
    }
    if (taskOfYm.state === 3) {
        taskOfBanList.push('2ym')
    }
    const taskList = allTaskList.filter(item => !taskOfBanList.includes(item))
    return { taskList, userJl }
}

async function sleep(seconds) {
    return new Promise(resolve => {
        setTimeout(resolve, seconds * 1000);
    });
}
