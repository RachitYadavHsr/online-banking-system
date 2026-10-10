const { Op } = require('sequelize');
const { Account, AccountHolder, Transaction, User } = require('../models');
const { getCustomerOrThrow } = require('../utils/getCustomer');
const { logActivity } = require('../utils/activityLogger');
const { AppError } = require('../middleware/errorHandler.middleware');

// F9: every account this customer holds, any role (Primary or Joint).
async function listAccounts(userId) {
  const customer = await getCustomerOrThrow(userId);
  const holdings = await AccountHolder.findAll({
    where: { customerId: customer.id },
    include: [{ model: Account }],
  });
  return holdings.map((h) => ({ ...h.Account.toJSON(), holderRole: h.holderRole }));
}

async function assertOwnership(userId, accountId) {
  const customer = await getCustomerOrThrow(userId);
  const holding = await AccountHolder.findOne({ where: { customerId: customer.id, accountId } });
  if (!holding) throw new AppError('Account not found or not linked to your profile.', 404);
  return customer;
}

async function getAccount(userId, accountId) {
  await assertOwnership(userId, accountId);
  const account = await Account.findByPk(accountId);
  if (!account) throw new AppError('Account not found.', 404);
  return account;
}

// F12: search/filter transaction history by date range and type.
async function getTransactions(userId, accountId, { from, to, type } = {}) {
  await assertOwnership(userId, accountId);
  const where = { sourceAccountId: accountId };
  if (type) where.transactionType = type;
  if (from || to) {
    where.initiatedAt = {};
    if (from) where.initiatedAt[Op.gte] = new Date(from);
    if (to) where.initiatedAt[Op.lte] = new Date(to);
  }
  return Transaction.findAll({ where, order: [['initiatedAt', 'DESC']] });
}

// F13: downloadable e-statement (CSV).
async function getStatementCsv(userId, accountId, opts) {
  const txns = await getTransactions(userId, accountId, opts);
  const header = 'Date,Type,Amount,Status,Reference\n';
  const rows = txns.map((t) =>
    [t.initiatedAt.toISOString(), t.transactionType, t.amount, t.status, t.referenceNumber || ''].join(',')
  );
  return header + rows.join('\n');
}

// F10 (read-only profile) + F14 (last login timestamp).
async function getProfile(userId) {
  const customer = await getCustomerOrThrow(userId);
  const user = await User.findByPk(userId, {
    attributes: ['id', 'username', 'email', 'phoneNumber', 'lastLoginAt', 'role'],
  });
  return { user, customer };
}

// F11: only contact details are editable — everything else stays read-only.
async function updateProfile(userId, updates) {
  const customer = await getCustomerOrThrow(userId);
  const user = await User.findByPk(userId);

  const allowedCustomerFields = ['addressStreet', 'addressCity', 'addressState', 'addressPincode'];
  const allowedUserFields = ['email', 'phoneNumber'];

  if (updates.email !== undefined) {
    const existing = await User.findOne({ where: { email: updates.email } });
    if (existing && existing.id !== user.id) throw new AppError('That email is already in use.', 400);
  }
  if (updates.phoneNumber !== undefined) {
    const existing = await User.findOne({ where: { phoneNumber: updates.phoneNumber } });
    if (existing && existing.id !== user.id) throw new AppError('That phone number is already in use.', 400);
  }

  for (const f of allowedCustomerFields) if (updates[f] !== undefined) customer[f] = updates[f];
  for (const f of allowedUserFields) if (updates[f] !== undefined) user[f] = updates[f];

  await customer.save();
  await user.save();
  await logActivity(userId, 'Profile contact details updated', 'Customer', customer.id);

  return {
    message: 'Profile updated.',
    customer,
    user: { id: user.id, email: user.email, phoneNumber: user.phoneNumber },
  };
}

module.exports = { listAccounts, getAccount, getTransactions, getStatementCsv, getProfile, updateProfile, assertOwnership };
