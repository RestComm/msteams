#!/usr/bin/env node

import { createServer } from 'http';
import createError from 'http-errors';
import express, { json, urlencoded } from 'express';
import morgan from 'morgan';
import { normalizePort, onError, getLogger } from './utils';

import Routes from './routes';
import BotManager from './bots';

const bot = new BotManager();

const { debug, cerror } = getLogger('app');

const app = express();
const isDev = app.get('env') === 'development';

if (isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('common'));
  app.disable('x-powered-by');
}

app.use(json());
app.use(urlencoded({ extended: false }));

// import the routing
Routes(app);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const port = normalizePort(process.env.PORT || 3333);
app.set('port', port);

const server = createServer(app);

// set
bot.setup(app);
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
process.on('SIGINT', async () => {
  debug('SIGINT signal received.');
  // Stops the server from accepting new connections and finishes existing connections.
  server.close((err) => {
    if (err) {
      cerror(err); // eslint-disable-line
      process.exit(1);
    }
  });
});

// Listen on provided port, on all network interfaces.
server.listen(port);
