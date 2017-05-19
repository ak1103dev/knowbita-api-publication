const { Router } = require('express');
const router = Router();
const spinalMiddleware = require('middlewares/spinal');

router.get('/', spinalMiddleware('course.getCourses'));
router.get('/:id', spinalMiddleware('course.getCourse'));

module.exports = router;
