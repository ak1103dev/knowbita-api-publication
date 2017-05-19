const htmlparser = require('htmlparser');
const winston = require('winston');
const find = require('lodash/find');
const isEmpty = require('lodash/isEmpty');
const filter = require('lodash/filter');
const diffTimeToDateTime = require('./diffTimeToDateTime');

module.exports = {
  getVideoUri: (rawHtml) => {
    return new Promise((resolve) => {
      const handler = new htmlparser.DefaultHandler((error, dom) => {
        if (error) {
          winston.error('error', error);
        } else {
          const html = find(dom, { name: 'html' });
          const body = find(html.children, { name: 'body' });
          const content = find(body.children, { raw: 'div class="content"' });
          let obj;
          if (!isEmpty(content)) {
            const container = find(content.children, { raw: 'div class="container"' });
            const h3 = find(container.children, { name: 'h3' });
            const name = h3.children[0].data;

            const time = find(container.children, { raw: 'div class="time" style="padding-top:20px"' });
            const timatter = find(time.children, { raw: 'div class="timatter" style="min-height:120px;padding-top:10px;"' });
            const description = timatter.children[timatter.children.length - 1].data
            .replace(/\r\n\t\t|\r|\t|\n/g, '');

            const tmeta = find(timatter.children, { raw: 'div class="tmeta"' });
            const timeFromNow = filter(tmeta.children, (item) => item.type === 'text')[3]
            .data.replace(/\r\n\t\t\t|&mdash;/, '').trim();
            const createdAt = diffTimeToDateTime(timeFromNow);

            const div = find(container.children, { raw: 'div' });
            const player = find(div.children, { raw: 'script type="text/javascript"' });
            const innerPlayer = player.children[0].data.split('\r\n\t\t');

            const preHdUri = innerPlayer[innerPlayer.length - 1].split(' ')[3];
            const hdUri = preHdUri.substring(1, preHdUri.length - 1);

            const preUri = innerPlayer[2].split(' ')[1];
            const uri = preUri.substring(1, preUri.length - 2);
            obj = {
              name,
              uri,
              hd_uri: hdUri,
              description,
              created_at: createdAt
            };
          } else {
            obj = {};
          }
          resolve(obj);
        }
      });
      const parser = new htmlparser.Parser(handler);
      parser.parseComplete(rawHtml);
    });
  }
};
