const express = require('express');
const router = express.Router();
const { getAllUsers, getMe, getUserById } = require('./user.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');
const { roleMiddleware } = require('../../middlewares/role.middleware');

router.use(authMiddleware);

router.get('/me', getMe);
router.get('/', roleMiddleware('admin'), getAllUsers);
router.get('/:id', roleMiddleware('admin'), getUserById);

module.exports = router;
