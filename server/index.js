$(document).ready(function(){
    const rightBoxArr = ['read', 'login', 'config', 'items', 'task'];
    const leftButtonArr = $('.left button').map((_, el) => el.id).get();
    const leftButtonBindArr = ['readConfig','addRole','executeTask','itemsConfig'];
    // 绑定鼠标移入事件
    function bindMouseOver(...selectors) {
        let selectorString = Array.isArray(selectors) ? selectors.map(selector => `#${selector}`).join(', ') : `#${selectors}`;
        $('.left').one('mouseover', selectorString, function() {
            const id = $(this).attr('id');
            $.post(`/api/${id}`, function(data) {
                if (id === 'addRole') {
                    randerServerSelect(data.servers);
                } else if (id === 'readConfig') {
                    randerRoles(data.readConfigResult);
                } else if (id === 'executeTask') {
                    randerExecuteTask(data.executeTaskResult);
                    $('input[name="pushtoken"]').val(data.executeTaskResult.pushpushpush);
                } else if (id === 'itemsConfig') {
                    radnerallitems(data.items);
                }
            });
        });
    }
    // 立即执行一次
    bindMouseOver(...leftButtonBindArr);
    // 检查时间格式
    function checkTimeDataFormat(data) {
        
        const dailytimeRegex = /^(\d{2}:\d{2})$/;
        const wartimeRegex = /^(\d{2}:\d{2})[\u4e00-\u9fa5]$/; // 匹配以一个汉字结尾的时间格式
        const weektimeRegex = /^(1|2|3|4|5|6|7):\d{2}:\d{2}$/;
        
        const timeFields = [
            { field: 'dailytime', regex: dailytimeRegex },
            { field: 'wartime', regex: wartimeRegex },
            { field: 'weektime', regex: weektimeRegex }
        ];
        
        for (const { field, regex } of timeFields) {
            const fieldValue = data[field] || '';
            if (fieldValue) {
                const values = fieldValue.split('|').filter(val => val !== '');
                for (const time of values) {
                    if (!regex.test(time)) {
                        return false;
                    }
                }
            }
        }
        return true; 
    }
    // 获取填写的时间值
    function getInputTimeValues(selector) {
        return $(selector).map(function() {
            return $(this).val();
        }).get().filter(val => val !== '').join('|').replace(/\|$/, '');
    };
    // 渲染警告消息的文本
    function raderModalMsg(data) {
        if (data === 'readConfig') {
            $('.modal-msg').text("该操作会读取<运行配置>到当前界面(覆盖)。");
            $(".modal-msg").attr("value", "loadConfig");
        } else if (data === 'addRole') {
            $('.modal-msg').text("是否同步所有角色的密匙(token码)？");
            $(".modal-msg").attr("value", "upDateToken");
        } else if (data === 'saveConfigs') {
            $('.modal-msg').text("该操作会将<当前配置>同步到<运行配置>中(覆盖)。");
            $(".modal-msg").attr("value", "saveConfigtmp");
        } else if (data === 'executeTask') {
            $('.modal-msg').text("同步当前时间用于下次挂起任务。");
            $(".modal-msg").attr("value", "upDateAllTasktime");
        }else if (data === 'roleConfig') {
            $('.modal-msg').text("移除所有角色，初始化文件(文件格式损坏时)");
            $(".modal-msg").attr("value", "initConfigtmp");
        }else if (data === 'itemsConfig') {
            $('.modal-msg').text("下载当前物品策略匹配覆盖，位置根目录下");
            $(".modal-msg").attr("value", "saveItemsConfigs");
        }
        $('.left, .right').hide();
        $('.modal-warning').css('display' ,'block');
    };
    // 渲染角色列表
    function randerRoles(data){
        const roles = data.roles
        const $rolesList = $('.roleslist');
        $rolesList.empty();
        roles.forEach(role => {
            const item = $('<div class="roleName">').append(
                $('<span>', {
                    class: 'lable',
                    text: role.name,
                    click: () => {
                        setRoleData(role);
                        showPage('roleConfig');
                        $('#readConfig').trigger('mouseout');
                        $('#roleConfig').trigger('mouseover');
                    }
                })
            );
            const delButton = $('<button>', {
                class: 'del-button',
                text:'X',
                click: function(){
                    const name = $(this).parent().text().replace('X','');
                    item.remove();
                    $(this).remove();
                    $.post('/api/delRole',{name} ,function(data){
                        console.log(data.message);
                    });
                }
            })
            item.append(delButton);
            $rolesList.append(item);
        })
    };
    // 从角色列表名字跳转到配置信息页面的数据设置方法
    function setRoleData(data) {
        $('#rolenName').text(data.name);
        $('#loginCommand').text(data.loginCommand);
        $('#logoutCommand').text(data.logoutCommand);
        const redbossValue = data.redboss === '' ? "null" : (data.redboss === false ? "false" : `${data.redboss}`);
        $('#redboss').val(redbossValue);
        $('#leitai').val(`${data.leitai}`);
        $('#first').val(`${data.dungeons.first}`);
        $('#second').val(`${data.dungeons.second}`);
        if (data.dungeons.third === 'saodang muyuan'){
            $('#third').val('saodang muyuan')
        } else {
            const third = data.dungeons.third.match(/cr (\S+) (\d+)/);
            $(`#third option[value="${third[1]}"][hard="${third[2]}"]`).prop('selected', true);
        }
        // $('#third').val(third);
        $('#fourth').val(`${data.dungeons.fourth}`);
        $('#famiily').val(`${data.war.famiily}`);
        $('#gang').val(`${data.war.gang}`);
        $('#leader').val(`${data.war.leader}`);
        $('#xiangyang').val(`${data.week.xiangyang}`);
        $('#yunbiao').val(`${data.week.yunbiao}`);
        const tazhuValue = data.week.tazhu === '' ? "null" : (data.week.tazhu === false ? "false" : `${data.week.tazhu}`);
        $('#tazhu').val(tazhuValue);
        const yaoshenValue = data.week.yaoshen === '' ? "null" : (data.week.yaoshen === false ? "false" : `${data.week.yaoshen}`);
        $('#yaoshen').val(yaoshenValue);
    };
    // 渲染分区列表
    function randerServerSelect(servers) {
        const $select = $('#server');
        $select.empty(); 
        servers.forEach(server => {
            const option = $('<option>', {
                value: 'ws://' + server.IP + ':' + server.Port,
                text: server.Name
            });
            $select.append(option);
        });
    };
    // 渲染游戏服务器返回的角色列表
    function randerUsernamelist(data,data2,data3) {
        const $select = $('.usernamelist');
        $select.empty();
        if (data.length === 0) {
            $select.text('没有可以选择的角色，请先创建角色并完成教学')
            return;
        }
        data.forEach(role => {
            const item = $('<div>', {
                class: 'role-item',
                id: role.id,
                text: role.name
            });
            // 添加角色的项目
            const addButton = $('<button>', {
                class: 'add-button',
                text: '+',
                click: function () {
                    const rolesinfo = {
                        name: role.name,
                        server: data2,
                        token: data3 + " " + role.id,
                        loginCommand: '',
                        logoutCommand: '',
                        canlogin: true,
                        redboss: null,
                        leitai: false,
                        dungeons:{
                            first: false,
                            second: false,
                            third: "cr yz/lw/shangu 0",
                            fourth: false,
                        },
                        war:{
                            family: false,
                            gang: false,
                            leader: false,
                        },
                        week:{
                            xiangyang: false,
                            yunbiao: false,
                            tazhu: null,
                            yaoshen: null,
                        }
                    }
                    $.post('api/addrole', rolesinfo, function(data){
                        console.log(data);
                    });
                    $(this).remove();
                }
            });
            item.append(addButton);
            $select.append(item);
        });
    };
    // 渲染时间选择框
    function randertimebox(data, classname) {
        const $class = $(`.${classname}`);
        if (data.length !== 0) {
            $class.empty();
        }else{
            const container = $('<div class="timebox">');
            const itembox = $('<input type="text" name="time" />').val('');
            const deleteButton = $('<button>', {
                class: 'delete-button',
                text: '删',
                click: function() {
                    container.remove();
                    $(this).remove();
                }
            });
            container.append(itembox,deleteButton);
            $class.append(container);
        }
        data.forEach(item => {
            const container = $('<div class="timebox">');
            const itembox = $('<input type="text" name="time" />').val(item);
            const deleteButton = $('<button>', {
                class: 'delete-button',
                text: '删',
                click: function() {
                    container.remove();
                    $(this).remove();
                }
            });
            container.append(itembox,deleteButton);
            $class.append(container);
        });
    };
    // 渲染已经存在的时间数据
    function randerExecuteTask(data) {
        const dailyTime = data.dailytime.split('|').map(item => item.trim());;
        const weekTime = data.weektime.split('|').map(item => item.trim());;
        const warTime = data.wartime.split('|').map(item => item.trim());;
        randertimebox(dailyTime,"timedataofdaily");
        randertimebox(warTime,"timedataofwar");
        randertimebox(weekTime,"timedataofweek");
    };
    // 渲染警告弹窗
    function randerWarning(data) {
        // 调用渲染文本函数
        raderModalMsg(data);
        // 绑定取消按钮逻辑
        $('#cancel').one('click', function() {
            $('.modal-warning').css('display' ,'none');
            $('.left, .right').show();
        });
        // 绑定确认按钮逻辑
        $('#ok').one('click', async function(data) {
            const order = $(".modal-msg").attr("value");
            let reqdata = {};
            if(order === "upDateAllTasktime"){
                reqdata = {
                    dailytime: getInputTimeValues('.timedataofdaily :input'),
                    wartime: getInputTimeValues('.timedataofwar :input'),
                    weektime: getInputTimeValues('.weektime :input')
                }
            }
            if (order === "saveItemsConfigs") {
                const reqbody = await collectAllItems();
                const yamlContent = objectToYaml(reqbody);
                const blob = new Blob([yamlContent], { type: 'text/yaml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = '物品数据.yaml';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                $('.modal-warning').css('display' ,'none');
                $('.left, .right').show();
                return;
            }
            const checkDataFormat = checkTimeDataFormat(reqdata);
            if(checkDataFormat === true){
                // 这里会调用警告弹窗的三个路由post，如果req不为空则是时间路由请求。
                $.post(`/api/${order}`, reqdata, function(callback) {
                    console.log(order)
                    if(order === "loadConfig"){
                        location.reload();
                        return
                    }
                    alert(callback.message)
                });
            }else{
                alert("时间格式不正确，请重新输入");
            };
            $('.modal-warning').css('display' ,'none');
            $('.left, .right').show();
        });
    };
    // 渲染物品界面
    function radnerallitems(data) {
        const $container = $('.items .bottom');
        $container.empty();
        // 遍历传入的data
        $.each(data, (index, item) => {
            // 获取对象的键和值
            const key = Object.keys(item)[0];
            const value = item[key];

            const $itemFor = $('<div></div>').addClass('itmes-for');
            const $span = $('<span></span>').text(key);
            $itemFor.append($span);

            const $select = $('<select></select>');
            const options = [
                '丢弃',  '使用', '分解', '背包', '仓库', '书架', '随从1', '随从2', '随从3'
            ];

            options.forEach(optionText => {
                const $option = $('<option></option>').val(optionText).text(optionText);
                $select.append($option);
            });

            $select.val(value);
            $itemFor.append($select);
            $container.append($itemFor);
            // 即时渲染
            $select.change(updateStats);
        });
        // 立即统计渲染一次
        updateStats();
    };
    // 统计物品使用情况函数(上方即时渲染)
    function updateStats() {
        const options = [
            '丢弃', '使用', '分解', '背包', '仓库', '书架', '随从1', '随从2', '随从3'
        ];

        const stats = options.reduce((acc, option) => {
            acc[option] = 0;
            return acc;
        }, {});

        $('.items .bottom select').each(function() {
            const value = $(this).val();
            if (options.includes(value)) {
                stats[value]++;
            }
        });

        const $statsContainer = $('.stats-container');
        $statsContainer.empty();

        for (const [option, count] of Object.entries(stats)) {
            const $statItem = $(`<p>${option}: ${count}</p>`);
            $statsContainer.append($statItem);
        }
    }
    // 获取所有物品的设置
    async function collectAllItems() {
        const $container = $('.items .bottom');
        const itemsArray = [];

        // 反向遍历容器中的每个物品('.itmes-for'
        $container.find('.itmes-for').each((index, itemFor) => {
            const $itemFor = $(itemFor);
            const itemName = $itemFor.find('span').text();
            const selectedOption = $itemFor.find('select').val();
            // 将名称和选择的操作组合成一个数组
            const itemObject = {};
            itemObject[itemName] = selectedOption;
            itemsArray.push(itemObject);
        });
        // 发送数组
        return itemsArray;
    }
    // 显示右侧页面
    function showPage(id) {
        const index = leftButtonArr.indexOf(id);
        const rightBoxArrTmp = [...rightBoxArr];
        rightBoxArrTmp.splice(index, 1);
        rightBoxArrTmp.forEach(page => $(`.${page}`).hide());
        $(`.${rightBoxArr[index]}`).show();
    };
    // 鼠标对左侧按钮的逻辑1
    $('.left').on('mouseover','button', function() {
        const id = $(this).attr('id');
        $(this).css('background-color','#ccc')
        const leftButtonArrTmp = leftButtonArr.filter(item => item !== id);
        leftButtonArrTmp.forEach(btnName => {
            $(`#${btnName}`).css('background-color', '#ffffff');
        });
        // 显示按钮对应的右侧页面
        showPage(id);
        // 去掉当前页面按钮的绑定，防止鼠标移动到按钮上使已经渲染的页面信息丢失
        if (leftButtonBindArr.includes(id)) {
            const leftButtonBindArrTmp = leftButtonBindArr.filter(item => item !== id)
            bindMouseOver(...leftButtonBindArrTmp)
        }
    });
    // 鼠标移出左侧按钮
    $('.left').on('mouseout','button', function() {
        const id = $(this).attr('id');
        $(this).css('background-color','#ccc')
    });
    // 警告弹窗
    $('.left').on('click', '#readConfig, #addRole, #itemsConfig, #executeTask, #roleConfig', function() { 
        const id = $(this).attr('id');
        randerWarning(id)
    });
    $('.saveConfigs').on('click', function() { 
        const id = $(this).attr('id');
        randerWarning('saveConfigs')
    });
    // 登录按钮绑定
    $('.commit').on('click', function(data) {
        const username = $('#username').val();
        const password = $('#password').val();
        const server = $('#server').val();
        $.post('/api/login', {username, password,server}, function(data) {
            if (data.message) {
                alert(data.message)
            } else {
                randerUsernamelist(data.data.roles, server, data.token);
            }
        });

    });
    // 添加所有角色按钮绑定
    $('.add_allroles').on('click', function() {
        const interval = 100; 
        $('.add-button').each(function(index) {
            setTimeout(() => {
                $(this).trigger('click');
            }, index * interval);
        });
    })
    // 时间添加绑定
    $('.addtime').on('click', function() {
        const classname = $(this).parent().children()[2].className;
        const data = []
        randertimebox(data,classname);
    });       
    // 选择应用按钮绑定
    $('#applyToRoles').on('click', function() {
        const namelist = $('.roleslist .roleName .lable').map(function() {
            return $(this).text();
        }).get()
        $('.choiceRoles .top').empty();
        namelist.forEach(name => {
            const html = `
                <div class="role-item-choice">
                    <label>${name}</label>
                    <input type="checkbox" name="role-checkbox" value="${name}">
                </div>
            `;
            $('.choiceRoles .top').append(html);
        });
        $('.left, .right').hide();
        $('.choiceRoles').show();
    });
    // 放弃按钮的绑定
    $('.choiceRoles #choiceNone').on('click', function(){
        $('.left, .right').show();
        $('.choiceRoles').hide();
    });
    $('.choiceRoles #choiceAll').on('click', function(){
        const checkboxes = $('.top input[type="checkbox"]');
        const shouldCheck = !checkboxes.is(':checked');
        checkboxes.prop('checked', shouldCheck);
    });
    // 更新所选角色的配置
    $('.choiceRoles #choiceConfirm').on('click', function(){
        const checkedRoles = $('.top input[type="checkbox"]:checked').map(function() {
            return $(this).val();
        }).get();
        const roleSelected = {
            loginCommand:$('#loginCommand').val(),
            logoutCommand:$('#logoutCommand').val(),
            redboss:$('#redboss').val(),
            leiitai:$('#leitai').val(),
            dungeons:{
                first:$('#first').val(),
                second:$('#second').val(),
                third: $('#third').val() === 'saodang muyuan' 
                    ? $('#third').val() 
                    : `cr ${$('#third').val()} ${$('#third option:selected').attr('hard')}`,
                fourth:$('#fourth').val(),
            },
            war:{
                family:$('#family').val(),
                gang:$('#gang').val(),
                leader:$('#leader').val(),
            },
            week:{
                xiangyang:$('#xiangyang').val(),
                yunbiao:$('#yunbiao').val(),
                tazhu:$('#tazhu').val(),
                yaoshen:$('#yaoshen').val(),
            }
        }
        $.post('/api/choiceConfirm', {checkedRoles, roleSelected}, function(data) {
            if (data.message) {
                alert(data.message)
            }
        });
    });
    $('.task .top .push').on('click', function(){
        const pushTokenValue = $('.task .top :text').val();
        $.post('/api/savePushToken', {pushTokenValue}, function(data) {
            if (data.message) {
                alert(data.message)
            }else {
                alert('保存成功')
            }
       });
    })
    $('.task .taskup .runtask').on('click', function(){
        $.post('/api/runall' , function(data){
            if (data.message) {
                alert(data.message)
            }else {
                alert(data.error)
            }
        })
    });
    $('.task .taskup .stoptask').on('click', function(){
        $.post('/api/killall' , function(data){
            if (data.message) {
                alert(data.message)
            }else {
                alert(data.error)
            }
        })
    });
    $('.task .taskdown .rundaily').on('click', function(){
        $.post('/api/rundaily' , function(data){
            if (data.message) {
                alert(data.message)
            }else {
               alert(data.error)
            }
        })
    });
    $('.task .taskdown .runwar').on('click', function(){
        $.post('/api/runwar' , function(data){
            if (data.message) {
                alert(data.message)
            }else {
                alert(data.error)
            }
        })
    });
    $('.task .taskdown .runweek').on('click', function(){
        $.post('/api/runweek' , function(data){
            if (data.message) {
                alert(data.message)
            }else {
                alert(data.error)
            }
        })
    });
    // 将对象转换为 YAML 格式
    function objectToYaml(obj) {
        let yaml = 'Items:\n';
        obj.forEach(item => {
            const itemName = Object.keys(item)[0];
            const selectedOption = item[itemName];
            yaml += ` - '${itemName}': ${selectedOption}\n`;
        });
        return yaml;
    }
});