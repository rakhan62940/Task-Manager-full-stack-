import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import User from './models/User.js';
import Project from './models/Project.js';
import Task from './models/Task.js';
import { auth } from './middleware/auth.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

app.get('/api/dashboard', auth, async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments();
    const todoTasks = await Task.countDocuments({ status: 'Todo' });
    const inProgressTasks = await Task.countDocuments({ status: 'InProgress' });
    const doneTasks = await Task.countDocuments({ status: 'Done' });
    const overdueTasks = await Task.countDocuments({ 
      dueDate: { $lt: new Date() }, 
      status: { $ne: 'Done' } 
    });
    const totalProjects = await Project.countDocuments();
    const totalUsers = await User.countDocuments();

    res.json({
      totalTasks,
      todoTasks,
      inProgressTasks,
      doneTasks,
      overdueTasks,
      totalProjects,
      totalUsers
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('Team Task Manager API running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));