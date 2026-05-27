const { Task, Project, User } = require('../../models/associations');

const VALID_STATUSES = ['todo', 'in-progress', 'done'];

const taskIncludes = [
  { model: Project, as: 'project', attributes: ['id', 'title'] },
  { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email'] },
  { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
];

const getProjectIdsForUser = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) return [];
  const projects = await user.getProjects();
  return projects.map(project => project.id);
};

const ensureProjectAccess = async (projectId, userId, role) => {
  if (role === 'admin') return;

  const projectIds = await getProjectIdsForUser(userId);
  if (!projectIds.includes(Number(projectId))) {
    const err = new Error('You do not have access to this project');
    err.statusCode = 403;
    throw err;
  }
};

const ensureTaskManageAccess = (task, userId, role) => {
  if (role === 'admin') return;

  if (task.createdById !== userId && task.assignedToId !== userId) {
    const err = new Error('You can only manage tasks you created or are assigned to');
    err.statusCode = 403;
    throw err;
  }
};

const ensureAssignedUserIsProjectMember = async (project, assignedToId) => {
  if (!assignedToId) return;

  const assignedUser = await User.findByPk(assignedToId);
  if (!assignedUser) {
    const err = new Error('Assigned user not found');
    err.statusCode = 404;
    throw err;
  }

  const members = await project.getMembers();
  const isMember = members.some(member => member.id === Number(assignedToId));
  if (!isMember) {
    const err = new Error('Assigned user must be a member of the project');
    err.statusCode = 400;
    throw err;
  }
};

const getAll = async (userId, role, filters = {}) => {
  const where = {};
  if (role !== 'admin') {
    const projectIds = await getProjectIdsForUser(userId);
    if (projectIds.length === 0) return [];
    where.projectId = projectIds;
  }
  if (filters.projectId) {
    where.projectId = filters.projectId;
  }
  if (filters.status) {
    where.status = filters.status;
  }

  return Task.findAll({
    where,
    include: taskIncludes,
    order: [['createdAt', 'DESC']],
  });
};

const getById = async (id, userId, role) => {
  const task = await Task.findByPk(id, { include: taskIncludes });
  if (!task) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }

  await ensureProjectAccess(task.projectId, userId, role);
  return task;
};

const create = async ({ title, description, projectId, assignedToId, dueDate, status }, userId, role) => {
  const project = await Project.findByPk(projectId);
  if (!project) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }

  await ensureProjectAccess(projectId, userId, role);
  await ensureAssignedUserIsProjectMember(project, assignedToId);

  const task = await Task.create({
    title,
    description,
    projectId,
    assignedToId: assignedToId || null,
    dueDate: dueDate || null,
    status: VALID_STATUSES.includes(status) ? status : 'todo',
    createdById: userId,
  });

  return getById(task.id, userId, role);
};

const update = async (id, payload, userId, role) => {
  const task = await getById(id, userId, role);
  ensureTaskManageAccess(task, userId, role);

  const project = await Project.findByPk(task.projectId);
  await ensureAssignedUserIsProjectMember(project, payload.assignedToId);

  const updates = {
    title: payload.title,
    description: payload.description,
    status: payload.status,
  };
  if (Object.prototype.hasOwnProperty.call(payload, 'assignedToId')) {
    updates.assignedToId = payload.assignedToId || null;
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'dueDate')) {
    updates.dueDate = payload.dueDate || null;
  }
  Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

  await task.update(updates);
  return getById(task.id, userId, role);
};

const updateStatus = async (id, status, userId, role) => {
  const task = await getById(id, userId, role);
  ensureTaskManageAccess(task, userId, role);

  await task.update({ status });
  return getById(task.id, userId, role);
};

const remove = async (id, userId, role) => {
  const task = await getById(id, userId, role);
  ensureTaskManageAccess(task, userId, role);

  await task.destroy();
  return { message: 'Task deleted' };
};

module.exports = { getAll, create, getById, update, updateStatus, remove };
