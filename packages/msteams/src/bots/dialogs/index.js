/* eslint-disable no-param-reassign */
import { IntentDialog } from 'botbuilder';
import { DialogIds } from './dialogIds';
import { SendSMSDialog } from './SMSDialog';
import helpDialog from './HelpDialog';
import defaultDialog from './Default';
import { getLogger } from '../../utils';
import { CouchDatabase } from '../../models';

const { cerror } = getLogger('bot');

const db = new CouchDatabase().useDb();

export default class RootDialog extends IntentDialog {
  constructor(bot) {
    super();
    this.bot = bot;
    // this.onDefault((session) => {
    //   session.conversationData.currentDialogName = DialogIds.RootDialogId;
    //   session.beginDialog('greetings');
    //   session.endDialog();
    // });
    this.onDefault((session) => this.defaultConversation(session));
    bot.dialog(DialogIds.RootDialogId, this);
  }

  // Create the child dialogs and attach them to the bot
  register = () => {
    SendSMSDialog(this.bot);
    helpDialog(this.bot);
    defaultDialog(this.bot);
  };

  getSenderNumber = async (teamId, tenant = {}, user = {}, saveAddress) => {
    try {
      const { id } = tenant;
      const docs = await db.get(teamId);
      let updatedb = false;
      const newdoc = Object.assign({}, docs, {
        updatedAt: new Date(),
      });
      if (!docs.saveAddress) {
        // save the address
        updatedb = true;
      }
      newdoc.saveAddress = saveAddress;
      if (!docs.tenantId && id) {
        // update the db by adding the tenantid
        newdoc.tenantId = id;
        updatedb = true;
      }
      const { users } = newdoc;
      if (users) {
        const isExistingUser = users.filter((ur) => ur.id === user.id);
        if (!isExistingUser) {
          updatedb = true;
          newdoc.users.push(user);
        }
      } else if (user.id) {
        updatedb = true;
        newdoc.users = [user];
      }
      // update the db
      if (updatedb) {
        await db.insert(newdoc);
      }

      return newdoc;
    } catch (error) {
      cerror(error.message);
      return null;
    }
  };

  defaultConversation = async (session) => {
    session.conversationData.currentDialogName = DialogIds.RootDialogId;
    // save address
    const saveAddress = session.message.address;
    // send a typing indicator
    session.sendTyping();

    const {
      sourceEvent: { teamsTeamId, tenant },
      address: { user },
    } = session.message;

    const doc = await this.getSenderNumber(
      teamsTeamId,
      tenant,
      user,
      saveAddress,
    );
    if (!doc) {
      session.endDialog(
        'Sorry, your profile does not permit sending messages to a phone. See your administrator.',
      );
      return;
    }
    if (!doc.phoneNumber) {
      session.endDialog(
        'Sorry, your profile does not permit sending messages to a phone. See your administrator',
      );
      return;
    }
    const { conversation } = session.message.address;
    const { text } = session.message;

    if (conversation && conversation.id) {
      const existingConv = await this.checkconversation(conversation.id);
      if (existingConv) {
        // send the message to the user directly.
        const { phoneNumber } = existingConv;
        try {
          await this.teleStaxSMS.sendSMS(doc.phoneNumber, phoneNumber, text);
          session.endDialog('Message Delivered');
        } catch (err) {
          session.endDialog('Failed to send message');
        }
        return;
      }
    }
    session.beginDialog('greetings');
    // session.endDialog();
  };

  checkconversation = async (id) => {
    try {
      return await db.get(id);
    } catch (error) {
      cerror(error.message);
    }
    return undefined;
  };
}
