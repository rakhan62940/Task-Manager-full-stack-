const { body } = require('express-validator');

const createTaskValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Task title is required')
    .isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('projectId')
    .notEmpty().withMessage('Project ID is required')
    .isInt().withMessage('Invalid project ID'),
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'done']).withMessage('Invalid status'),
  body('assignedToId')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 }).withMessage('Invalid assigned user ID'),
  body('dueDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage('Invalid due date'),
];

const updateTaskValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'done']).withMessage('Invalid status'),
  body('assignedToId')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 }).withMessage('Invalid assigned user ID'),
  body('dueDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage('Invalid due date'),
];

const updateStatusValidation = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['todo', 'in-progress', 'done']).withMessage('Invalid status'),
];

module.exports = { createTaskValidation, updateTaskValidation, updateStatusValidation };
