const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Matches Exp-4 ER Diagram: LOANS entity.
// Schema created now (Phase 1) so Phase 2 only needs to add routes/UI on
// top of an already-correct table — see the Exp-2 WBS phase plan.
const Loan = sequelize.define('Loan', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  accountId: { type: DataTypes.INTEGER, allowNull: false },
  approvedByUserId: { type: DataTypes.INTEGER, allowNull: true },
  loanType: { type: DataTypes.STRING(50), allowNull: false },
  principalAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  interestRate: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
  tenureMonths: { type: DataTypes.INTEGER, allowNull: false },
  emiAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
  outstandingBalance: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
  status: {
    type: DataTypes.ENUM('Applied', 'Approved', 'Rejected', 'Active', 'Closed'),
    allowNull: false,
    defaultValue: 'Applied',
  },
}, {
  tableName: 'loans',
});

module.exports = Loan;
