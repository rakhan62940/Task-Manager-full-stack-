const { User } = require('./User');
const { Project } = require('./Project');
const { Task } = require('./Task');

// User -> Projects (creator)
User.hasMany(Project, { foreignKey: 'createdById', as: 'createdProjects' });
Project.belongsTo(User, { foreignKey: 'createdById', as: 'creator' });

// Project <-> User (members through junction table - no id needed)
Project.belongsToMany(User, { 
  through: 'project_members', 
  foreignKey: 'projectId', 
  otherKey: 'userId',
  as: 'members' 
});
User.belongsToMany(Project, { 
  through: 'project_members', 
  foreignKey: 'userId', 
  otherKey: 'projectId',
  as: 'projects' 
});

// Project -> Tasks
Project.hasMany(Task, { foreignKey: 'projectId', as: 'tasks' });
Task.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// Task -> Assigned User
Task.belongsTo(User, { foreignKey: 'assignedToId', as: 'assignedTo' });
User.hasMany(Task, { foreignKey: 'assignedToId', as: 'assignedTasks' });

// Task -> Creator User
Task.belongsTo(User, { foreignKey: 'createdById', as: 'creator' });
User.hasMany(Task, { foreignKey: 'createdById', as: 'createdTasks' });

module.exports = { User, Project, Task };
