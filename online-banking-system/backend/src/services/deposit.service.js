const { Account, Deposit, AccountHolder } = require('../models');
const { getCustomerOrThrow } = require('../utils/getCustomer');
const { logActivity } = require('../utils/activityLogger');
const { AppError } = require('../middleware/errorHandler.middleware');

// Resolves SRS Appendix C, TBD-1: "Exact interest-rate table for Fixed and
// Recurring Deposits by tenure band." Simple tenure bands, FD paying more
// than RD (both realistic and consistent with typical retail-banking rate
// structures).
function interestRateFor(depositType, tenureMonths) {
  const table = depositType === 'FD'
    ? [[12, 5.5], [24, 6.5], [Infinity, 7.0]]
    : [[12, 5.0], [24, 6.0], [Infinity, 6.5]];
  const band = table.find(([maxMonths]) => tenureMonths <= maxMonths);
  return band[1];
}

function computeMaturity(principal, rate, tenureMonths) {
  // Simple interest, consistent with the formula already used in seed.js.
  return +(principal * (1 + (rate / 100) * (tenureMonths / 12))).toFixed(2);
}

// SRS F34/F35/F36: open a new FD or RD.
async function open(userId, data) {
  const customer = await getCustomerOrThrow(userId);
  const { accountId, depositType, principalAmount, tenureMonths } = data;

  if (!accountId || !depositType || !principalAmount || !tenureMonths) {
    throw new AppError('accountId, depositType, principalAmount, and tenureMonths are required.', 400);
  }
  if (!['FD', 'RD'].includes(depositType)) throw new AppError('depositType must be FD or RD.', 400);
  const principal = parseFloat(principalAmount);
  const tenure = parseInt(tenureMonths, 10);
  if (!(principal > 0)) throw new AppError('principalAmount must be positive.', 400);
  if (!(tenure > 0)) throw new AppError('tenureMonths must be positive.', 400);

  const holding = await AccountHolder.findOne({ where: { customerId: customer.id, accountId } });
  if (!holding) throw new AppError('Account not found or not linked to your profile.', 404);
  const account = await Account.findByPk(accountId);
  if (account.status !== 'Active') throw new AppError('Account is not active.', 400);
  if (parseFloat(account.balance) < principal) throw new AppError('Insufficient balance to open this deposit.', 400);

  const interestRate = interestRateFor(depositType, tenure);
  const openedAt = new Date();
  const maturityDate = new Date(openedAt);
  maturityDate.setMonth(maturityDate.getMonth() + tenure);
  const maturityAmount = computeMaturity(principal, interestRate, tenure);

  account.balance = parseFloat(account.balance) - principal;
  await account.save();

  const deposit = await Deposit.create({
    accountId,
    depositType,
    principalAmount: principal,
    interestRate,
    tenureMonths: tenure,
    maturityDate: maturityDate.toISOString().slice(0, 10),
    maturityAmount,
    status: 'Active',
  });

  await logActivity(userId, `${depositType} opened: principal ${principal}, ${tenure} months @ ${interestRate}%`, 'Deposit', deposit.id);
  return deposit;
}

// SRS F39: lazy maturity - promoted to Matured (and credited) the next
// time it's read after its maturity date, the same pattern already used
// for beneficiary cooling-period activation.
async function refreshMaturity(deposit) {
  if (deposit.status === 'Active' && new Date(deposit.maturityDate) <= new Date()) {
    const account = await Account.findByPk(deposit.accountId);
    account.balance = parseFloat(account.balance) + parseFloat(deposit.maturityAmount);
    await account.save();
    deposit.status = 'Matured';
    await deposit.save();
  }
  return deposit;
}

// SRS F38
async function list(userId) {
  const customer = await getCustomerOrThrow(userId);
  const holdings = await AccountHolder.findAll({ where: { customerId: customer.id }, attributes: ['accountId'] });
  const accountIds = holdings.map((h) => h.accountId);
  const { Op } = require('sequelize');
  const deposits = await Deposit.findAll({ where: { accountId: { [Op.in]: accountIds } }, order: [['id', 'DESC']] });
  for (const d of deposits) await refreshMaturity(d);
  return deposits;
}

async function getOne(userId, depositId) {
  const customer = await getCustomerOrThrow(userId);
  const holdings = await AccountHolder.findAll({ where: { customerId: customer.id }, attributes: ['accountId'] });
  const accountIds = holdings.map((h) => h.accountId);
  const { Op } = require('sequelize');
  const deposit = await Deposit.findOne({ where: { id: depositId, accountId: { [Op.in]: accountIds } } });
  if (!deposit) throw new AppError('Deposit not found.', 404);
  return refreshMaturity(deposit);
}

// Resolves SRS Appendix C, TBD-2: "Exact premature-closure penalty
// percentage." Policy: interest for the elapsed period only, at a rate
// 1 percentage point below the deposit's contracted rate - a standard,
// realistic penalty structure (SRS F37).
const PREMATURE_PENALTY_POINTS = 1.0;

async function closePrematurely(userId, depositId) {
  const deposit = await getOne(userId, depositId);
  if (deposit.status !== 'Active') {
    throw new AppError(`This deposit is already ${deposit.status.toLowerCase()} and cannot be closed again.`, 400);
  }

  const account = await Account.findByPk(deposit.accountId);
  const now = new Date();
  const opened = new Date(deposit.createdAt);
  const elapsedMonths = Math.max(
    0,
    (now.getFullYear() - opened.getFullYear()) * 12 + (now.getMonth() - opened.getMonth())
  );
  const penalizedRate = Math.max(0, parseFloat(deposit.interestRate) - PREMATURE_PENALTY_POINTS);
  const proceeds = computeMaturity(parseFloat(deposit.principalAmount), penalizedRate, elapsedMonths);

  account.balance = parseFloat(account.balance) + proceeds;
  await account.save();

  deposit.status = 'Closed Prematurely';
  await deposit.save();

  await logActivity(userId, `${deposit.depositType} closed prematurely: proceeds ${proceeds} credited (penalized rate ${penalizedRate}%)`, 'Deposit', deposit.id);
  return { message: 'Deposit closed prematurely.', proceeds, penalizedRate, elapsedMonths, deposit };
}

module.exports = { open, list, getOne, closePrematurely, interestRateFor, computeMaturity };
