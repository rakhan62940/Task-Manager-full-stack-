const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { signupValidation, loginValidation } = require('./auth.validation');
const { authMiddleware } = require('../../middlewares/auth.middleware');

router.post('/signup', signupValidation, authController.signup);
router.post('/login', loginValidation, authController.login);
router.get('/users', authMiddleware, authController.findByEmail);

module.exports = router;