const { addPath } = require('app-module-path');
addPath(`${__dirname}/../../..`);
addPath(`${__dirname}/../..`);

const config = require('config')();
const { Node } = require('spinal');
const node = new Node(config.spinal.url, {
  namespace: 'instructor'
});

const { Instructor, Course, Video } = require('models');

node.provide('getInstructors', (req, res) => {
  Instructor.find().select({ link: 0 })
  .skip(parseInt(req.query.skip)).limit(parseInt(req.query.limit))
  .then((instructors) => res.send(instructors));
});

node.provide('getInstructor', (req, res) => {
  Instructor.findById(req.params.id).select('-link -__v')
  .then((instructor) => res.send(instructor));
});

node.provide('getVideos', (req, res) => {
  Video.find({ instructor: req.params.id }).select('name image created_at num_views tags')
  .sort('-created_at')
  .skip(parseInt(req.query.skip)).limit(parseInt(req.query.limit))
  .then((videos) => res.send(videos));
});

node.provide('getCourses', (req, res) => {
  Course.find({ instructor: req.params.id }).select('name image tags num_videos')
  .skip(parseInt(req.query.skip)).limit(parseInt(req.query.limit))
  .then((courses) => res.send(courses));
});

node.start();
