const { Router } = require('express');
const router = Router();
const spinalMiddleware = require('middlewares/spinal');
const { instructor } = require('utils/auth');
const phantom = require('../../../../phantomjs/');

router.get('/', spinalMiddleware('video.getVideos'));
router.get('/history', spinalMiddleware('video.getVideoHistory'));
router.get('/:id', spinalMiddleware('video.getVideo'));
router.get('/:id/list', spinalMiddleware('video.getVideoList'));
router.post('/recording/:cameraId', instructor, spinalMiddleware('video.recordVideo'));
router.post('/update', instructor, spinalMiddleware('video.updateVideo'));
router.post('/upload', instructor, (req, res) => {
  phantom(res, req.cookies);
});

module.exports = router;
