import { Prompts } from 'botbuilder';
import { TriggerDialog } from './TriggerDialog';
import { DialogIds, DialogMatches } from './dialogIds';
import { TeleStaxSMS } from '../../Services';

export default (bot) => {
  const smDialog = (session, args, next) => {
    console.log('====================================');
    console.log(session.message);
    console.log('====================================');
    const { text } = session.message;
    if (text.trim().toLowerCase() === 'sms') {
      Prompts.text(session, 'Who are you sending the message to?');
    } else {
      // the message format is sms to:xxxxxxx message
      const pattern = /^((\+?\d+)|,)*/gi;
      const ntext = text.substring(3).trim();
      const redata = ntext.match(pattern);
      if (!redata) {
        Prompts.text(session, 'Who do you want to send the message to?');
      } else {
        const smsMessage = ntext.replace(redata[0], '').trim();
        const receiver = redata[0].split(/,/g);
        next({ response: { msg: smsMessage, destination: receiver[0] } });
      }
    }
  };
  const sendSMMessage = (session, result) => {
    const { msg, destination } = result.response;
    if (!destination) {
      session.endDialog('Destination number not found');
    } else {
      const sendSM = new TeleStaxSMS();
      sendSM
        .sendSMS('12017018601', destination, msg)
        .then(() => {
          // session.send('Message delivered')
          session.endDialog('Message delivered');
        })
        .catch((err) => session.endDialog(err.message));
    }
  };
  const diaAction = new TriggerDialog(bot, DialogIds.sms, DialogMatches.sms);
  diaAction.addActions([smDialog, sendSMMessage]);
};
