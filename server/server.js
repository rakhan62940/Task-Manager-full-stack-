require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./config/db');
require('./src/models/associations');
const { errorMiddleware } = require('./src/middlewares/error.middleware');
const authRoute = require('./src/modules/auth/auth.route');
const usersRoute = require('./src/modules/users/user.route');
const projectsRoute = require('./src/modules/projects/projects.route');
const tasksRoute = require('./src/modules/tasks/tasks.route');
const { Task, Project, User } = require('./src/models/associations');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoute);
app.use('/api/users', usersRoute);
app.use('/api/projects', projectsRoute);
app.use('/api/tasks', tasksRoute);

// Dashboard endpoint
app.get('/api/dashboard', require('./src/middlewares/auth.middleware').authMiddleware, async (req, res, next) => {
  try {
    const { Op } = require('sequelize');
    const taskIncludes = [
      { model: Project, as: 'project', attributes: ['id', 'title'] },
      { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email'] },
    ];
    let projectFilter = {};
    
    // Non-admin users only see stats for their projects
    if (req.user.role !== 'admin') {
      const user = await User.findByPk(req.user.id);
      const userProjects = await user.getProjects();
      const projectIds = userProjects.map(p => p.id);
      if (projectIds.length === 0) {
        return res.json({
          success: true,
          message: 'Dashboard stats retrieved',
          data: { totalTasks: 0, todoTasks: 0, inProgressTasks: 0, doneTasks: 0, overdueTasks: 0, totalProjects: 0, totalUsers: await User.count(), tasks: [] }
        });
      }
      projectFilter = { projectId: projectIds };
    }

    const totalTasks = await Task.count({ where: projectFilter });
    const todoTasks = await Task.count({ where: { ...projectFilter, status: 'todo' } });
    const inProgressTasks = await Task.count({ where: { ...projectFilter, status: 'in-progress' } });
    const doneTasks = await Task.count({ where: { ...projectFilter, status: 'done' } });
    const overdueTasks = await Task.count({ 
      where: {
        ...projectFilter,
        dueDate: { [Op.lt]: new Date() },
        status: { [Op.ne]: 'done' }
      }
    });
    const totalProjects = req.user.role === 'admin' ? await Project.count() : projectFilter.projectId.length;
    const totalUsers = await User.count();
    const tasks = await Task.findAll({
      where: projectFilter,
      include: taskIncludes,
      order: [['createdAt', 'DESC']],
      limit: 20,
    });
    const tasksWithOverdue = tasks.map(t => {
      const task = t.toJSON();
      task.isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
      return task;
    });

    res.json({
      success: true,
      message: 'Dashboard stats retrieved',
      data: { totalTasks, todoTasks, inProgressTasks, doneTasks, overdueTasks, totalProjects, totalUsers, tasks: tasksWithOverdue }
    });
  } catch (err) {
    next(err);
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Team Task Manager API running', data: null });
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found`, data: null });
});

// Error middleware
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true }).then(() => {
  console.log('SQLite database connected');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Database connection error:', err);
});

module.exports = app;
