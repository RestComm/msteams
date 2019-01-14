#!/usr/bin/env node

import { createServer } from 'http';
import { join } from 'path';
import createError from 'http-errors';
import express, { json, urlencoded } from 'express';
import morgan from 'morgan';
import { TeamsChatConnector } from 'botbuilder-teams';
import { MemoryBotStorage } from 'botbuilder';

import { normalizePort, onError, getLogger } from './utils';
import Routing from './routes';
import { BotManager } from './bots';
import { RabbitMqManager } from './Services';

const { debug, cerror } = getLogger('app');

require('dotenv').config();

function relative(...args) {
  const root = [__dirname, '..'];
  return join(...root, ...args);
}

const app = express();
const isDev = app.get('env') === 'development';

const port = normalizePort(process.env.PORT || 3333);
app.set('port', port);

app.use('/static', express.static(relative('public', 'static')));

if (isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('common'));
  app.disable('x-powered-by');
}

app.use(json());
app.use(urlencoded({ extended: false }));

const connector = new TeamsChatConnector({
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD,
});
const botSetting = {
  storage: new MemoryBotStorage(),
};
const bot = new BotManager(connector, botSetting);

// instantiate a new rabbit MQ class instance
const rabmq = new RabbitMqManager();
rabmq.setup();

bot.addQueue(rabmq);
const routes = new Routing(bot, rabmq);
// setup the routings
routes.setup(app);
app.post('/api/messages', connector.listen());

app.get('*', (req, res) => {
  res.sendFile(relative('public', 'index.html'));
});

const server = createServer(app);

// listen for errors
server.on('error', (error) => {
  onError(error, port);
});

// Event listener for HTTP server "listening" event.
server.on('listening', async () => {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe  ${addr}` : `port ${addr.port}`;
  debug(`Listening on  ${bind}`);
});

// for shutting down the application gracefully
process.on('SIGINT', () => {
  debug('SIGINT signal received.');
  // close rabbitmq
  rabmq.close().then(() => {
    debug('RabbitMq connection closed');
  });
  // telsms.clearTimer();
  // Stops the server from accepting new connections and finishes existing connections.
  server.close((err) => {
    if (err) {
      cerror(err); // eslint-disable-line
      process.exit(1);
    }
  });
});

const config = {
  port,
};
const bindToIp = process.env.BIND_ADDR;
if (bindToIp) {
  config.host = bindToIp;
}
// Listen on provided port, on all network interfaces.
server.listen(config);
