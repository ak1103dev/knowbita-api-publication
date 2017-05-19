const { addPath } = require('app-module-path');
addPath(`${__dirname}/../../..`);
addPath(`${__dirname}/../..`);

const htmlparser = require('htmlparser');
const winston = require('winston');

const find = require('lodash/find');
const filter = require('lodash/filter');

module.exports = {
  getEditVideoUrl: (rawHtml, videoTitle) => {
    return new Promise((resolve) => {
      const handler = new htmlparser.DefaultHandler((error, dom) => {
        if (error) {
          winston.error('error', error);
        } else {
          const html = find(dom, { name: 'html' });
          const body = find(html.children, { name: 'body' });
          const content = find(body.children, { raw: 'div class="content"' });
          const container = find(content.children, { raw: 'div class="container"' });
          const makePost = find(container.children, { raw: 'div class="row make-post"' });
          const span9 = find(makePost.children, { raw: 'div class="span9"' });
          const well = find(span9.children, { raw: 'div class="well"' });
          const form = find(well.children, { raw: 'form name="videos_manager" method="post" style="margin-bottom:0px;"' });
          const table = find(form.children, { name: 'table' });
          const tbody = find(table.children, { name: 'tbody' });
          // const tr = filter(tbody.children, (item) => item.name === 'tr');
          const tr = filter(tbody.children, (item) => item.name === 'tr' &&
            item.children[5].children[0].children[0].children[0].data === videoTitle)[0];
          const url = tr.children[5].children[6].children[1].children[3].attribs.href;
          const data = url;
          winston.info(data);
          resolve(data);
        }
      });
      const parser = new htmlparser.Parser(handler);
      parser.parseComplete(rawHtml);
    });
  },
  getImageName: (rawHtml) => {
    return new Promise((resolve) => {
      const handler = new htmlparser.DefaultHandler((error, dom) => {
        if (error) {
          winston.error('error', error);
        } else {
          const html = find(dom, { name: 'html' });
          const body = find(html.children, { name: 'body' });
          const content = find(body.children, { raw: 'div class="content"' });
          const container = find(content.children, { raw: 'div class="container"' });
          const row = find(container.children, { raw: 'div class="row"' });
          const span9 = find(row.children, { raw: 'div class="span9"' });
          const form = find(span9.children, { name: 'form', attribs: { name: 'edit_video' } });
          const imageName = form.children[3].children[1].children[1].children[7].attribs.value;

          const data = imageName;
          winston.info(data);
          resolve(data);
        }
      });
      const parser = new htmlparser.Parser(handler);
      parser.parseComplete(rawHtml);
    });
  }
};
