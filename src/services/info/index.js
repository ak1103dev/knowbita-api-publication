const { addPath } = require('app-module-path');
addPath(`${__dirname}/../../..`);
addPath(`${__dirname}/../..`);

const config = require('config')();
const Joi = require('joi');
const { Log, Video, Course } = require('models');

const { Node } = require('spinal');
const node = new Node(config.spinal.url, {
  namespace: 'info'
});

const logSchema = Joi.object().keys({
  namespace: Joi.string().required(),
  title: Joi.string().required(),
  data: Joi.required()
});
const searchSchema = Joi.object().keys({
  word: Joi.string().required(),
  skip: Joi.optional(),
  limit: Joi.optional()
});

node.provide('postLog', (req, res) => {
  Joi.validate(req.body, logSchema, (err, value) => {
    if (err) {
      res.error(new Error('Data is invalid.'));
    } else {
      new Log({
        username: req.user.username,
        user_type: req.user.is_instructor ? 'instructor' : 'student',
        namespace: req.body.namespace,
        title: req.body.title,
        data: req.body.data,
        useragent: req.useragent,
        ip: req.ip
      }).save()
      .then(() => res.send({ success: true }))
      .catch((e) => res.error(e));
    }
  });
});

node.provide('search', (req, res) => {
  Joi.validate(req.query, searchSchema, (err, value) => {
    if (err) {
      res.send({ courses: [], videos: [] });
    } else {
      const { word } = req.query;
      const videoPromise =
        Video.find({ name: new RegExp(word, 'i') })
        .skip(parseInt(req.query.skip)).limit(parseInt(req.query.limit))
        .deepPopulate('instructor', {
          populate: {
            'instructor': {
              select: 'name image'
            }
          }
        });
      const coursePromise =
        Course.find({ name: new RegExp(word, 'i') })
        .select('name image tags instructor num_videos has_password')
        .deepPopulate('instructor', {
          populate: {
            instructor: {
              select: 'name image'
            }
          }
        });
      Promise.all([
        coursePromise,
        videoPromise
      ])
      .then(([courses, videos]) => res.send({ courses, videos }));
    }
  });
});

node.start();
