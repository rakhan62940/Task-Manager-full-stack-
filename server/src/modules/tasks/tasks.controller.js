const { validationResult } = require('express-validator');
const tasksService = require('./tasks.service');

const getAll = async (req, res, next) => {
  try {
    const { projectId, status } = req.query;
    const data = await tasksService.getAll(req.user.id, req.user.role, { projectId, status });
    res.json({ success: true, message: 'Tasks retrieved', data });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, data: null });
    }
    const data = await tasksService.create(req.body, req.user.id, req.user.role);
    res.status(201).json({ success: true, message: 'Task created', data });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await tasksService.getById(req.params.id, req.user.id, req.user.role);
    res.json({ success: true, message: 'Task retrieved', data });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, data: null });
    }
    const data = await tasksService.update(req.params.id, req.body, req.user.id, req.user.role);
    res.json({ success: true, message: 'Task updated', data });
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, data: null });
    }
    const data = await tasksService.updateStatus(req.params.id, req.body.status, req.user.id, req.user.role);
    res.json({ success: true, message: 'Task status updated', data });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const data = await tasksService.remove(req.params.id, req.user.id, req.user.role);
    res.json({ success: true, message: data.message, data: null });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, create, getById, update, updateStatus, remove };
