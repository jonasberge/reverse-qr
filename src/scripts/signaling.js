function isSecure () {
  return location.protocol.startsWith('https');
}

class Signaling extends EventTarget {
  constructor () {
    super();
    const protocol = isSecure() ? 'wss' : 'ws';
    const url = protocol + '://' + location.host;

    this.ws = new WebSocket(url);
    this.ws.onopen = this._onOpen.bind(this);
    this.ws.onclose = this._onClose.bind(this);
    this.ws.onmessage = this._onMessage.bind(this);
  }

  _onOpen (event) {
    console.log('signaling channel opened.');
    this.dispatch('open');
  }

  _onClose (event) {
    console.log('signaling channel closed.');
    this.dispatch('close');
  }

  _onMessage (event) {
    const data = event.data;
    const message = JSON.parse(data);

    if (message.type === 'channel')
      return this.dispatch('channel', { channel: message.data });

    if ('type' in message)
      return this.dispatch(message.type, message.data);

    console.log('untyped signaling message received:', event.data);
    this.dispatch('message', { data, message });
  }

  on (event, callback) {
    if (callback)
      this.addEventListener(event, callback);
  }

  send (type, data) {
    this.ws.send(JSON.stringify({ type, data }));
  }

  relay (type, data) {
    this.send('relay', { type, data });
  }

  dispatch (type, data) {
    const event = new Event(type);
    event.data = data;

    this.dispatchEvent(event);
  }

  close () {
    this.ws.close();
  }
}
