const logger = require('./logger');

module.exports = class Cmd {
  #socket;
  #commandList = [];

  constructor(socket, name) {
    this.#socket = socket;
    this.name = name;
  }

  send(commandString, wait = true) {
    if (typeof commandString !== 'string') {
      return;
    }

    if (!wait) {
      commandString.split(';').forEach((cmd) => this.#socket.send(cmd));
      return;
    }

    this.#commandList = [...this.#commandList, ...commandString.split(';')];
    this.#commandQueue();
  }

  commandClear() {
    this.#commandList = [];
  }

  hasCommand() {
    return this.#commandList.length > 0;
  }

  #commandQueue() {
    const nowTime = new Date().getTime();
    if (!this.hasCommand() || this.#socket.readyState !== 1) {
      return;
    }

    if (nowTime - this.lastCommandTime < 5e2) {
      setTimeout(() => this.#commandQueue(), 1e2);
      return;
    }

    const command = this.#commandList.shift();
    this.#socket.send(command);
    this.lastCommandTime = nowTime;

    logger.debug(`「${this.name}」${command}`);

    if (this.hasCommand()) {
      setTimeout(() => this.#commandQueue(), 1e2);
    }
  }
};
