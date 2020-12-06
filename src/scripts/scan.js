function getChannelName () {
  const parts = location.pathname.split('/');
  return parts[parts.length - 1];
}

function hideChannelInPath () {
  const parts = location.pathname.split('/');
  parts.pop();
  const newPath = parts.join('/');
  window.history.pushState({}, '', newPath);
}

function extractChannelName (hideInPath) {
  const channelName = getChannelName();
  if (hideInPath === undefined || hideInPath)
    hideChannelInPath();
  return channelName;
}

const signaling = new Signaling();
const id = extractChannelName(false);

signaling.on('channel', function ({ data }) {
  console.log('channel', 'other', id);
  signaling.send('glue', { channel: id });
});

signaling.on('glued', function () {
  signaling.relay('ping', {
    message: 'are you there?'
  });
});

signaling.on('pong', function ({ data }) {
  console.log('pong!', data);
  sendClipboard();
});

function sendClipboard () {
  const clipboardContent = document.querySelector('div#clipboard');

  const handleText = function (text) {
    const span = document.createElement('span');
    span.classList.add('item');
    span.innerText = text;
    clipboardContent.appendChild(span);
  };

  navigator.permissions
    .query({ name: 'clipboard-read' })
    .then(function (result) {
      if (result.state !== 'granted' && result.state !== 'prompt') {
        alert('You need to grant permission to send your clipboard.');
        console.log('result.state', result.state);
        return;
      }

      navigator.clipboard.read().then(items => {
        if (items.length === 0)
          return alert('Your clipboard is empty.');
        if (items.length > 1)
          console.log('more than one item in clipboard.');

        const item = items[0];
        console.log(item);

        if (item.types.includes('text/plain'))
          item.getType('text/plain')
            .then(function (blob) {
              blob.text().then(function (text) {
                signaling.relay('clipboard', {
                  types: item.types,
                  data: text
                });
              });
            });

        // // handleText(value);
        // if (item.type == 'image/png') {
        //   const blob = items[i].getType('image/png');
        //   imgElem.src = URL.createObjectURL(blob);
        // }
      });
    });
}

// TODO: webpack dev server with SSL for clipboard access
// TODO: use babel with async/await transformer for less callbacks
