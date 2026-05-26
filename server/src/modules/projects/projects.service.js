const { Project, User, Task } = require('../../models/associations');

const projectIncludes = [
  { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
  { model: User, as: 'members', attributes: ['id', 'name', 'email'] },
];

const getProjectIdsForUser = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) return [];
  const projects = await user.getProjects();
  return projects.map(project => project.id);
};

const ensureProjectVisible = async (project, userId, role) => {
  if (!project) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }

  if (role === 'admin') return;

  const projectIds = await getProjectIdsForUser(userId);
  if (!projectIds.includes(project.id)) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }
};

const getAll = async (userId, role) => {
  const where = {};
  if (role !== 'admin') {
    const projectIds = await getProjectIdsForUser(userId);
    if (projectIds.length === 0) return [];
    where.id = projectIds;
  }

  return Project.findAll({
    where,
    include: projectIncludes,
    order: [['createdAt', 'DESC']],
  });
};

const create = async ({ title, description, createdById }) => {
  const project = await Project.create({ title, description, createdById });
  await project.addMember(createdById);

  return Project.findByPk(project.id, { include: projectIncludes });
};

const getById = async (id, userId, role) => {
  const project = await Project.findByPk(id, {
    include: [
      ...projectIncludes,
      { model: Task, as: 'tasks', attributes: ['id', 'title', 'status', 'dueDate'] },
    ],
  });

  await ensureProjectVisible(project, userId, role);
  return project;
};

const update = async (id, { title, description }) => {
  const project = await Project.findByPk(id);
  if (!project) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }

  const updates = { title, description };
  Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);
  await project.update(updates);

  return Project.findByPk(id, { include: projectIncludes });
};

const remove = async (id) => {
  const project = await Project.findByPk(id);
  if (!project) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }

  await Task.destroy({ where: { projectId: id } });
  await project.setMembers([]);
  await project.destroy();
  return { message: 'Project deleted' };
};

const addMember = async (projectId, userId) => {
  const project = await Project.findByPk(projectId);
  if (!project) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }

  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const members = await project.getMembers();
  const isMember = members.some(member => member.id === Number(userId));
  if (isMember) {
    const err = new Error('User is already a member of this project');
    err.statusCode = 409;
    throw err;
  }

  await project.addMember(userId);
  return Project.findByPk(projectId, { include: projectIncludes });
};

const removeMember = async (projectId, userId) => {
  const project = await Project.findByPk(projectId);
  if (!project) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }

  if (project.createdById === Number(userId)) {
    const err = new Error('Cannot remove the project creator from members');
    err.statusCode = 400;
    throw err;
  }

  const members = await project.getMembers();
  const isMember = members.some(member => member.id === Number(userId));
  if (!isMember) {
    const err = new Error('User is not a member of this project');
    err.statusCode = 404;
    throw err;
  }

  await project.removeMember(userId);
  return Project.findByPk(projectId, { include: projectIncludes });
};

module.exports = { getAll, create, getById, update, remove, addMember, removeMember };
