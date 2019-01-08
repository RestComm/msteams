export default (app) => {
  app.use('/home', (req, res) => {
    res.status(200).send('Home page');
  });
  // app.use('/survey', users);
};
