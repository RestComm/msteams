import debug from 'debug';

class Logger {
  constructor(config) {
    this.config = Object.assign(
      {},
      {
        context: 'paic',
        debug: true,
      },
      config || {},
    );

    this.debug = debug(this.config.context);
  }

  debug(message) {
    if (this.config.debug) {
      this.debug(message);
    }
  }

  debugContext(childContext) {
    if (!childContext) {
      throw new Error('No context supplied to debug');
    }
    return debug([this.config.context, childContext].join(':'));
  }

  getContext(childContext) {
    const chidebug = childContext || 'debug';
    const chidinfo = childContext || 'info';
    const chiderror = childContext || 'error';

    const cdebug = debug([this.config.context, chidebug].join(':'));
    cdebug.log = console.log.bind(console); // eslint-disable-line

    const cinfo = debug([this.config.context, chidinfo].join(':'));
    cinfo.log = console.info.bind(console); // eslint-disable-line

    const cerror = debug([this.config.context, chiderror].join(':'));
    cerror.log = console.error.bind(console); // eslint-disable-line

    return {
      debug: cdebug,
      info: cinfo,
      cerror,
    };
  }
}

export default () => new Logger();
// eslint-disable-next-line
export const getLogger = (ch) => new Logger().getContext(ch);
