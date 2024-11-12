// getServer.js
const axios = require('axios');

module.exports = async function getServer() {
  try {
    const res = await axios.get('http://www.wamud.com/Game/GetServer');
    if (res.status !== 200 || !Array.isArray(res.data) || res.data.length === 0) {
      return null;
    }

    return res.data;
  } catch (error) {
    console.error('Error fetching server data:', error);
    return null;
  }
};