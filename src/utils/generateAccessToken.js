const { addPath } = require('app-module-path');
addPath(`${__dirname}/../../..`);
addPath(`${__dirname}/../..`);

const randomstring = require('randomstring');
const { AccessToken } = require('models');

module.exports = (username) => {
  const token = randomstring.generate(32) + username;
  return new AccessToken({
    token,
    username
  }).save();
};
