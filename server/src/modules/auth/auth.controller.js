const { validationResult } = require('express-validator');
const authService = require('./auth.service');

const signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: errors.array()[0].msg, 
        data: null 
      });
    }
    const data = await authService.signup(req.body);
    res.status(201).json({ success: true, message: 'Account created successfully', data });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: errors.array()[0].msg, 
        data: null 
      });
    }
    const data = await authService.login(req.body);
    res.json({ success: true, message: 'Login successful', data });
  } catch (err) {
    next(err);
  }
};

const findByEmail = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email query parameter required', data: null });
    }
    const data = await authService.findByEmail(email);
    res.json({ success: true, message: 'User found', data });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ success: false, message: 'User not found', data: null });
    }
    next(err);
  }
};

module.exports = { signup, login, findByEmail };