const { addPath } = require('app-module-path');
addPath(`${__dirname}/../../..`);
addPath(`${__dirname}/../..`);

const request = require('superagent');
const htmlparser = require('htmlparser');
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const winston = require('winston');
const find = require('lodash/find');
const filter = require('lodash/filter');
const isEmpty = require('lodash/isEmpty');
const range = require('lodash/range');

const insNameToId = require('utils/instructorNameToId');
const { getVideoUri } = require('utils/transformData');
const { Video, Course } = require('models');

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

const findVideoInfo = (rawHtml, tags, instructor) => {
  return new Promise((resolve) => {
    const handler = new htmlparser.DefaultHandler((error, dom) => {
      if (error) {
        winston.error('error', error);
      } else {
        const html = find(dom, { name: 'html' });
        const body = find(html.children, { name: 'body' });
        const content = find(body.children, { raw: 'div class="content"' });
        const data = {};
        if (!isEmpty(content)) {
          const container = find(content.children, { raw: 'div class="container"' });
          const time = filter(container.children, (item) => (item.raw === 'div class="time"'))[0];
          const timatter = find(time.children, { raw: 'div class="timatter"' });
          const tab = find(timatter.children, { raw: 'div class="tab-pane active fade in" id="course_tab"' });
          const table = find(tab.children, { raw: 'table class="table table-striped"' });
          const tr = filter(table.children, (item) => item.name === 'tr');

          const arr = tr.map((item) => {
            const td = filter(item.children, (tag) => tag.name === 'td');
            const info = {};
            info.image = td[1].children[1].children[0].attribs.src;
            info.name = td[2].children[1].children ? td[2].children[1].children[0].data : '';
            info.link = td[1].children[1].attribs.href;
            info.time_duration = td[3].children[0].data;
            info.num_views = parseInt(td[4].children[0].data);
            info.is_course = true;
            info.instructor = instructor;
            info.tags = tags;
            return info;
            //   description: '',
            //   uri: videoData.substring(1, data.length - 2),
            //   created_at: ''
          });
          data.videos = arr;
        } else {
          data.has_password = true;
        }
        resolve(data);
      }
    });
    const parser = new htmlparser.Parser(handler);
    parser.parseComplete(rawHtml);
  });
};

const getVideos = (data) => {
  data.map((item) => {
    return request.get(item.link)
    .set('Cookie', '__utmz=131773845.1485065949.1.1.utmccn=(direct)|utmcsr=(direct)|utmcmd=(none); __utma=131773845.1659550618.1485065949.1485835649.1485841996.5; quick_list_box=show; sess_salt=19e02; PHPSESSID=co2gbr3e9cjvc32j9c0lvg7lp4; pageredir=https%3A%2F%2Fknowbita.cpe.ku.ac.th%2Fwatch_video.php%3Fplay_list%3D39; video_1449=watched')
    .then((response) => response.text)
    .then((rawHtml) => findVideoInfo(rawHtml, item.tags, item.instructor))
    .then((obj) => {
      let promise;
      if (obj.videos) {
        // console.log('vdo', obj.videos);
        promise = Video.create(obj.videos)
        .then(() => console.log('insert vdo'));
      } else {
        promise = Promise.resolve({});
      }
      if (obj.has_password) {
        item.has_password = obj.has_password;
      }
      const index = item.link.split('=')[1];
      // console.log(index);
      return promise
      .then(() =>
        Video.find({ link: new RegExp(`=${index}$`) })
      )
      .then((videos) => videos.map((video) => video._id));
      // .then((videos) => console.log(videos));
    })
    .then((videos) => (item.videos = videos))
    .then(() => {
      return new Course(item).save()
      .then(() => console.log('insert course'));
    });
  });
  return data;
};

module.exports = (node) => {
  node.provide('getCourses', (req, res) => {
    res.send('start collect courses ...');
    range(6, 7).map((i) => {
      request.get(`https://knowbita.cpe.ku.ac.th/courses.php?page=${i}`)
      .then((response) => response.text)
      .then((rawHtml) => transformData(rawHtml))
      .then((data) => insNameToId(data))
      .then((data) => getVideos(data))
      .catch((err) => {
        winston.error('error', err);
        // res.error(err);
      });
    });
  });

  node.provide('getVideoUris', (req, res) => {
    res.send('start get uri ...');
    Video.find({ uri: { $exists: false }, has_password: false }).select('link').limit(100)
    .then((videos) => {
      videos.map((video) => {
        request.get(video.link)
        .set('Cookie', '__utmz=131773845.1485065949.1.1.utmccn=(direct)|utmcsr=(direct)|utmcmd=(none); __utma=131773845.1659550618.1485065949.1485835649.1485841996.5; quick_list_box=show; sess_salt=19e02; PHPSESSID=co2gbr3e9cjvc32j9c0lvg7lp4; pageredir=https%3A%2F%2Fknowbita.cpe.ku.ac.th%2Fwatch_video.php%3Fplay_list%3D39; video_1449=watched')
        .then((response) => response.text)
        .then((rawHtml) => getVideoUri(rawHtml))
        // .then((data) => console.log(video, data));
        .then((data) => Video.update({
          _id: video._id
        }, {
          $set: data
        }))
        .then(() => console.log({ success: true }));
      });
    });
  });

  node.provide('getFirstName', (req, res) => {
    res.send('start get name');
    Video.find({ name: '' }).select('link')
    .then((videos) => {
      videos.map((video) => {
        request.get(video.link)
        .set('Cookie', '__utmz=131773845.1485065949.1.1.utmccn=(direct)|utmcsr=(direct)|utmcmd=(none); __utma=131773845.1659550618.1485065949.1485835649.1485841996.5; quick_list_box=show; sess_salt=19e02; PHPSESSID=co2gbr3e9cjvc32j9c0lvg7lp4; pageredir=https%3A%2F%2Fknowbita.cpe.ku.ac.th%2Fwatch_video.php%3Fplay_list%3D39; video_1449=watched')
        .then((response) => response.text)
        .then((rawHtml) => getVideoUri(rawHtml))
        // .then((data) => console.log(data));
        .then((data) =>
          Video.update({
            _id: video._id
          }, {
            $set: data
          })
        )
        .then(() => console.log({ success: true }));
      });
    });
  });
};
