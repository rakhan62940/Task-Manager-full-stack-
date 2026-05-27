const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: { msg: 'Name is required' } },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: 'Invalid email format' },
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: { msg: 'Password is required' } },
  },
  role: {
    type: DataTypes.ENUM('admin', 'member'),
    defaultValue: 'member',
  },
}, {
  tableName: 'users',
  timestamps: true,
});

module.exports = { User };