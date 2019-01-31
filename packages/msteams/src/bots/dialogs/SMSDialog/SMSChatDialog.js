/* eslint-disable no-param-reassign */

import { Prompts } from 'botbuilder';
import { TriggerDialog } from '../TriggerDialog';
import { DialogIds, DialogMatches } from '../dialogIds';
import { TeleStaxSMS } from '../../../Services';
import { getUserToken, getProfileAsync } from '../utils';
import { saveUserAddressToDb, getUserAddressFromDb } from './utils';

export default (bot) => {
  const checkUserProfile = async (session, _, next) => {
    session.sendTyping();
    const { userData } = session;
    if (userData && userData.senderNumber) {
      next();
    } else {
      const usdb = await getUserAddressFromDb(session);
      if (usdb) {
        session.userData.senderNumber = usdb.phoneNumber;
        next();
      } else {
        const userToken = getUserToken(session);
        if (userToken) {
          const profile = await getProfileAsync(userToken.accessToken);
          if (profile.businessPhones && profile.businessPhones.length > 0) {
            const [senderNumber] = profile.businessPhones;
            session.userData.senderNumber = senderNumber;
            // save the number to database
            try {
              await saveUserAddressToDb(session, senderNumber);
            } catch (error) {
              session.endDialog('Please Try again');
            }
            next();
          } else {
            session.endDialog(
              'Please contact the administrator to enable you to send SMS',
            );
          }
        } else {
          // session.send('Please sign in to AzureAD so I can access your profile.');
          session.beginDialog(DialogIds.init);
        }
      }
    }
  };

  const smDialog = (session, args, next) => {
    // check if the user has logged in
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
    const { senderNumber } = session.userData;
    if (!senderNumber) {
      session.endDialog('Unable to send SMS. Contact your administrator');
      return;
    }
    const { msg, destination } = result.response;
    if (msg && destination) {
      const sendSM = new TeleStaxSMS();
      sendSM
        .sendSMS(senderNumber, destination, msg)
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
    const { receiver, senderNumber } = session.userData;
    if (!senderNumber) {
      session.endDialog('Unable to send SMS. Contact your administrator');
    } else {
      const msg = result.response;
      const sendSM = new TeleStaxSMS();
      if (!receiver) {
        session.endDialog('Message could not be sent');
      } else {
        sendSM
          .sendSMS(senderNumber, receiver, msg)
          .then(() => {
            // session.send('Message delivered')
            session.endDialog('Message delivered');
          })
          .catch((err) => session.endDialog(err.message));
      }
    }
  };

  const diaAction = new TriggerDialog(bot, DialogIds.sms, DialogMatches.sms);
  diaAction.addActions([
    checkUserProfile,
    smDialog,
    sendSMMessage,
    messageToSend,
  ]);
};
