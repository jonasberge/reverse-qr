const links = document.querySelector('#links');
const qrcode = new QRCode('qrcode', {
  width: 256,
  height: 256,
  colorDark: '#000000',
  colorLight: '#ffffff',
  correctLevel: QRCode.CorrectLevel.L
});

function showUrl (url) {
  const a = links.querySelector('a');
  a.innerText = url;
  a.href = url;
  links.classList.remove('hidden');
}

function showQrCode (url) {
  qrcode.clear();
  qrcode.makeCode(url);
}

function hideLink () {
  links.classList.add('hidden');
}

function showLink (url) {
  showUrl(url);
  showQrCode(url);
}

function createUrlForChannel (channelName) {
  return location.origin + '/s/' + channelName;
}

const signaling = new Signaling();

signaling.on('channel', function ({ data }) {
  showLink(createUrlForChannel(data.channel));
  console.log('channel', data.channel);
});

signaling.on('ping', function ({ data }) {
  console.log('ping!', data);
  signaling.relay('pong', {
    message: 'Yes I am!'
  });
});

signaling.on('clipboard', function ({ data }) {
  if (data.types.includes('text/plain'))
    return showText(data.data);
});

function showText (text) {
  const container = document.querySelector('#clipboard');
  const span = document.createElement('span');
  span.classList.add('item');
  span.innerText = text;
  container.appendChild(span);
}
