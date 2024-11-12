const fs = require('fs');
const yaml = require('js-yaml');
const schedule = require('node-schedule');
const path = require('path');
const userconfig = path.resolve(__dirname, '../../userconfig/userconfig.yaml');

const daily = require('./daily.js');
const week = require('./week.js');
const war = require('./war.js');

const allJobs = [];

async function runall() {
    try {
        const data = await fs.promises.readFile(userconfig, 'utf8');
        const configs = yaml.load(data);

        if (!configs.dailytime && !configs.wartime && !configs.weektime) {
            console.log('未设置任务时间');
            return;
        }
        if (configs.dailytime){
            const dailytime = configs.dailytime;
            createScheduledTasks(dailytime, 'dailyTask', daily.rundaily);
        }
        if (configs.wartime){
            const wartime = configs.wartime.replace(/[\u4e00-\u9fa5]/g, '');
            createScheduledTasks(wartime, 'warTask', war.runwar);
        }
        if (configs.weektime){
            const weektime = configs.weektime;
            createScheduledTasks(weektime, 'weekTask', week.runweek);
        }
        // 如果擂台选项为true
        // 这个位置插入一个iron的规定表达式的定时函数
        console.log('当前已经创建的任务:');
        allJobs.forEach((job, index) => {
            console.log(`任务${index + 1}: ${job.nextInvocation()}`);
        });
    } catch (error) {
        console.error('Error reading or processing config file:', error);
    }
}

function createScheduledTasks(timeString, taskName, taskFunction) {
    const times = timeString.split('|');
    for(const key in times){
        const time = parseTimeToCron(times[key]);
        const job = schedule.scheduleJob(time,() => {
            taskFunction();
        });
        allJobs.push(job);
    };
}


function parseTimeToCron(time) {
    const parts = time.split(':');
    if (parts.length === 2) {
        const [hour, minute] = parts;
        return `${minute} ${hour} * * *`;
    } else if (parts.length === 3) {
        const [dayOfWeek, hour, minute] = parts;
        return `${minute} ${hour} * * ${dayOfWeek}`;
    } else {
        throw new Error(`Invalid time format: ${time}`);
    }
}

if (require.main === module) {
    runall();
}

module.exports = { 
    runall 
};