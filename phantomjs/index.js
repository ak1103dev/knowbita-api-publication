const path = require('path');
const phantomjs = require('phantomjs-prebuilt');
const spawn = require('child_process').spawn;
const binPath = phantomjs.path;

const winston = require('winston');

module.exports = (res, cookies) => {
  const childArgs = [
    path.join(__dirname, 'phantom.js'),
    cookies.PHPSESSID,
    cookies.sess_salt
  ];
  const child = spawn(binPath, childArgs);
  child.stdout.on('data', function out (data) {
    winston.info('stdout', data);
  });
  child.stderr.on('data', function err (data) {
    winston.error('stderr', data);
  });
  res.send({ success: true, message: 'uploaded video' });
};
