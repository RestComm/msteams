/* eslint-disable */

export default class AuthController {
  authentry = (req, res) => {
    console.log('====================================');
    console.log(req.body);
    console.log(req.params);
    console.log(req.query);
    console.log('====================================');
    res.status(200).send('Success');
  };
}
