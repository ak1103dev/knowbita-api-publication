const config = require('config')();
const winston = require('winston');
const pick = require('lodash/pick');

const { Node } = require('spinal');
const node = new Node(config.spinal.url, {
  namespace: 'api'
});

module.exports = (path) => (req, res) => {
  const reqObj = pick(req, ['body', 'params', 'query', 'useragent', 'url', 'ip', 'user', 'token', 'cookies']);
  const callOptions = { timeout: 60000 };
  node.call(path, reqObj, callOptions, (err, data) => {
    if (err) {
      const error = {};
      error.message = err.message;
      winston.error(path, err);
      res.status(500).send(error);
      return;
    }
    res.send(data);
    return;
  });
};

node.start();
