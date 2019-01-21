import {
  TeamsMessage,
  AdaptiveCard,
  // AdaptiveCardBotBuilderAction,
} from 'botbuilder-teams';
import { TriggerDialog } from '../TriggerDialog';
import { DialogIds, DialogMatches } from '../dialogIds';

export default (bot) => {
  const botHelper = (session) => {
    // const { text } = session.message;
    const adaptcard = new AdaptiveCard(session);
    adaptcard.body([
      {
        type: 'TextBlock',
        size: 'Medium',
        weight: 'Bolder',
        text: 'Restcomm SMS Help',
      },
      {
        type: 'TextBlock',
        text:
          "To send a message to a phone user, say sms and the system will guide you through. You can also use a one time format which will send the message without the system asking you a lot of questions. The format should be 'sms <phone number> <Message>' without the quotes. The <phone number> should be replace with the recipient number and the <Message> should be the SMS message body.",
        wrap: true,
      },
    ]);

    adaptcard.actions([
      {
        type: 'Action.OpenUrl',
        title: 'Learn more',
        url: 'http://restcomm.com/',
      },
    ]);

    const msg = new TeamsMessage(session).addAttachment(
      adaptcard.toAttachment(),
    );
    session.send(msg);
    // session.send('To send a message the format should be');
    // session.send('sms to:+xxxxx <message>');
    session.endDialog();
  };
  const diaAction = new TriggerDialog(bot, DialogIds.help, DialogMatches.help);
  diaAction.addActions(botHelper);
};
