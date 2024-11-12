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
    this.tazhuTestNum = 0;
    this.canSeamless = null;
    this.danColor = null;
    this.xuanlingdan = {};
    this.enableSkillList = [];
    this.yaoshen = null;
    this.yaoshenTestNum = 0;
    this.star = false;
    this.kongmingquan = false;
  }
  loadEvents() {
      const [onClose] = this.listeners('CLOSE');
      this.removeAllListeners();
      onClose && this.on('CLOSE', onClose);
      this.on('Data',require(`../events/week/Data.js`));
      this.on('Data',require('../events/autopfm/autopfm.js'))
  }
}