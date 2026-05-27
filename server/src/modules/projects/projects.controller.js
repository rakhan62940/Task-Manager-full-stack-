const { validationResult } = require('express-validator');
const projectsService = require('./projects.service');

const getAll = async (req, res, next) => {
  try {
    const data = await projectsService.getAll(req.user.id, req.user.role);
    res.json({ success: true, message: 'Projects retrieved', data });
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
    const data = await projectsService.create({
      ...req.body,
      createdById: req.user.id
    });
    res.status(201).json({ success: true, message: 'Project created', data });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await projectsService.getById(req.params.id, req.user.id, req.user.role);
    res.json({ success: true, message: 'Project retrieved', data });
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
    const data = await projectsService.update(req.params.id, req.body);
    res.json({ success: true, message: 'Project updated', data });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const data = await projectsService.remove(req.params.id);
    res.json({ success: true, message: data.message, data: null });
  } catch (err) {
    next(err);
  }
};

const addMember = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, data: null });
    }
    const { userId } = req.body;
    const data = await projectsService.addMember(req.params.id, userId);
    res.json({ success: true, message: 'Member added to project', data });
  } catch (err) {
    next(err);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const data = await projectsService.removeMember(req.params.id, req.params.userId);
    res.json({ success: true, message: 'Member removed from project', data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, create, getById, update, remove, addMember, removeMember };
