const { addPath } = require('app-module-path');
addPath(`${__dirname}/../..`);

const config = require('config')();
const mongoose = require('mongoose');

const Instructor = require('./instructor');
const Course = require('./course');
const Video = require('./video');
const User = require('./user');
const AccessToken = require('./access-token');
const Log = require('./log');

mongoose.Promise = global.Promise;
mongoose.connect(config.mongodb.url);

module.exports = {
  Instructor,
  Course,
  Video,
  User,
  AccessToken,
  Log
};
