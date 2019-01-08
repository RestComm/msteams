import axios from 'axios';
import { getLogger } from '../utils';

const { cerror, debug } = getLogger('telestax');

export default class TeleStaxSMS {
  constructor() {
    this.appurl = process.env.RESTCOMM_SMS_URL;
    this.callbackurl = process.env.RESTCOMM_SMS_CALLBACK_URL;
  }

  sendSMS = async (originator, receipient, message) => {
    const body = {
      From: originator,
      To: receipient,
      Body: message,
      StatusCallback: this.callbackurl,
    };
    try {
      const config = {
        method: 'POST',
        url: this.appurl,
        data: body,
      };
      debug('%o', config);
      const { data } = await axios(config);
      debug('%o', data);
    } catch (error) {
      cerror(error.message);
    }
  };

  getSMS = async () => {
    try {
      const config = {
        method: 'GET',
        url: this.appurl,
      };
      const { data } = await axios(config);
      // send the data to the rabbitmq
      debug('%o', data);
    } catch (error) {
      cerror(error.message);
    }
  };
}
