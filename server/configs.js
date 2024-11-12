// configs.js
const fs = require('fs').promises
const yaml = require('js-yaml');
const path = require('path');
const userconfigtmp = path.resolve(__dirname, '../userconfig/userconfigtmp.yaml');
const userconfig = path.resolve(__dirname, '../userconfig/userconfig.yaml');
const itemspath = path.resolve(__dirname, '../物品数据.yaml');

const configs = {
    // 将对象中的字符串转换为布尔值
    convertBooleans(obj) {
        const newObj = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            if (typeof value === 'string') {
              newObj[key] = this.parseBoolean(value);
            } else {
              newObj[key] = this.convertBooleans(value);
            }
          }
        }
        return newObj;
    },
    // 将字符串转换为布尔值
    parseBoolean(value) {
        if (value === 'true') {
          return true;
        } else if (value === 'false') {
          return false;
        } else if (value == 'null'){
          return null;
        } else {
          return value;
        }
    },
    // 从临时文件中读取所有用户数据
    async loadUserConfigTmp() {
        try {
            const data = await fs.readFile(userconfigtmp, 'utf8');
            const config = yaml.load(data);
            if (!config) {
                console.error('配置文件为空');
                return null;
            }
            return config;
        } catch (error) {
            console.error('加载配置文件失败:', error);
            return null;
        }
    },
    // 从运行配置中读取所有用户数据
    async loadUserConfigForData() {
        try {
            const data = await fs.readFile(userconfig, 'utf8');
            const config = yaml.load(data);
            if (!config) {
                console.error('配置文件为空');
                return null;
            }
            return config;
        } catch (error) {
            console.error('加载配置文件失败:', error);
            return null;
        }
    },
    // 将当前页面配置写入运行配置中
    async saveUserConfigTmp() {
        try {
            const userConfigData = await fs.readFile(userconfig, 'utf8');
            const userConfig = yaml.load(userConfigData);
            const tmpData = await fs.readFile(userconfigtmp, 'utf8');
            const tmpConfig = yaml.load(tmpData);
            userConfig.roles = tmpConfig.roles;
            const dumpedData = yaml.dump(userConfig);
            await fs.writeFile(userconfig, dumpedData);
            console.log('配置已保存到', userconfig);
            return true
        } catch (error) {
            console.error('保存配置文件失败:', error);
        }
    },
    // 将运行配置写入到当前页面中来
    async loadUserConfig() {
        try {
            const data = await fs.readFile(userconfig, 'utf8');
            const config = yaml.load(data);
            const dumpedData = yaml.dump(config);
            await fs.writeFile(userconfigtmp, dumpedData);
            console.log('配置已保存到', userconfigtmp);
            return true
        } catch (error) {
            console.error('加载配置文件失败:', error);
        }
    },
    // 添加角色(对临时文件的操作)
    async addRole(data) {
        try {
            const existingData = await fs.readFile(userconfigtmp, 'utf8');
            let config = yaml.load(existingData)
            const roleName = data.name;
            const existingRoleIndex = config.roles.findIndex(role => role.name === roleName);

            if (existingRoleIndex !== -1) {
                config.roles[existingRoleIndex] = data;
            } else {
                config.roles.push(data);
            }
            const dumpedData = yaml.dump(config);
            await fs.writeFile(userconfigtmp, dumpedData);
            console.log('角色已添加或更新到', userconfigtmp);
            return true
        } catch (error) {
            console.error('添加或更新角色失败:', error);
        }
    },
    // 删除角色(对临时文件的操作)
    async delRole(name) {
        try {
            const existingData = await fs.readFile(userconfigtmp, 'utf8');
            let config = yaml.load(existingData);
            const existingRoleIndex = config.roles.findIndex(role => role.name === name);
            if (existingRoleIndex !== -1) {
                config.roles.splice(existingRoleIndex, 1);
                console.log(`已删除角色 ${name}`);
            } else {
                console.log(`未找到角色 ${name}`);
                return false
            }
            const dumpedData = yaml.dump(config);
            await fs.writeFile(userconfigtmp, dumpedData);
            console.log('角色已删除并保存到', userconfigtmp);
            return true
        } catch (error) {
            console.error('删除角色失败:', error);
        }
    },
    // 更新对应名称的用户配置(临时文件)
    async updateRole(data) {
        const { checkedRoles } = data; 
        try {
            const fileContent = await fs.readFile(userconfigtmp, 'utf8');
            const config = yaml.load(fileContent);
            const convertedRoleSelected = this.convertBooleans(data.roleSelected);
            config.roles.forEach(role => {
                // 这里暂时有个小错误，以后有空更新
                if (checkedRoles.includes(role.name)) {
                    role.loginCommand = convertedRoleSelected.loginCommand;
                    role.logoutCommand = convertedRoleSelected.logoutCommand;
                    role.redboss = convertedRoleSelected.redboss;
                    role.leitai = convertedRoleSelected.leiitai;
                    role.dungeons.first = convertedRoleSelected.dungeons.first;
                    role.dungeons.second = convertedRoleSelected.dungeons.second;
                    role.dungeons.third = convertedRoleSelected.dungeons.third;
                    role.dungeons.fourth = convertedRoleSelected.dungeons.fourth;
                    role.war.family = convertedRoleSelected.war.family;
                    role.war.gang = convertedRoleSelected.war.gang;
                    role.war.leader = convertedRoleSelected.war.leader;
                    role.week.xiangyang = convertedRoleSelected.week.xiangyang;
                    role.week.yunbiao = convertedRoleSelected.week.yunbiao;
                    role.week.tazhu = convertedRoleSelected.week.tazhu;
                    role.week.yaoshen = convertedRoleSelected.week.yaoshen;
                }
            });
            const updatedContent = yaml.dump(config);
            await fs.writeFile(userconfigtmp, updatedContent, 'utf8');
            console.log('角色状态已更新');
            return true
        } catch (error) {
            console.error('更新角色状态时出错:', error);
        }
    },
    // 更新全部任务时间(对运行文件的修改)
    async upDateAllTasktime(data){
        try {
            const existingData = await fs.readFile(userconfig, 'utf8');
            let config = yaml.load(existingData);
            
            config.dailytime = data.dailytime;
            config.wartime = data.wartime;
            config.weektime = data.weektime
            
            const updatedData = yaml.dump(config);
            await fs.writeFile(userconfig, updatedData, 'utf8');
            return true
        } catch (error) {
            console.error('Error updating config:', error);
        }
    },
    async initConfigtmp() {
        try {
            const config = {
                pushpushpush: '',
                dailytime: '',
                wartime: '',
                weektime: '',
                roles: []
            };
            await fs.writeFile(userconfigtmp, '');

            const yamlConfig = yaml.dump(config);
            await fs.writeFile(userconfigtmp, yamlConfig);
            console.log('Config initialized in userconfigtmp.yaml');
            return true
        } catch (error) {
            console.error('Error initializing config:', error);
        }
    },
    async savePushToken(data){
        try {
            const existingData = await fs.readFile(userconfig, 'utf8');
            let config = yaml.load(existingData);
            config.pushpushpush = data.pushTokenValue
            const updatedData = yaml.dump(config);
            await fs.writeFile(userconfig, updatedData, 'utf8');
            console.log('Push Token Result saved in userconfig.yaml');
            return true
        } catch (error) {
            console.error('Error saving Push Token Result:', error);
        }
    },
    // 获取所有物品数据
    async getallitems() {
        const data = await fs.readFile(itemspath, 'utf8');
        const item = yaml.load(data);
        return item.Items;
    },
};
module.exports = { 
    configs,
};