import { TeleStaxSMSController } from '../Controller';
// import authRoute from './auth';

class RouterClass {
  constructor(rabbitmq) {
    this.smsController = new TeleStaxSMSController(rabbitmq);
  }

  setup = (app) => {
    app.post('/receivesms', this.smsController.receiveSMSCall);
    // app.use('/auth', authRoute);
  };
}

export default RouterClass;
