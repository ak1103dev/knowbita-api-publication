const { Router } = require('express');
const router = Router();
const spinalMiddleware = require('middlewares/spinal');

router.get('/me', spinalMiddleware('user.getUser'));

module.exports = router;
