const { addPath } = require('app-module-path');
addPath(`${__dirname}/../../..`);
addPath(`${__dirname}/../..`);

const htmlparser = require('htmlparser');
const winston = require('winston');

const find = require('lodash/find');
const filter = require('lodash/filter');

module.exports = (rawHtml) => {
  return new Promise((resolve) => {
    const handler = new htmlparser.DefaultHandler((error, dom) => {
      if (error) {
        winston.error('error', error);
      } else {
        const html = find(dom, { name: 'html' });
        const body = find(html.children, { name: 'body' });
        const content = find(body.children, { raw: 'div class="content"' });
        const container = find(content.children, { raw: 'div class="container"' });
        const script = find(container.children, { raw: 'script' });
        const data = script.children[0].data.split('\r\n');
        const recordUrl = filter(data, (item) => !!item.match(/record_url/g))[0].split(' ')[3];
        const l = recordUrl.length;
        const title = recordUrl.substring(l - 10, l - 6);
        resolve(title);
      }
    });
    const parser = new htmlparser.Parser(handler);
    parser.parseComplete(rawHtml);
  });
};
