const { addPath } = require('app-module-path');
addPath(`${__dirname}/../../..`);
addPath(`${__dirname}/../..`);

const config = require('config')();
const Joi = require('joi');
const { login } = require('utils/accessData');
const generateAccessToken = require('utils/generateAccessToken');
const { User, AccessToken } = require('models');

const { Node } = require('spinal');
const node = new Node(config.spinal.url, {
  namespace: 'session'
});

const loginSchema = Joi.object().keys({
  username: Joi.string().alphanum().required(),
  password: Joi.string()
}).with('username', 'password');

node.provide('login', (req, res) => {
  Joi.validate(req.body, loginSchema, (err, value) => {
    if (err) {
      res.error(new Error('Username or password is wrong.'));
    } else {
      const { username, password } = value;
      login(username, password)
      .then((status) => {
        if (!status.loginSuccess) {
          throw new Error('Username or password is wrong.');
        }
        return generateAccessToken(username)
        .then((accessToken) => (status.accessToken = accessToken.token))
        .then(() => User.findOneAndUpdate({ username },
          { username, last_login_at: new Date() },
          { upsert: true }))
        .then(() => {
          res.send(status);
        });
      })
      .catch((e) => res.error(e));
    }
  });
});

node.provide('logout', (req, res) => {
  AccessToken.remove({ token: req.token })
  .then(() => res.send({ succes: true }))
  .catch((e) => res.error(e));
});

node.provide('logoutAll', (req, res) => {
  AccessToken.remove({ username: req.user.username })
  .then(() => res.send({ success: true }));
});

node.start();
