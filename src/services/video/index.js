const { addPath } = require('app-module-path');
addPath(`${__dirname}/../../..`);
addPath(`${__dirname}/../..`);

const config = require('config')();
const { Node } = require('spinal');
const node = new Node(config.spinal.url, {
  namespace: 'video'
});

// const winston = require('winston');
const Joi = require('joi');
const request = require('superagent');
const { Video, Log } = require('models');
const transformUpload = require('./transformUpload');
const { getEditVideoUrl, getImageName } = require('./transformUpdate');

const updateSchema = Joi.object().keys({
  videoTitle: Joi.string().required(),
  title: Joi.string().required(),
  description: Joi.string().required(),
  categories: Joi.array().unique().max(4).items(Joi.string().valid(
    '660505',
    '660507',
    '660511',
    '660510',
    '660509',
    '660512'
  )).required(),
  tags: Joi.string().required()
});

node.provide('getVideos', (req, res) => {
  Video.find({ has_password: false })
  .sort('-created_at')
  .skip(parseInt(req.query.skip)).limit(parseInt(req.query.limit))
  .deepPopulate('instructor', {
    populate: {
      'instructor': {
        select: 'name image'
      }
    }
  })
  .then((videos) => res.send(videos));
});

node.provide('getVideo', (req, res) => {
  Video.findById(req.params.id).select('-link -__v')
  .deepPopulate('instructor', {
    populate: {
      'instructor': {
        select: 'name image'
      }
    }
  })
  .then((video) => res.send(video));
});

node.provide('getVideoList', (req, res) => {
  const { id } = req.params;
  Video.findById(id)
  .then((video) => {
    return Video.find({ instructor: video.instructor, _id: { $ne: id } })
    .sort('-created_at').skip(0).limit(10)
    .select('name image instructor created_at num_views')
    .deepPopulate('instructor', {
      populate: {
        'instructor': {
          select: 'name'
        }
      }
    })
    .then((videos) => {
      if (videos.length < 10) {
        return Video.find({ instructor: { $ne: video.instructor } })
        .sort('-created_at').skip(0).limit(10 - videos.length)
        .select('name image instructor created_at num_views')
        .deepPopulate('instructor', {
          populate: {
            'instructor': {
              select: 'name'
            }
          }
        })
        .then((addedVideos) => videos.concat(addedVideos));
      }
      return videos;
    });
  })
  .then((list) => res.send(list));
});

node.provide('getVideoHistory', (req, res) => {
  Log.find({ namespace: 'History', title: 'See Video', username: req.user.username })
  .sort('-created_at')
  .select('data.video_id -_id')
  .then((data) => data.map((item) => item.data.video_id))
  .then((videoIds) =>
    Video.find({ _id: { $in: videoIds } })
    .skip(parseInt(req.query.skip)).limit(parseInt(req.query.limit))
    .deepPopulate('instructor', {
      populate: {
        'instructor': {
          select: 'name image'
        }
      }
    })
  )
  .then((videos) => res.send(videos));
});

node.provide('recordVideo', (req, res) => {
  const { cameraId } = req.params;
  const { cmd } = req.query;
  const cookies = `PHPSESSID=${req.cookies.PHPSESSID};sess_salt=${req.cookies.sess_salt}`;
  let data;
  if (cmd === 'start') {
    data = {
      start: 'start',
      camera_id: cameraId
    };
  } else if (cmd === 'stop') {
    data = {
      id: 1,
      stop: 'Stop'
    };
  }
  request.post(`https://knowbita.cpe.ku.ac.th/record.php?camera_id=${cameraId}`)
  .send(data)
  .set('Content-Type', 'application/x-www-form-urlencoded')
  .set('Cookie', cookies)
  .end((err, response) => {
    if (err) {
      return res.error(err);
    }
    const rawHtml = response.text;
    if (rawHtml.substring(0, 5) === 'false') {
      return res.error(new Error(rawHtml.split(',')[1]));
    }
    if (cmd === 'stop') {
      return transformUpload(rawHtml)
      .then((title) =>
        res.send({ success: true, message: `${cmd}ed record video`, title })
      );
    }
    return res.send({ success: true, message: `${cmd}ed record video` });
  });
});

node.provide('updateVideo', (req, res) => {
  const { videoTitle, title, description, tags, categories } = req.body;
  const cookies = `PHPSESSID=${req.cookies.PHPSESSID};sess_salt=${req.cookies.sess_salt}`;

  Joi.validate(req.body, updateSchema, (err, value) => {
    if (err) {
      res.error(new Error('Data is invalid.'));
    } else {
      request.get('https://knowbita.cpe.ku.ac.th/manage_videos.php').set('Cookie', cookies)
      .then((response) => getEditVideoUrl(response.text, videoTitle))
      .then((url) =>
        request.get(url).set('Cookie', cookies)
        .then((response) => getImageName(response.text))
        .then((imageName) =>
          request.post(url)
          .set('Cookie', cookies)
          .field('default_thumb', imageName)
          .field('title', title.trim())
          .field('description', description.trim())
          .field('category[]', categories)
          .field('tags', tags.trim())
          // .field('broadcast', 'unlisted')
          .field('broadcast', 'public')
          .field('video_password', '')
          .field('allow_comments', 'yes')
          .field('allow_embedding', 'yes')
          .field('doc_file[]', '', '')
          .field('doc_name[]', '')
          .field('update_video', 'submit')
          .then(() => res.send({ success: true, message: 'updated video' }))
        )
      )
      .catch((e) => res.error(e));
    }
  });
});

node.start();
