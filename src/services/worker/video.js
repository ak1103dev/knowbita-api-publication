const { addPath } = require('app-module-path');
addPath(`${__dirname}/../../..`);
addPath(`${__dirname}/../..`);

const request = require('superagent');
const htmlparser = require('htmlparser');
const winston = require('winston');
const find = require('lodash/find');
// const filter = require('lodash/filter');
// const range = require('lodash/range');

// const diffTimeToDateTime = require('utils/diffTimeToDateTime');
// const { Instructor, Video } = require('models');
const config = require('config')();

const transformData = (rawHtml) => {
  return new Promise((resolve) => {
    const handler = new htmlparser.DefaultHandler((error, dom) => {
      if (error) {
        winston.error('error', error);
      } else {
        const html = find(dom, { name: 'html' });
        const body = find(html.children, { name: 'body' });
        const content = find(body.children, { raw: 'div class="content"' });
        const container = find(content.children, { raw: 'div class="container"' });
        const div = find(container.children, { raw: 'div' });
        const player = find(div.children, { raw: 'script type="text/javascript"' });
        const innerPlayer = player.children[0].data.split('\r\n\t\t');

        const preHD = innerPlayer[innerPlayer.length - 1].split('\r\n')[0].split('{')[1];
        const hdUri = preHD.substring(8, preHD.length - 4);

        const preSD = player.children[0].data.split('\r\n\t\t')[2].split(' ')[1];
        const sdUri = preSD.substring(1, preSD.length - 2);

        resolve({
          sd: sdUri,
          hd: hdUri
        });
      }
    });
    const parser = new htmlparser.Parser(handler);
    parser.parseComplete(rawHtml);
  });
};

const getVideo = (link) =>
  request.get(link)
  .set('Cookie', config.knowbita.cookie)
  .then((response) => response.text)
  .then((rawHtml) => transformData(rawHtml));

module.exports = ({ link }) => {
  return getVideo(link);
};

// module.exports = (node) => {
//   node.provide('getVideoUrl', (req, res) => {
//     const { link } = req.query;
//     getVideo(link)
//     .then((data) => res.send(data));
//   });
// };
