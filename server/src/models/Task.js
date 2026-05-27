const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: { msg: 'Task title is required' } },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '',
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'todo',
    validate: {
      isIn: {
        args: [['todo', 'in-progress', 'done']],
        msg: 'Status must be todo, in-progress, or done',
      },
    },
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  assignedToId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
}, {
  tableName: 'tasks',
  timestamps: true,
});

module.exports = { Task };
