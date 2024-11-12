const json5 = require('json5');
const WebSocket = require('ws');
const { EventEmitter } = require('events');
const Cmd = require('./cmd');

module.exports = class Socket extends EventEmitter {
    #socket;

    constructor(config) {
        super();
        this.userConfig = config;
        
        try {
            this.#socket = new WebSocket(this.userConfig.server);
            this.#socket.onopen = this.#onOpen.bind(this);
            this.#socket.onclose = this.#onClose.bind(this);
            this.#socket.onerror = this.#onError.bind(this);
            this.#socket.onmessage = this.#onMessage.bind(this);
        } catch ({ message }) {
            this.emit('ERROR', message);
        }
            this.cmd = new Cmd(this.#socket, this.userConfig.name);
    }

    #onOpen() {
        this.emit('OPEN');
        this.#socket.send(this.userConfig.token);
    }

    #onClose() {
        this.emit('CLOSE');
    }

    #onError({ message }) {
        this.emit('ERROR', message);
    }

    #onMessage({ data }) {
        if (typeof data !== 'string') {
          return;
        }

        if (/^{.+}$/.test(data)) {
            const gameData = json5.parse(data);
            this.emit('Data', gameData);
        } else {
            this.emit('Data', { type: 'tip', data });
        }
    }

    socketClose() {
        this.#socket.close();
    }
};
