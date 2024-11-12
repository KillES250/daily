// 这是war.js文件
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Socket = require(path.resolve(__dirname, '../../server/socket'));
const gameInfo = yaml.load(fs.readFileSync(path.resolve(__dirname, 'gameInfo.yaml')));

module.exports = class War extends Socket {
    constructor(config) {
        super(config);
        this.loadEvents();
        this.userId = null;
        this.userLevel = null;
        this.gameInfo = gameInfo;
        this.cd = new Set();
        this.gcd = false;
        this.isCombat = false;
        this.userSkills = [];
        this.userStatus = new Set();
        this.timers = {
            up: null,
            pfm: null,
            fix: null,
        };

        this.room = null;
        this.skillsBanList = [];
        this.warNpcId = [
            { id: null, maxHp:90000000, hpPer:1},
            { id: null, maxHp:50000000, hpPer:1},
            { id: null, maxHp:20000000, hpPer:1},
            { id: null, maxHp:20000000, hpPer:1},
        ];
        this.gangAddress = null;
        this.enableSkills = [];
        this.war = 'none';
        this.timerOfHaoLing = null;
        this.startKill = false;
        this.skillsForGangleader = ['force.xin','dodge.lingbo']
        if(this.userConfig.war.leader === true){
            this.hpPerjk();
        }
    }
    loadEvents() {
        const [onClose] = this.listeners('CLOSE');
        this.removeAllListeners();
        onClose && this.on('CLOSE', onClose);
        this.on('Data',require(`../events/war/Data.js`));
    }
    // 转火监控
    hpPerjk() {
        this.intervalId = setInterval(() => {
            for (const npc of this.warNpcId) {
                if (npc.id !== null && npc.hpPer < 0.5) {
                    this.emit('Data', { type: 'shift', id: npc.id });
                    return;
                }
            }
        }, 3000);
    }
}