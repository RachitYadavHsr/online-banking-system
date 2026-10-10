const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Matches Exp-4 ER Diagram: SERVICE_REQUESTS entity. Schema now, Phase 2 feature.
const ServiceRequest = sequelize.define('ServiceRequest', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  customerId: { type: DataTypes.INTEGER, allowNull: false },
  resolvedByUserId: { type: DataTypes.INTEGER, allowNull: true },
  requestType: {
    type: DataTypes.ENUM('ChequeBook', 'Statement', 'CardIssue', 'Complaint', 'Other'),
    allowNull: false,
  },
  description: { type: DataTypes.TEXT, allowNull: false },
  status: {
    type: DataTypes.ENUM('Open', 'In Progress', 'Resolved', 'Closed'),
    allowNull: false,
    defaultValue: 'Open',
  },
  resolutionNotes: { type: DataTypes.TEXT, allowNull: true },
  resolvedAt: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'service_requests',
});

module.exports = ServiceRequest;
