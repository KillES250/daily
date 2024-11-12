const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const userconfig = path.resolve(__dirname, '../../userconfig/userconfig.yaml');
const Week = require('../example/week.js');

async function runweek() {
  try {
    const data = await fs.promises.readFile(userconfig, 'utf8');
    const configs = yaml.load(data);

    const roles = Array.isArray(configs) ? configs : configs.roles;  

    global.pushplusToken = configs.pushplus ? configs.pushplus : '';
    for (const role of roles) {
      if (role.week.xiangyang !== false || role.week.yunbiao !== false || role.week.tazhu !== null || role.week.yaoshen !== null) {
        loginQueue(role);
      }
    }
  } catch (error) {
    console.error('Error reading or processing config file:', error);
  }
}

function loginQueue(userConfig) {
  const user = new Week(userConfig);
}

module.exports = { 
  runweek 
};