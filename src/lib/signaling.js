const EventEmitter = require('events').EventEmitter;

class Signaling extends EventEmitter {
  constructor (ws) {
    super();

    this.ws = ws;
    this.ws.on('close', this._onClose.bind(this));
    this.ws.on('message', this._onMessage.bind(this));
  }

  _onClose (event) {
    this.emit('close', event);
  }

  _onMessage (data) {
    const message = JSON.parse(data);

    if (message.type === 'glue') return this.emit('glue', message.data);
    if (message.type === 'relay') return this.emit('relay', message.data);

    this.emit('message', { data, message });
  }

  send (type, data) {
    data = data || {};
    this.ws.send(JSON.stringify({ type, data }));
  }

  glue (other) {
    this.on('relay', ({ type, data }) => {
      other.send(type, data);
    });
  }

  close () {
    this.ws.close();
  }
}

module.exports = Signaling;
