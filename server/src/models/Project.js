const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: { msg: 'Project title is required' } },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '',
  },
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'projects',
  timestamps: true,
});

module.exports = { Project };