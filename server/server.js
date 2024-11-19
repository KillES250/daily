// server.js
const express = require('express');
const path = require('path');

const getServer = require('./getServer');
const getToken = require('./getToken');
const handleSpawn = require('./handleSpawn');
const Socket = require('./socket');
const { configs } = require('./configs.js');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.urlencoded({ extended: true, depth: 10, limit: '50mb' }));


// 设置路由以返回index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/tuiyan', (req, res) => {
    res.sendFile(path.join(__dirname,  '../tuiyan/index.html'));
});
app.post('/api/:action', async (req, res) => {
    const action = req.params.action;
    switch (action) {
        // 读取运行配置
        case 'saveConfig':
        case 'executeTask':
            const executeTaskResult = await configs.loadUserConfigForData()
            if (!executeTaskResult) {
                res.json({ message: '读取配置失败' });
                return;
            }else {
                res.json({ executeTaskResult });
            }
            break;
        case 'readConfig':
            const readConfigResult = await configs.loadUserConfigTmp()
            if (!readConfigResult) {
                res.json({ message: '读取配置失败' });
                return;
            }else {
                res.json({ readConfigResult });
            }
            break;
        // 下面这条这是 getServer，懒得改了。
        case 'addRole':
            try {
                const servers = await getServer();
                if (servers) {
                    res.json({ message: '获取服务器信息成功', servers: servers });
                } else {
                    res.status(500).json({ error: '获取服务器信息失败' });
                }
            } catch (error) {
                console.error('Error in addRole:', error);
                res.status(500).json({ error: '内部服务器错误' });
            }
            break;
        case 'login':
            const { username, password, server} = req.body;
            const token = await getToken(username, password);
            if (!token) {
                return res.json({message: '登录失败,请检查账号密码是否正确'})
            }
            const socket = await new Socket({
                server,
                token,
            });
            socket.on('Data', (data) => {
                if (data.type === 'roles') {
                    res.json({ token, data });
                    socket.socketClose();
                }
            });
            break;
        case 'addrole':
            const thisRoleData = configs.convertBooleans(req.body)
            const addresult = configs.addRole(thisRoleData)
            if (addresult) {
                res.json({ message: '添加角色成功' });
            } else {
                res.json({ message: '添加角色失败' });
            }
            break;
        case 'delRole':
            const delresult = configs.delRole(req.body.name)
            if (delresult) {
                res.json({ message: '删除角色成功' });
            } else {
                res.json({ message: '删除角色失败' });
            }
            break;
        case 'loadConfig':
            const loadresult = await configs.loadUserConfig()
            if (loadresult) {
                res.json({ message: '加载配置成功' });
            } else {
               res.json({ message: '加载配置失败' });
            }
            break;
        case 'saveConfigtmp':
            const saveConfigtmp = await configs.saveUserConfigTmp()
            if (saveConfigtmp) {
                res.json({ message: '保存配置成功' });
            } else {
                res.json({ message: '保存配置失败' });
            }
            break;
        case 'upDateAllTasktime':
            const upDateAllTasktime = await configs.upDateAllTasktime(req.body)
            if (upDateAllTasktime) {
                res.json({ message:'更新任务时间成功' });
            } else {
                res.json({ message:'更新任务时间失败' });
            }
            break;
        case 'initConfigtmp':
            const initConfigtmp = await configs.initConfigtmp()
            if (initConfigtmp) {
                res.json({ message:'初始化配置成功' });
            } else{
                res.json({ message:'初始化配置失败' });
            }
            break;
        case 'choiceConfirm':
            const choiceConfirmResult = await configs.updateRole(req.body)
            if (choiceConfirmResult) {
                res.json({ message:'更新成功' });
            } else {
                res.json({ message:'更新成功' });
            }
            break;
        case 'savePushToken':
            const savePushTokenResult = await configs.savePushToken(req.body)
            if (savePushTokenResult) {
                res.json({ message:'保存成功' });
            } else {
                res.json({ message:'保存失败' });
            }
            break;
        case 'itemsConfig':
            const itemsConfigResult = await configs.getallitems();
            if (itemsConfigResult) {
                res.json({ message: '获取成功', items: itemsConfigResult });
            } else {
                res.json({ message: '获取失败' });
            }
            break;
        case 'runall':
            handleSpawn('npm', ['run', 'runall'], res, '任务挂起成功', '任务挂起失败');
            break;
        case 'killall':
            handleSpawn('npm', ['run', 'killall'], res, '已结束所有任务', '未能结束所有任务');
            break;
        case 'rundaily':
            handleSpawn('npm', ['run', 'rundaily'], res, '日常任务开始执行', '执行日常失败');
            break;
        case 'runwar':
            handleSpawn('npm', ['run', 'runwar'], res, '帮战任务开始执行', '执行帮战失败');
            break;
        case 'runweek':
            handleSpawn('npm', ['run', 'runweek'], res, '周常任务开始执行', '执行周常失败');
            break;
        default:
            res.status(404).json({ error: '未找到该操作' });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});