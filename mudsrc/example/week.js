// 这是week.js文件
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Socket = require(path.resolve(__dirname, '../../server/socket'));
const gameInfo = yaml.load(fs.readFileSync(path.resolve(__dirname, 'gameInfo.yaml')));

module.exports = class Week extends Socket {
    constructor(config) {
        super(config);
        this.weekAutoPfmModel = true;
        this.loadEvents();
        this.userId = null;
        this.userLevel = null;
        this.gameInfo = gameInfo;
        this.cd = new Set();
        this.gcd = false;
        this.isCombat = false;
        this.userSkills = null;
        this.userStatus = new Set();
        this.timers = {
            up: null,
            pfm: null,
            fix: null,
        };
        this.taskEnd = false;
        this.skillsBanList = [];
        this.tasklist = [];
        
        this.room = null;
        this.roomPath = null;
        this.zahuoId = null;
        this.shuyuanId = null;
        this.haozhaiarrive = ['west','east','northeast','north'];
        this.npclist = [];
        this.tmpnpclist = [];
        this.userBag = { id:null,data:[], count: 0, };
        this.userStore = { data:[], count: 0 };
        this.userSj = { id:null, data:[], count: 0 };
        this.userSc1 = { id:null, data:[], count: 0 };
        this.userSc2 = { id:null, data:[], count: 0 };
        this.userSc3 = { id:null, data:[], count: 0 };
        this.shuyuanway = 'jh fam 0 start;go east;go north'
        this.homeWay = null;
        this.qucmd = [];
        this.packNumForYunbiao = 0;
        this.biaojuId = null;
        this.guojingfound = false;
        

        this.xuanwuOK = false;
        
        this.tazhuTestNum = 0;
        this.canSeamless = null;
        this.danColor = null;
        this.xuanlingdan = {
            id: null,
            num: 0,
        };
        this.enableSkillList = [];
        this.yaoshenOK = null;
        this.yaoshenTestNum = 0;
        this.kongmingquan = false;
        this.skillsToYaoShen = ['force.xin', 'force.ding', 'force.zhen', 'parry.dao','force.power','force.busi'];
        this.tiejiang = null;
        this.roomTimer = null;
        this.weeklist = this.allTask();

    }
    loadEvents() {
        const [onClose] = this.listeners('CLOSE');
        this.removeAllListeners();
        onClose && this.on('CLOSE', onClose);
        this.on('Data',require(`../events/week/Data.js`));
        this.on('Data',require('../events/autopfm/autopfm.js'))
    }
    allTask() {
        const directoryPath = path.join(__dirname, '../events/week/');
        const files = fs.readdirSync(directoryPath);
        const allWeekIist = files
            .filter(file => file.endsWith('.js') && file !== 'Data.js' && file !== 'end.js')
            .map(file => file.replace('.js', ''))
        return allWeekIist;
    }
}