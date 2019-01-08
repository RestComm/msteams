export const normalizePort = (val) => {
  const mport = parseInt(val, 10);
  if (Number.isNaN(mport)) {
    return val;
  }
  if (mport >= 0) {
    return mport;
  }
  return false;
};

export const onError = (error, port) => {
  if (error.syscall !== 'listen') {
    throw error;
  }
  const bind = typeof port === 'string' ? `Pipe  ${port}` : `Port ${port}`;
  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`); // eslint-disable-line
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`); // eslint-disable-line
      process.exit(1);
      break;
    default:
      throw error;
  }
};
