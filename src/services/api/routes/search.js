const { Router } = require('express');
const router = Router();
const spinalMiddleware = require('middlewares/spinal');

router.get('/', spinalMiddleware('info.search'));

module.exports = router;
