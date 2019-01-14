// import builder from 'botbuilder';
import { UniversalBot, Message } from 'botbuilder';
import { TeamsMessage } from 'botbuilder-teams';
import { getLogger } from '../utils';
import { TeleStaxSMS } from '../Services';

const { debug, cerror } = getLogger('bot');

export default class BotManager extends UniversalBot {
  constructor(connector, botSettings) {
    super(connector, botSettings);
    this.teleStaxSMS = new TeleStaxSMS();
    // this.on('conversationUpdate', this.getConversationUpdateHandler);
    this.dialog('/', this.rootDialog);
  }

  // getConversationUpdateHandler = (bot) => {
  //   debug(bot);
  // };

  rootDialog = async (session, args) => {
    this.saveAddress = session.message.address;
    this.session = session;
    console.log('====================================');
    console.log(session.message);
    console.log('====================================');
    const text = TeamsMessage.getTextWithoutMentions(session.message);
    // push it to rabbit mq.
    debug(text);
    // try to send the sms. if the sms fails then try saving it to the rabbitmq
    try {
      const { statusCode } = await this.teleStaxSMS.sendSMS(
        process.env.SENDER_NUMBER,
        process.env.RECEIVER_TEST_NUMBER,
        text,
      );
      debug(`SMS sent with status ${statusCode}`);
    } catch (error) {
      cerror(error.message);
      if (this.rabbitMq) {
        await this.rabbitMq.pushToMq(text);
      }
    }
  };

  /**
   *Send a message to the MS Team using the bot manager
   * @param {String} message The message to be sent to the MS Channel
   * @memberof BotManager
   */
  sendMessage = (message) => {
    const nmsg = new Message().address(this.saveAddress);
    nmsg.text(message);
    nmsg.textLocale('en-US');
    this.send(nmsg);
  };

  addQueue = (rabbitMq) => {
    this.rabbitMq = rabbitMq;
  };
}
