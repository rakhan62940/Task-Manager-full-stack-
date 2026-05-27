const express = require('express');
const router = express.Router();
const projectsController = require('./projects.controller');
const { createProjectValidation, updateProjectValidation, memberValidation } = require('./projects.validation');
const { authMiddleware } = require('../../middlewares/auth.middleware');
const { roleMiddleware } = require('../../middlewares/role.middleware');

router.use(authMiddleware);

router.get('/', projectsController.getAll);
router.post('/', roleMiddleware('admin'), createProjectValidation, projectsController.create);
router.get('/:id', projectsController.getById);
router.put('/:id', roleMiddleware('admin'), updateProjectValidation, projectsController.update);
router.delete('/:id', roleMiddleware('admin'), projectsController.remove);
router.post('/:id/members', roleMiddleware('admin'), memberValidation, projectsController.addMember);
router.delete('/:id/members/:userId', roleMiddleware('admin'), projectsController.removeMember);

module.exports = router;
