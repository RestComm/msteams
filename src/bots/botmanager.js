// import builder from 'botbuilder';
import { UniversalBot, Message, HeroCard } from 'botbuilder';
import { TeamsMessage } from 'botbuilder-teams';
import { getLogger, ensureArray } from '../utils';
import { TeleStaxSMS } from '../Services';
import { database } from '../models';

const { debug, cerror } = getLogger('bot');

export default class BotManager extends UniversalBot {
  constructor(connector, botSettings) {
    super(connector, botSettings);
    this.teleStaxSMS = new TeleStaxSMS();
    this.teamconnector = connector;
    this.dialog('/', this.rootDialog);
  }

  getSenderNumber = async (teamId, tenant = {}, user = {}, saveAddress) => {
    try {
      const { id } = tenant;
      const docs = await database.get(teamId);
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
        // update the database by adding the tenantid
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
      // update the database
      if (updatedb) {
        await database.insert(newdoc);
      }

      return newdoc;
    } catch (error) {
      cerror(error.message);
      return null;
    }
  };

  getAllMentioned = (entities) => {
    const arr = ensureArray(entities);
    return arr
      .filter((entity) => entity.type === 'mention')
      .map((entity) => entity.mentioned)
      .filter((entity) => {
        const regex = new RegExp(process.env.MICROSOFT_APP_ID, 'ig');
        const isbot = regex.test(entity.id);
        return !isbot;
      });
  };

  checkconversation = async (id) => {
    try {
      return await database.get(id);
    } catch (error) {
      cerror(error.message);
    }
    return undefined;
  };

  rootDialog = async (session) => {
    const saveAddress = session.message.address;

    // send a typing indicator
    session.sendTyping();

    // teamsChannelId: channel: team: tenant:
    const { teamsTeamId, tenant } = session.message.sourceEvent;

    const { user } = session.message.address;
    const doc = await this.getSenderNumber(
      teamsTeamId,
      tenant,
      user,
      saveAddress,
    );

    if (!doc) {
      session.send(
        'Please provide your RestComm number in the setting page. Thank you.',
      );
      return;
    }
    if (!doc.phoneNumber) {
      session.send(
        'The RestComm phone number is not valid. See Setting page for configuration',
      );
      return;
    }

    const text = TeamsMessage.getTextWithoutMentions(session.message);
    debug(text);
    // get the converstion id and check if the user has sent a message before;
    const { conversation } = session.message.address;
    if (conversation && conversation.id) {
      const existingConv = await this.checkconversation(conversation.id);
      if (existingConv) {
        // send the message to the user directly.
        const { phoneNumber } = existingConv;
        await this.teleStaxSMS.sendSMS(doc.phoneNumber, phoneNumber, text);
        return;
      }
    }

    // get all mentioned in the message
    const { entities } = session.message;
    const mentioned = this.getAllMentioned(entities);
    debug(mentioned);
    // ===== individual chat

    const pattern = /to:((\+?\d+)|,)*/gi;
    const redata = text.match(pattern);

    if (!redata) {
      session.send('No destination number provided');
      return;
    }
    const smsMessage = text.replace(redata[0], '').trim();
    const receiver = redata[0].split(/,/g);
    await Promise.all(
      receiver.map((smsto) => {
        const sendto = smsto.replace('to', '').replace(':', '');
        return this.teleStaxSMS.sendSMS(doc.phoneNumber, sendto, smsMessage);
      }),
    );

    // send a response card
  };

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

      const { docs } = await database.find(queryselector);

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
                  await database.insert(newconv, id);
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

  addQueue = (rabbitMq) => {
    this.rabbitMq = rabbitMq;
  };
}
