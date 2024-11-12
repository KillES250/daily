
const schedule = require('node-schedule');

const allJobs = [];

function killAllJob() {
  allJobs.forEach(job => {
    job.cancel();
  });

  allJobs.length = 0;
}

if (require.main === module) {
  killAllJob();
}

module.exports = { 
  killAllJob 
};