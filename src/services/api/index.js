const { addPath } = require('app-module-path');
addPath(`${__dirname}/../../../`);
addPath(`${__dirname}/../../`);
addPath(__dirname);

const config = require('config')();
const express = require('express');
const morgan = require('morgan');
const compression = require('compression');
const winston = require('winston');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const useragent = require('express-useragent');
const routes = require('./routes');
const authorizer = require('./middlewares/authorizer');
const port = process.env.PORT || config.api.port;

const app = express();
app.use(useragent.express());
if (process.env.NODE_ENV === 'dev') {
  app.use(morgan('dev'));
} else {
  app.use(compression());
}
app.use(bodyParser.json());
app.use(cookieParser());
app.use(authorizer);
routes(app);
app.listen(port, () => {
  winston.info('listen on port', port);
});
