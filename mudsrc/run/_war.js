const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const userconfig = path.resolve(__dirname, '../../userconfig/userconfig.yaml');
const War = require('../example/war.js');
async function runwar() {
  try {
    const data = await fs.promises.readFile(userconfig, 'utf8');
    const configs = yaml.load(data);

    const roles = Array.isArray(configs) ? configs : configs.roles;

    global.pushplusToken = configs.pushplus ? configs.pushplus : '';

      roles.forEach(role => {
        if (role.war.gang === true || role.war.family === true) {
            loginQueue(role);
        }
    });
  } catch (error) {
    console.error('Error reading or processing config file:', error);
  }
}

function loginQueue(userConfig) {
  const user = new War(userConfig);
}

if (require.main === module) {
  runwar();
}

module.exports = { 
  runwar 
};