const { addPath } = require('app-module-path');
addPath(`${__dirname}/../../..`);
addPath(`${__dirname}/../..`);

const request = require('superagent');
const htmlparser = require('htmlparser');
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const winston = require('winston');
const find = require('lodash/find');
const filter = require('lodash/filter');

const { Instructor } = require('models');

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
        const aboutUs = find(container.children, { raw: 'div class="aboutus"' });
        const row = find(aboutUs.children, { raw: 'div class="row"' });
        const newRow = filter(row.children, (item) => item.name === 'div');
        const data = newRow.map((item, i) => {
          const left = item.children[1];
          const right = item.children[3];
          const other = right.children[0].children;
          const num = find(other, { raw: 'p' }).children;
          const place = find(other, { raw: 'p class="grey"' }).children;
          return {
            name: find(other, { name: 'h5' }).children[0].data,
            email: find(other, { name: 'small' }).children[0].data,
            image: left.children[0].children[0].children[1].children[0].attribs.src,
            num_videos: parseInt(num[0].children[0].data),
            num_courses: parseInt(num[2].children[0].data),
            department: place[0].data,
            faculty: place[2].data,
            link: left.children[0].children[0].attribs.href
          };
        });
        resolve(data);
      }
    });
    const parser = new htmlparser.Parser(handler);
    parser.parseComplete(rawHtml);
  });
};

const insertData = (data) => {
  return Instructor.create(data)
  .then(() => console.log('success'))
  .catch((e) => console.log('error', e));
};

module.exports = (node) => {
  node.provide('getInstructors', (req, res) => {
    const page1 = request.get('https://knowbita.cpe.ku.ac.th/channels.php')
    .then((response) => response.text)
    .then((rawHtml) => transformData(rawHtml));
    const page2 = request.get('https://knowbita.cpe.ku.ac.th/channels.php?page=2')
    .then((response) => response.text)
    .then((rawHtml) => transformData(rawHtml));

    Promise.all([page1, page2])
    .then((data) => [...data[0], ...data[1]])
    .then((data) => insertData(data))
    .then(() => res.send({ success: true }))
    .catch((err) => res.error(err));
  });
};
