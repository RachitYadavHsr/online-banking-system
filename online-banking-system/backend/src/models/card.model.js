const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Matches Exp-4 ER Diagram: CARDS entity. Schema now, Phase 2 feature.
const Card = sequelize.define('Card', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  accountId: { type: DataTypes.INTEGER, allowNull: false },
  cardNumberMasked: { type: DataTypes.STRING(20), allowNull: false },
  cardType: { type: DataTypes.ENUM('Debit', 'Credit'), allowNull: false },
  dailyLimit: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  expiryDate: { type: DataTypes.DATEONLY, allowNull: false },
  status: {
    type: DataTypes.ENUM('Active', 'Blocked', 'Reissue Requested'),
    allowNull: false,
    defaultValue: 'Active',
  },
}, {
  tableName: 'cards',
});

module.exports = Card;
