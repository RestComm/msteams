/* eslint-disable no-param-reassign */
import { IntentDialog } from 'botbuilder';
import { DialogIds } from './dialogIds';
import { SendSMSDialog } from './SMSDialog';
import helpDialog from './HelpDialog';
import defaultDialog from './Default';

export default class RootDialog extends IntentDialog {
  constructor(bot) {
    super();
    this.bot = bot;
    this.onDefault((session) => {
      session.conversationData.currentDialogName = DialogIds.RootDialogId;
      // session.send("What??? I don't know what to do! - Root Dialog");
      session.beginDialog('greetings');
      session.endDialog();
    });
    bot.dialog(DialogIds.RootDialogId, this);
  }

  // Create the child dialogs and attach them to the bot
  createChildDialogs = () => {
    SendSMSDialog(this.bot);
    helpDialog(this.bot);
    defaultDialog(this.bot);
  };
}
