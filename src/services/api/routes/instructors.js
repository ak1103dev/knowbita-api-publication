const { Router } = require('express');
const router = Router();
const spinalMiddleware = require('middlewares/spinal');

router.get('/', spinalMiddleware('instructor.getInstructors'));
router.get('/:id/about/', spinalMiddleware('instructor.getInstructor'));
router.get('/:id/videos/', spinalMiddleware('instructor.getVideos'));
router.get('/:id/courses/', spinalMiddleware('instructor.getCourses'));

module.exports = router;
