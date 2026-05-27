const express = require('express');
const router = express.Router();
const tasksController = require('./tasks.controller');
const { createTaskValidation, updateTaskValidation, updateStatusValidation } = require('./tasks.validation');
const { authMiddleware } = require('../../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/', tasksController.getAll);
router.post('/', createTaskValidation, tasksController.create);
router.get('/:id', tasksController.getById);
router.put('/:id', updateTaskValidation, tasksController.update);
router.patch('/:id/status', updateStatusValidation, tasksController.updateStatus);
router.delete('/:id', tasksController.remove);

module.exports = router;
