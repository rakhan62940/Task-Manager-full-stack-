import express from 'express';
import Project from '../models/Project.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || title.length < 3) {
      return res.status(400).json({ msg: 'Title must be at least 3 characters' });
    }

    const newProject = new Project({
      title,
      description,
      createdBy: req.user.id,
      members: [req.user.id]
    });

    const savedProject = await newProject.save();
    res.json(savedProject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/members', auth, adminOnly, async (req, res) => {
  try {
    const { userId } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project.members.includes(userId)) {
      project.members.push(userId);
      await project.save();
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;