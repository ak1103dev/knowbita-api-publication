const instructorRouter = require('./instructors');
const videoRouter = require('./videos');
const courseRouter = require('./courses');
const sessionRouter = require('./session');
const logRouter = require('./logs');
const searchRouter = require('./search');
const userRouter = require('./users');

module.exports = (app) => {
  app.use('/instructors', instructorRouter);
  app.use('/videos', videoRouter);
  app.use('/courses', courseRouter);
  app.use('/session', sessionRouter);
  app.use('/logs', logRouter);
  app.use('/search', searchRouter);
  app.use('/users', userRouter);
};
