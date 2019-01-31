import { Router } from 'express';
import { AuthController } from '../Controller';

const route = new Router();
const authControler = new AuthController();

route
  .route('/sample')
  .get(authControler.authentry)
  .post(authControler.authentry);

module.exports = route;
