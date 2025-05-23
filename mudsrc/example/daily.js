// 这是daily.js文件
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Socket = require(path.resolve(__dirname, '../../server/socket'));
const gameInfo = yaml.load(fs.readFileSync(path.resolve(__dirname, 'gameInfo.yaml')));
const yamldata = yaml.load(fs.readFileSync(path.resolve(__dirname, '../../物品数据.yaml')));
module.exports = class Daily extends Socket {
    constructor(config) {
        super(config);
        this.setMaxListeners(50);
        this.loadEvents();
        this.sect = null;
        this.dungeonNum = 0;
        this.userId = null;
        this.userJl = 0;
        this.userLevel = null;
        this.gameInfo = gameInfo;
        this.sectTaskInfo = {
            taskerId: null,
            taskItem: null,
            seller: null,
          };
        this.huntTaskInfo = {
            taskFailedNum: 0,
            taskerId: null,
            nowTaskWay: [],
            name: null,
            place: null,
            cai: false,
        };
        this.cd = new Set();
        this.gcd = false;
        this.isCombat = false;
        this.userSkills = null;
        this.userStatus = new Set();
        this.combatFailedNum = 0;
        this.towerGuardianId = null;
        this.nowRoomId = null;
        //新增部分
        this.room = null;
        this.roomPath = null;
        this.timers = {
            up: null,
            pfm: null,
            fix: null,
        };
        
        this.skillsBanList = [];
        this.taskList = [];
        this.allTaskList = this.allTask();
        this.dungeonsList = {
            jindi:null,
            guzongmen:null,
            yaota:null
        }
        this.fbnum = 0;
        this.tiejiang = null;
        this.weapon = null;
        this.jlxhoverflow = null;
        //boss相关
        this.skillsForRedBoss = ['blade.xue'];
        this.killCommands = null;
        this.bossId = null;
        this.bossName = null;
        this.tanlong = null;
        this.npclist = [];
        this.fbPath = [];
        this.pushBedLeftNum = 0;
        this.pushBedRightNum = 0;
        this.relive = true;
        this.bossFightTestNum = 0;
        this.delpath = true;
        this.executed = true;
        // this.mapdata = {};
        //杂项相关
        this.dabieye = true;
        this.misclist = this.getmisclist();
        this.mischouqin = null;
        this.mischouqinbuy = false;
        this.haozhaiarrive = ['west','east','northeast','north'];
        this.tmpnpclist = [];
        this.Yuanbao = 0;
        this.useStoneTaget = null;
        this.addstone = {};
        this.newCmd =[];
        this.tidyBody = [];
        this.booksindex = 0;
        this.bookscmds = null;
        
        this.copyArr = [];
        this.currentcmd = [];
        this.cmdoftidy = [];
        this.targetObjoftidy = {};
        this.fromIdoftidy = null;  
        this.toIdoftidy = null;
        this.creatcmdoftidy = [];
        this.minPriority = Infinity;

        
        this.userBag = { id:null,data:[], count: 0, };
        this.userStore = { data:[], count: 0 };
        this.userSj = { id:null, data:[], count: 0 };
        this.userSc1 = { id:null, data:[], count: 0 };
        this.userSc2 = { id:null, data:[], count: 0 };
        this.userSc3 = { id:null, data:[], count: 0 };

        this.drop = new Map();
        this.use = new Map();
        this.fenjie = new Map();
        this.bag = new Map();
        this.store = new Map();
        this.sj = new Map();
        this.sc1 = new Map();
        this.sc2 = new Map();
        this.sc3 = new Map();
        this.saodang = 0;
        this.getDict();

        this.roomTimer = null;
    }

    loadEvents() {
        const [onClose] = this.listeners('CLOSE');
        this.removeAllListeners();
        onClose && this.on('CLOSE', onClose);
        this.on('Data',require(`../events/daily/Data.js`));
        this.on('Data',require(`../events/autopfm/autopfm.js`));
        this.on('Data',require(`../events/daily/map.js`));
    }

    allTask() {
        const directoryPath = path.join(__dirname, '../events/daily/');
        const files = fs.readdirSync(directoryPath);
        const allTaskLIist = files
            .filter(file => file.endsWith('.js') && file !== 'Data.js' && file !== 'end.js' && file !== 'map.js')
            .map(file => file.replace('.js', ''))
        return allTaskLIist;
    }
    getDict(){
        yamldata.Items.forEach(item => {
            const [name, location] = Object.entries(item)[0];
            switch (location) {
                case '丢弃':// this.drop = new Map();
                    this.drop.set(name, name);
                    break;
                case '使用'://this.use = new Map();
                    this.use.set(name, name);
                    break;
                case '分解':// this.fenjie = new Map();
                    this.fenjie.set(name, name)
                    break;
                case '背包':// this.bag = new Map();
                    this.bag.set(name, name); 
                    break;
                case '仓库':// this.store = new Map();
                    this.store.set(name, name); 
                    break;
                case '书架':// this.sj = new Map();
                    this.sj.set(name, name); 
                    break;
                case '随从1':// this.sc1 = new Map();
                    this.sc1.set(name, name);
                    break;
                case '随从2':// this.sc2 = new Map();
                    this.sc2.set(name, name);
                    break;
                case '随从3':// this.sc3 = new Map();
                    this.sc3.set(name, name);
                    break;
                default:
                    break;
            }
        });
    }
    getmisclist(){
        const list  = fs.readdirSync(path.resolve(__dirname, '../events/daily/miscfile'))
        .filter(file => path.extname(file).toLowerCase() === '.js')
        .map(file => path.basename(file, '.js'));
        return list;
    }
}    