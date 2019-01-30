/* eslint-disable no-underscore-dangle */
import { Client } from '@microsoft/microsoft-graph-client';
import { getLogger } from '../utils';

const { debug } = getLogger('ms:graph');

class MsGraphClient {
  constructor(token) {
    if (!token || !token.trim()) {
      throw new Error('MsGraphClient: Invalid token received');
    }
    this._token = token;
    this.graphClient = Client.init({
      authProvider: (done) => {
        done(null, this._token);
      },
    });
  }

  /**
   * Collects information about the user in the bot.
   */
  getMe = async () => {
    debug('getting user information');
    return this.graphClient
      .api('/me')
      .get()
      .then((res) => res);
  };
}

exports.MsGraphClient = MsGraphClient;
