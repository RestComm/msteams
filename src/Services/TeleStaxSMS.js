import request from 'request';
import { EventEmitter } from 'events';
import dayjs from 'dayjs';
import { getLogger } from '../utils';

const { cerror, debug } = getLogger('telestax');

export default class TeleStaxSMS extends EventEmitter {
  constructor() {
    super();
    const accountSid = process.env.RESTCOMM_ACCOUNT_ID;
    const authtoken = process.env.RESTCOMM_AUTH_TOKEN;
    // this.username = accountSid;
    // this.password = authtoken;
    this.appurl = `${process.env.RESTCOMM_SMS_URL || 'http://127.0.0.1'}`
      .replace(/<accountSid>/g, accountSid)
      .replace(/<authToken>/g, authtoken);
    this.callbackurl = process.env.RESTCOMM_SMS_CALLBACK_URL;
    // this.timerInterval = setInterval(() => {
    //   this.getSMS();
    // }, process.env.RESTCOMM_SMS_CHECK_TIMER_INTERVAL || 1000);
  }

  // clearTimer = () => {
  //   clearInterval(this.timerInterval);
  // };

  sendSMS = async (originator, receipient, message) => {
    const mbody = {
      From: originator,
      To: receipient,
      Body: message,
      // StatusCallback: this.callbackurl,
    };
    return new Promise((resolve, reject) => {
      request.post(this.appurl, { form: mbody }, (err, response, body) => {
        if (err) {
          reject(err);
        } else {
          // debug('%o',body);
          resolve({
            data: body,
            statusCode: (response && response.statusCode) || '500',
          });
        }
      });
    });
  };

  // get the sms filter by dates
  getSMS = async () => {
    const fromdate = dayjs()
      .subtract(1, 'day')
      .format('YYYY-MM-DDTHH:mm:ss');

    const todate = dayjs().format('YYYY-MM-DDTHH:mm:ss');

    const config = {
      method: 'GET',
      uri: this.appurl,
      qs: {
        StartTime: fromdate,
        EndTime: todate,
      },
    };
    request(config, (err, response, body) => {
      if (err) {
        cerror(err.message);
      } else {
        debug('%o', response);
        this.emit('sms', body);
      }
    });
  };
}
