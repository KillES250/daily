function up() {
  if (
    this.isCombat ||
    this.userStatus.has('busy') ||
    this.userStatus.has('faint') ||
    this.userStatus.has('rash')
  ) {
    return;
  }
  this.cmd.send('go up');
}

function pfm() {
  if (!this.isCombat || this.userStatus.has('busy') || this.userStatus.has('faint') || this.gcd) {
    return;
  }
  const canUseSkill = this.userSkills.find((skill) => !this.cd.has(skill) && !this.skillsBanList.includes(skill));
  canUseSkill && this.cmd.send(`perform ${canUseSkill}`, false);
}

function fix() {
  if (!this.huntTaskInfo.place) {
    return;
  }

  this.huntTaskInfo.nowTaskWay = JSON.parse(
    JSON.stringify(this.gameInfo.hunt.path[this.huntTaskInfo.place].split(';')),
  );
  this.cmd.send(this.huntTaskInfo.nowTaskWay.shift());
}

module.exports = {
  up,
  pfm,
  fix,
};
