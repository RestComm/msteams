/* eslint-disable no-param-reassign */
import { IntentDialog } from 'botbuilder';
import sendSMSDialog from './SendSMSDialog';
import { DialogIds } from './dialogIds';
import helpDialog from './HelpDialog';

export default class RootDialog extends IntentDialog {
  constructor(bot) {
    super();
    this.bot = bot;
    this.onDefault((session) => {
      session.conversationData.currentDialogName = DialogIds.RootDialogId;
      session.send("What??? I don't know what to do! - Root Dialog");
    });
    bot.dialog(DialogIds.RootDialogId, this);
  }

  // Create the child dialogs and attach them to the bot
  createChildDialogs = () => {
    sendSMSDialog(this.bot);
    helpDialog(this.bot);
  };
}
