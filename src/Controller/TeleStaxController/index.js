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
    try {
      this.bot.sendMessage(message);
    } catch (error) {
      cerror(error.message);
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
