// getToken.js
const axios = require('axios');
const { stringify } = require('qs');

module.exports = async function getToken(account, password) {
  const res = await axios.post(
    'http://www.wamud.com/UserApi/Login',
    stringify({ code: account, pwd: password }),
    {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Host': 'www.wamud.com'
      }
    }
  );

  if (res.status !== 200 || res.data.code !== 1 || !res.headers['set-cookie']) {
    return null;
  }

  const token = res.headers['set-cookie'].map((cookie) => cookie.match(/^(u|p)=(.+?);/)[2]);
  return token.join(' ');
};