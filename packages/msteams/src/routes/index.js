import { TeleStaxSMSController } from '../Controller';

class RouterClass {
  constructor(rabbitmq) {
    this.smsController = new TeleStaxSMSController(rabbitmq);
  }

  setup = (app) => {
    app.post('/receivesms', this.smsController.receiveSMSCall);
  };
}

export default RouterClass;
