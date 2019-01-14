import { getLogger } from '../../utils';

const { debug, cerror } = getLogger('smsctrl');

export default class TeleStaxSMSController {
  constructor(bot, rabbitmq) {
    this.bot = bot;
    this.rabbitmq = rabbitmq;
  }

  receiveSMSCall = async (req, res) => {
    const { sender, receiver, message } = req.body;
    // try to push the message to the MS Team
    // if the pushing fails, then save the message to the queue
    if (!sender) {
      debug('NO Sender information. Request not processed');
      return res.status(403).send('Missing sender information');
    }

    try {
      if (message) {
        this.bot.sendMessage(message);
      }
    } catch (error) {
      cerror(error);
      // save the message to the queue
      await this.rabbitmq.pushToMq(
        JSON.stringify({
          sender,
          receiver,
          message,
        }),
      );
    }
    debug(`SENDER=${sender}, RCV=${receiver}, MSG=${message}`);

    res.status(200).send('Success');
  };
}
