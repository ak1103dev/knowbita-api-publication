const { addPath } = require('app-module-path');
addPath(`${__dirname}/../../..`);
addPath(`${__dirname}/../..`);

const request = require('superagent');
const htmlparser = require('htmlparser');
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const winston = require('winston');
const find = require('lodash/find');
const filter = require('lodash/filter');
const range = require('lodash/range');

const diffTimeToDateTime = require('utils/diffTimeToDateTime');
const { Instructor, Video } = require('models');

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

const findVideoUri = (rawHtml) => {
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
        const data = player.children[0].data.split('\r\n\t\t')[2].split(' ')[1];
        const uri = data.substring(1, data.length - 2);
        resolve(uri);
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
        // console.log(item.instructor);
        const instructor = new Instructor({
          name: item.instructor
        });
        instructor.save();
        item.instructor = instructor._id;
      } else {
        // console.log(ins._id);
        item.instructor = ins._id;
      }
    })
    .then(() => item);
  });
  return Promise.all(promises)
  .then((array) => array);
};

const getUri = (data) => {
  const promises = data.map((item) => {
    return request.get(item.link)
    .then((response) => response.text)
    .then((rawHtml) => findVideoUri(rawHtml))
    .then((uri) => (item.uri = uri))
    .then(() => item);
  });
  return Promise.all(promises)
  .then((array) => array);
};

const insertData = (data) => {
  console.log(data);
  return Video.create(data)
  .then(() => console.log('success'))
  .catch((e) => console.log('error', e));
};

module.exports = (node) => {
  node.provide('getVideos', (req, res) => {
    res.send({ message: 'start...' });
    range(6, 25).map((i) => {
      request.get(`https://knowbita.cpe.ku.ac.th/videos.php?page=${i}`)
      .then((response) => response.text)
      .then((rawHtml) => transformData(rawHtml))
      .then((data) => changeInsNameToId(data))
      .then((data) => getUri(data))
      .then((data) => insertData(data))
      // .then((data) => res.send(data))
      .catch((err) => res.error(err));
    });
  });
};
