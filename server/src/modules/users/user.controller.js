const userService = require('./user.service');

const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    res.json({ success: true, message: 'Users retrieved', data: users });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await userService.getMe(req.user.id);
    res.json({ success: true, message: 'Current user', data: user });
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json({ success: true, message: 'User retrieved', data: user });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, getMe, getUserById };
