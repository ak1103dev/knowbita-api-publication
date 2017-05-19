
const { addPath } = require('app-module-path');
addPath(`${__dirname}/../../..`);
addPath(`${__dirname}/../..`);

const config = require('config')();

const request = require('superagent');
const htmlparser = require('htmlparser');
const winston = require('winston');
const find = require('lodash/find');
const filter = require('lodash/filter');
const isEmpty = require('lodash/isEmpty');
// const range = require('lodash/range');

// const insNameToId = require('utils/instructorNameToId');
const { getVideoUri } = require('utils/transformData');
const { Video } = require('models');

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

const getVideos = ({ link, tags, instructor }) => {
  return request.get(link)
  .set('Cookie', config.knowbita.cookie)
  .then((response) => response.text)
  .then((rawHtml) => findVideoInfo(rawHtml, tags, instructor));
};

const saveVideos = (videos, courseId) => {
  return videos.map((video, index) => {
    return request.get(video.link)
    .set('Cookie', config.knowbita.cookie)
    .then((response) => response.text)
    .then((rawHtml) => getVideoUri(rawHtml))
    .then((data) => {
      if (isEmpty(data)) {
        video.has_password = true;
      }
      video.course_id = courseId;
      video.index = index;
      video.name = data.name || '';
      video.uri = data.uri || '';
      video.hd_uri = data.hd_uri || '';
      video.description = data.description || '';
      video.created_at = data.created_at || '';
      return Video.update({
        uri: video.uri,
        hd_uri: video.hd_uri,
        instructor: video.instructor
      }, video, { upsert: true });
    });
  });
};

module.exports = ({ id, link, tags, instructor }) => {
  return getVideos({ link, tags, instructor })
  .then((obj) => {
    if (obj.videos) {
      return saveVideos(obj.videos, id);
    } else if (obj.has_password) {
      return obj;
    }
  });
};
