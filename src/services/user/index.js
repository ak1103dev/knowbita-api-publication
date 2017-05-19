const { addPath } = require('app-module-path');
addPath(`${__dirname}/../../..`);
addPath(`${__dirname}/../..`);

const config = require('config')();

const { Node } = require('spinal');
const node = new Node(config.spinal.url, {
  namespace: 'user'
});

node.provide('getUser', (req, res) => {
  res.send(req.user);
});

node.start();
