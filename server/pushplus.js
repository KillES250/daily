const axios = require('axios');

function pushMsg(msg) {
  if (!global.pushplusToken) {
    return;
  }

  axios.post('http://www.pushplus.plus/send', {
    title: '武神传说日常任务',
    token: global.pushplusToken,
    content: msg,
  });
}

module.exports = pushMsg;
