/* eslint-disable no-param-reassign */

import { Prompts } from 'botbuilder';
import { TriggerDialog } from '../TriggerDialog';
import { DialogIds, DialogMatches } from '../dialogIds';
import { TeleStaxSMS } from '../../../Services';

export default (bot) => {
  const smDialog = (session, args, next) => {
    const { text } = session.message;
    const chText = text.trim().toLowerCase();
    if (chText === 'sms' || chText === 'send sms') {
      Prompts.number(session, 'Who are you sending the message to?');
    } else {
      // the message format is sms to:xxxxxxx message
      const pattern = /^((\+?\d+)|,)*/gi;
      const ntext = text.substring(3).trim();
      const redata = ntext.match(pattern);
      if (!redata) {
        Prompts.number(session, 'Who do you want to send the message to?');
      } else {
        const smsMessage = ntext.replace(redata[0], '').trim();
        const receiver = redata[0].split(/,/g);
        next({ response: { msg: smsMessage, destination: receiver[0] } });
      }
    }
  };
  const sendSMMessage = (session, result) => {
    const { msg, destination } = result.response;
    if (msg && destination) {
      const sendSM = new TeleStaxSMS();
      sendSM
        .sendSMS('12017018601', destination, msg)
        .then(() => {
          // session.send('Message delivered')
          session.endDialog('Message delivered');
        })
        .catch((err) => session.endDialog(err.message));
    } else {
      const receiver = result.response;
      session.userData.receiver = receiver;
      Prompts.text(session, 'Enter the message to send?');
    }
  };
  const messageToSend = (session, result) => {
    const { receiver } = session.userData;
    const msg = result.response;
    const sendSM = new TeleStaxSMS();
    if (!receiver) {
      session.endDialog('Message could not be sent');
    } else {
      sendSM
        .sendSMS('12017018601', receiver, msg)
        .then(() => {
          // session.send('Message delivered')
          session.endDialog('Message delivered');
        })
        .catch((err) => session.endDialog(err.message));
    }
  };

  const diaAction = new TriggerDialog(bot, DialogIds.sms, DialogMatches.sms);
  diaAction.addActions([smDialog, sendSMMessage, messageToSend]);
};
