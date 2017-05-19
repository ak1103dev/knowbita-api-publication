const { addPath } = require('app-module-path');
addPath(`${__dirname}/../../..`);
addPath(`${__dirname}/../..`);

const request = require('superagent');
const htmlparser = require('htmlparser');
const winston = require('winston');
const find = require('lodash/find');
const filter = require('lodash/filter');
const isEmpty = require('lodash/isEmpty');

const insNameToId = require('utils/instructorNameToId');
const config = require('config')();

const transformData = (rawHtml) => {
  return new Promise((resolve) => {
    const handler = new htmlparser.DefaultHandler((error, dom) => {
      if (error) {
        winston.error('error', error);
      } else {
        const html = find(dom, { name: 'html' });
        const body = find(html.children, { name: 'body' });
        const content = find(body.children, { raw: 'div class="content service-three"' });
        const container = find(content.children, { raw: 'div class="container"' });
        const row = find(container.children, { raw: 'div class="row"' });
        const span12 = find(row.children, { raw: 'div class="span12"' });
        const resume = find(span12.children, { name: 'div' });
        const prepareData = filter(resume.children, (item) => item.name === 'div');
        prepareData.splice(0, 1);
        const data = prepareData.map((item, i) => {
          const inner = item.children[1].children;
          const span2 = inner[1].children[0].children[0];
          const span10 = inner[3].children[1];
          const tags = filter(span10.children[1].children,
            (item) => (item.name === 'a' && !isEmpty(item.attribs)))
            .map((item) => item.children[0].children[0].data);
          return {
            name: span10.children[3].children[0].children[0].data,
            description: span10.children[7].children[1].children[0].data
              .replace('\n\t\t\t\t   ', '').replace(/\\r\\n/g, ' '),
            instructor: span10.children[5].children[0].children[0].data,
            tags,
            image: span2.attribs.src,
            num_videos: parseInt(span10.children[1].children.slice(-1)[0].children[0].children[0].data),
            videos: [],
            link: span10.children[3].children[0].attribs.href
          };
        });
        resolve(data);
      }
    });
    const parser = new htmlparser.Parser(handler);
    parser.parseComplete(rawHtml);
  });
};

const getCourses = ({ page }) => {
  return request.get(`${config.knowbita.url}/courses.php?page=${page}`)
  .then((response) => response.text)
  .then((rawHtml) => transformData(rawHtml))
  .then((data) => insNameToId(data));
};
module.exports = getCourses;
