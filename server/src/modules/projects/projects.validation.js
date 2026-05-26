const { body } = require('express-validator');

const createProjectValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Project title is required')
    .isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
];

const updateProjectValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
];

const memberValidation = [
  body('userId')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
];

module.exports = { createProjectValidation, updateProjectValidation, memberValidation };
