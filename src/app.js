const https = require('https');
const http = require('http');
const path = require('path');
const fs = require('fs');

const { v4: uuid } = require('uuid');

// const newrelic = require('newrelic');
const express = require('express');
const helmet = require('helmet');
const ws = require('ws');

const Signaling = require('./lib/signaling');

const app = express();
// require('express-ws')(app);

const resolve = (...paths) => path.resolve(__dirname, ...paths);

app.use(helmet());

app.use('/assets/scripts', express.static(resolve('scripts')));
app.use('/assets', express.static(resolve('assets')));

app.get('/', (req, res) => res.sendFile(resolve('views/index.html')));
app.get('/s/:channel?', (req, res) => {
  const channel = req.params.channel;
  if (!channel || !(channel in channels))
    return res.redirect('/how');

  return res.sendFile(resolve('views/scan.html'));
});

app.get('/how', (req, res) => res.sendFile(resolve('views/how.html')));

const credentials = {
  key: fs.readFileSync('certs/key.pem'),
  cert: fs.readFileSync('certs/cert.pem')
};

const server = https.createServer(credentials, app);
const port = process.env.PORT || 5000;

server.listen(port, function () {
  console.log('Running on port', port);
});

const channels = {};

const wss = new ws.Server({ server });

// TODO: close connections after a couple of minutes if unused.
// TODO: detect broken connections.
// https://www.npmjs.com/package/ws#how-to-detect-and-close-broken-connections

wss.on('connection', (ws) => {
  console.log('open', Object.keys(channels));

  // const id = Object.keys(channels).length === 0
  //   ? 'b8eb236d-993c-4e7f-8440-9759550e91ed'
  //   : uuid();

  const id = uuid();

  const signaling = new Signaling(ws);

  signaling.on('close', () => {
    console.log('close', id);
    delete channels[id];
  });
  if (ws.readyState === ws.OPEN)
    channels[id] = signaling;

  signaling.on('glue', ({ channel }) => {
    if (!(channel in channels)) return;
    const other = channels[channel];

    other.glue(signaling);
    signaling.glue(other);

    signaling.on('close', () => {
      other.removeAllListeners('relay');
    });

    other.on('close', () => {
      signaling.close();
    });

    signaling.send('glued');
  });

  signaling.send('channel', id);
});
