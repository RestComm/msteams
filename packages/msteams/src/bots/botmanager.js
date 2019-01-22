// import builder from 'botbuilder';
import { UniversalBot, Message, HeroCard } from 'botbuilder';
import { TeamsMessage, StripBotAtMentions } from 'botbuilder-teams';
import { getLogger } from '../utils';
import RootDialog from './dialogs';
import { CouchDatabase } from '../models';

const { debug, cerror } = getLogger('bot');

export default class BotManager extends UniversalBot {
  constructor(_connector, botSettings) {
    super(_connector, botSettings);
    this.teamconnector = _connector;
    new RootDialog(this).register();

    this.use(new StripBotAtMentions());

    this.on('conversationUpdate', (msg) => {
      debug('%o', msg);
      const event = TeamsMessage.getConversationUpdateData(msg);
      debug('event');
      debug(event);
    });
    this.database = new CouchDatabase().useDb();
  }

  /**
   *Send a message to the MS Team using the bot manager
   * @param {String} message The message to be sent to the MS Channel
   * @memberof BotManager
   */
  sendMessage = async (message, sender, receiver) => {
    // check if the receiver is in the database
    try {
      const queryselector = {
        selector: {
          phoneNumber: {
            $eq: receiver,
          },
        },
      };

      const { docs } = await this.database.find(queryselector);

      if (docs.length > 0) {
        const mdoc = docs[0];
        // get the save address
        if (mdoc.saveAddress) {
          const nmsg = new Message().address(mdoc.saveAddress);
          nmsg.addAttachment(this.adaptiveCard(message, sender));
          // nmsg.text(message);
          nmsg.textLocale('en-US');
          // this.send(nmsg);
          this.teamconnector.startReplyChain(
            mdoc.saveAddress.serviceUrl,
            mdoc.channelId,
            nmsg,
            async (err, addr) => {
              if (err) {
                cerror(err);
                // this.endDialog('There is some error');
              } else {
                debug('%o', addr);
                try {
                  const { id } = addr.conversation;
                  const newconv = Object.assign({}, addr, {
                    phoneNumber: sender,
                    createdAt: new Date(),
                  });
                  await this.database.insert(newconv, id);
                } catch (error) {
                  cerror(error.message);
                }
              }
            },
          );

          return {
            status: true,
            message: 'success',
          };
        }
      }
      return {
        status: false,
        message: 'Unknown error',
      };
    } catch (error) {
      cerror(error.message);
      return {
        status: false,
        message: error.message,
      };
    }
  };

  adaptiveCard = (message, from) => {
    const thnail = new HeroCard().subtitle(`From: ${from}`).text(message);
    return thnail.toAttachment();
  };
}
