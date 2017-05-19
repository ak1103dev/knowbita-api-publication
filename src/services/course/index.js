const { addPath } = require('app-module-path');
addPath(`${__dirname}/../../..`);
addPath(`${__dirname}/../..`);

const config = require('config')();
const { Node } = require('spinal');
const node = new Node(config.spinal.url, {
  namespace: 'course'
});

const { Course } = require('models');

node.provide('getCourses', (req, res) => {
  Course.find().select('name image tags instructor num_videos has_password')
  .skip(parseInt(req.query.skip)).limit(parseInt(req.query.limit))
  .deepPopulate('instructor', {
    populate: {
      instructor: {
        select: 'name image'
      }
    }
  })
  .then((courses) => res.send(courses));
});

node.provide('getCourse', (req, res) => {
  Course.findById(req.params.id).select('videos -_id')
  .deepPopulate('videos videos.instructor', {
    populate: {
      'videos': {
        select: 'name image instructor created_at num_views time_duration'
      },
      'videos.instructor': {
        select: 'name image'
      }
    }
  })
  .then((course) => res.send(course.videos));
});

node.start();
