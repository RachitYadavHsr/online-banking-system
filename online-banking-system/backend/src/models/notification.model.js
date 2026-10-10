const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Matches Exp-4 ER Diagram: NOTIFICATIONS entity.
// Basic alert/OTP delivery infrastructure needed by Phase 1 (Auth, Transfer);
// the full preferences UI (opt in/out per category) is a Phase 2 feature.
const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  customerId: { type: DataTypes.INTEGER, allowNull: false },
  message: { type: DataTypes.STRING(255), allowNull: false },
  category: {
    type: DataTypes.ENUM('Transactional', 'Promotional', 'Security'),
    allowNull: false,
  },
  isRead: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  tableName: 'notifications',
});

module.exports = Notification;
