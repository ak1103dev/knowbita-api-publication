const { Router } = require('express');
const router = Router();
const spinalMiddleware = require('middlewares/spinal');

router.post('/', spinalMiddleware('info.postLog'));

module.exports = router;
