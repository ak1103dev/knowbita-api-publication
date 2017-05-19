const { addPath } = require('app-module-path');
addPath(`${__dirname}/../../..`);
addPath(`${__dirname}/../..`);

const config = require('config')();

const { Node } = require('spinal');
const node = new Node(config.spinal.url, {
  namespace: 'worker'
});

const { CronJob } = require('cron');
const winston = require('winston');
const isEmpty = require('lodash/isEmpty');
const range = require('lodash/range');

const { Video, Course } = require('models');
const getVideos = require('./videos');
const getVideoUrl = require('./video');
const getCourses = require('./courses');
const getCourse = require('./course');

const jobs = [
  // {
  //   cronTime: '00 * * * * *',
  //   onTick: () => range(1, 10).map((i) => console.log(i))
  // },
  {
    cronTime: '00 00 00 * * 0',
    onTick: () => range(1, 26).map((page) => node.call('saveVideos', { page }))
  },
  {
    cronTime: '00 00 01 * * 0',
    onTick: () => range(1, 7).map((page) => node.call('saveCourses', { page }))
  },
  {
    cronTime: '00 00 02 * * 0',
    onTick: () => range(1, 7).map((page) => node.call('saveVideosInCourse', { page }))
  }
];

jobs.map((job) =>
  new CronJob({
    cronTime: job.cronTime,
    onTick: job.onTick,
    start: true,
    timeZone: 'Asia/Bangkok'
  })
);

node.provide('saveVideos', (req, res) => {
  // const page = 1;
  const { page } = req;
  getVideos({ page })
  .then((data) => {
    return data.map((video, i) => {
      getVideoUrl({ link: video.link })
      .then((url) => {
        video.uri = url.sd;
        video.hd_uri = url.hd;
        return;
      })
      .then(() => {
        return Video.update({
          uri: video.uri,
          hd_uri: video.hd_uri,
          instructor: video.instructor
        }, video, { upsert: true });
      });
    });
  })
  .then(() => {
    winston.info(`saved videos in page ${page}`);
    res.send({ success: true, message: 'saved videos' });
  })
  .catch((e) => {
    winston.error(`saving videos in page ${page} is error`);
    res.error(e);
  });
});

node.provide('saveCourses', (req, res) => {
  // const page = 1;
  const { page } = req;
  getCourses({ page })
  .then((courses) => {
    return courses.map((course, i) => {
      return Course.update({
        name: course.name,
        instructor: course.instructor,
        link: course.link
      }, course, { upsert: true })
      .then(() => true);
    });
  })
  .then(() => {
    winston.info(`saved courses in page ${page}`);
    res.send({ success: true, message: 'saved courses' });
  })
  .catch((e) => {
    winston.error(`saving videos in page ${page} is error`);
    res.error(e);
  });
});

node.provide('saveVideosInCourse', (req, res) => {
  // const page = 0;
  const page = req.page - 1;
  const range = 10;
  Course.find().skip(page * 10).limit(range)
  .then((courses) => {
    return courses.map((course) => {
      return getCourse({
        id: course._id,
        link: course.link,
        tags: course.tags,
        instructor: course.instructor
      })
      .then(() =>
        Video.find({ course_id: course._id }).sort({ index: 1 })
        .then((videos) => {
          let hasPassword = false;
          if (isEmpty(videos)) {
            hasPassword = true;
          }
          return Course.update(
            { _id: course._id },
            { $set: { videos, has_password: hasPassword } }
          );
        })
      );
    });
  })
  .then(() => {
    winston.info('saved videos in course');
    res.send({ success: true, message: 'saved videos in course' });
  })
  .catch((e) => {
    winston.error(`saving videos in course is error`);
    res.error(e);
  });
});

node.start();
