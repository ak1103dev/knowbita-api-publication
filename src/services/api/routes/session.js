const { Router } = require('express');
const router = Router();
const spinalMiddleware = require('middlewares/spinal');

router.post('/login', spinalMiddleware('session.login'));
router.delete('/logout', spinalMiddleware('session.logout'));
router.delete('/logout/all', spinalMiddleware('session.logoutAll'));

module.exports = router;
