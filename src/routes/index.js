import { TeleStaxSMSController } from '../Controller';

class RouterClass {
  constructor(bot, rabbitmq) {
    this.smsController = new TeleStaxSMSController(bot, rabbitmq);
  }

  setup = (app) => {
    app.post('/receivesms', this.smsController.receiveSMSCall);
  };
}

export default RouterClass;
