const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
const userconfig = path.resolve(__dirname, '../../userconfig/userconfig.yaml');
const Daily = require('../example/daily.js');

async function rundaily() {

    try {
        const data = await fs.promises.readFile(userconfig, 'utf8');
        const configs = yaml.load(data);
        const roles = Array.isArray(configs) ? configs : configs.roles;
        global.pushplusToken = configs.pushplus ? configs.pushplus : '';

        // 限制登录数量
        roles.slice(0, 30).forEach((userConfig) => {
            loginQueue(configs, userConfig);
        });
    } catch (error) {
        console.error('Error reading or processing config file:', error);
    }
}

function loginQueue(configs, userConfig) {
    const user = new Daily(userConfig);
    user.on('CLOSE', () => {
        if (configs.length > 0) {
            const nextConfig = configs.shift();
            loginQueue(configs, nextConfig);
        }
    });
}

if (require.main === module) {
    rundaily();
}

module.exports = { 
    rundaily 
};