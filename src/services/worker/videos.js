const { addPath } = require('app-module-path');
addPath(`${__dirname}/../../..`);
addPath(`${__dirname}/../..`);

const request = require('superagent');
const htmlparser = require('htmlparser');
const winston = require('winston');
const find = require('lodash/find');
const filter = require('lodash/filter');
// const range = require('lodash/range');

const diffTimeToDateTime = require('utils/diffTimeToDateTime');
// const { Instructor, Video } = require('models');
const { Instructor } = require('models');
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
        const span9 = find(row.children, { raw: 'div class="span9"' });
        const videoPage = find(span9.children, { raw: 'div id="videos_page"' });
        const prepareData = filter(videoPage.children, (item) => item.name === 'div');
        const data = prepareData.map((item, i) => {
          const inner = item.children[1].children;
          const span3 = inner[1];
          const span6 = inner[3];
          const rinfo = span6.children[1];
          return {
            name: rinfo.children[1].children[0].children[0].data,
            description: rinfo.children[7].children[0].data,
            instructor: rinfo.children[5].children[0].children[1].children[0].data,
            tags: [span6.children[5].children[0].children[0].data],
            link: span3.children[1].attribs.href,
            image: span3.children[1].children[1].attribs.src,
            created_at: diffTimeToDateTime(rinfo.children[3].children[0].data),
            num_views: parseInt(span6.children[3].children[0].data),
            time_duration: span3.children[3].children[0].data
          };
        });
        resolve(data);
      }
    });
    const parser = new htmlparser.Parser(handler);
    parser.parseComplete(rawHtml);
  });
};

const changeInsNameToId = (data) => {
  const promises = data.map((item) => {
    return Instructor.findOne({ name: item.instructor })
    .then((ins) => {
      if (ins === null) {
        const instructor = new Instructor({
          name: item.instructor
        });
        instructor.save();
        item.instructor = instructor._id;
      } else {
        item.instructor = ins._id;
      }
    })
    .then(() => item);
  });
  return Promise.all(promises)
  .then((array) => array);
};

const getVideos = (page) =>
  request.get(`${config.knowbita.url}/videos.php?page=${page}`)
  .set('Cookie', config.knowbita.cookie)
  .then((response) => response.text)
  .then((rawHtml) => transformData(rawHtml));

module.exports = ({ page }) => {
  return getVideos(page)
  .then((data) => changeInsNameToId(data));
};
// module.exports = (node) => {
//   node.provide('getVideos', (req, res) => {
//     console.log('req', req);
//     const { page } = req.query;
//     getVideos(page)
//     .then((data) => changeInsNameToId(data))
//     .then((data) => res.send(data));
//   });
// };
