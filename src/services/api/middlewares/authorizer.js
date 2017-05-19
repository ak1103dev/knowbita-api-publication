const { AccessToken, User } = require('../../../models');

module.exports = (req, res, next) => {
  let token;
  if (req.get('X-Access-Token')) {
    token = req.get('X-Access-Token');
  }
  if (token) {
    req.token = token;
    AccessToken.findOne({ token })
    .then((accessToken) => {
      if (accessToken) {
        return accessToken.username;
      }
      return null;
    })
    .then((username) => User.findOne({ username }).select('-__v'))
    .then((user) => (req.user = user))
    .then(() => next());
  } else {
    next();
  }
};
