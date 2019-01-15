import { getLogger } from '../../utils';

const { debug, cerror } = getLogger('smsctrl');

export default class TeleStaxSMSController {
  constructor(rabbitmq) {
    this.rabbitmq = rabbitmq;
  }

  receiveSMSCall = async (req, res) => {
    const { sender, receiver, message } = req.body;
    debug(`SENDER=${sender}, RCV=${receiver}, MSG=${message}`);

    if (!sender) {
      debug('NO Sender information. Request not processed');
      res.status(400).send('Missing sender information');
    } else {
      // save the message to rabbitmq first.
      try {
        await this.rabbitmq.pushToMq(
          JSON.stringify({
            sender,
            receiver,
            message,
          }),
        );
        res.status(200).send('Success');
      } catch (error) {
        cerror(error.message);
        res.status(500).send('Failed');
      }
    }
  };
}
