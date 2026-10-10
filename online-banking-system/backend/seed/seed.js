require('dotenv').config();
const { sequelize, User, Customer, Account, AccountHolder, Beneficiary,
        Transaction, Biller, Deposit, Notification, ActivityLog } = require('../src/models');
const { hash } = require('../src/utils/auth.util');

async function seed() {
  await sequelize.sync({ force: true });
  console.log('Tables reset.');

  // ---------------- Admin ----------------
  const adminUser = await User.create({
    username: 'admin',
    passwordHash: await hash('Admin@123'),
    role: 'admin',
    email: 'admin@obs-bank.test',
    phoneNumber: '9000000000',
  });

  // ---------------- Customer 1: Priya (single account holder) ----------------
  const priyaUser = await User.create({
    username: 'priya',
    passwordHash: await hash('Customer@123'),
    mpinHash: await hash('1234'),
    role: 'customer',
    email: 'priya@example.test',
    phoneNumber: '9111111111',
  });
  const priya = await Customer.create({
    userId: priyaUser.id,
    fullName: 'Priya Sharma',
    dateOfBirth: '1994-03-12',
    addressStreet: '12 MG Road',
    addressCity: 'Chennai',
    addressState: 'Tamil Nadu',
    addressPincode: '600001',
    kycRefNumber: 'KYC-PRIYA-0001',
  });
  const priyaAccount = await Account.create({
    accountNumber: '1000100010001',
    accountType: 'Savings',
    branchIfsc: 'OBSB0000123',
    balance: 85000,
  });
  await AccountHolder.create({ accountId: priyaAccount.id, customerId: priya.id, holderRole: 'Primary' });

  // ---------------- Customer 2 & 3: Arjun and Kavya (joint account) ----------------
  const arjunUser = await User.create({
    username: 'arjun',
    passwordHash: await hash('Customer@123'),
    mpinHash: await hash('4321'),
    role: 'customer',
    email: 'arjun@example.test',
    phoneNumber: '9222222222',
  });
  const arjun = await Customer.create({
    userId: arjunUser.id,
    fullName: 'Arjun Nair',
    dateOfBirth: '1990-07-25',
    addressStreet: '45 Anna Salai',
    addressCity: 'Chennai',
    addressState: 'Tamil Nadu',
    addressPincode: '600002',
    kycRefNumber: 'KYC-ARJUN-0002',
  });

  const kavyaUser = await User.create({
    username: 'kavya',
    passwordHash: await hash('Customer@123'),
    mpinHash: await hash('5678'),
    role: 'customer',
    email: 'kavya@example.test',
    phoneNumber: '9333333333',
  });
  const kavya = await Customer.create({
    userId: kavyaUser.id,
    fullName: 'Kavya Nair',
    dateOfBirth: '1992-11-03',
    addressStreet: '45 Anna Salai',
    addressCity: 'Chennai',
    addressState: 'Tamil Nadu',
    addressPincode: '600002',
    kycRefNumber: 'KYC-KAVYA-0003',
  });

  const jointAccount = await Account.create({
    accountNumber: '1000200020002',
    accountType: 'Savings',
    branchIfsc: 'OBSB0000123',
    balance: 152000,
  });
  await AccountHolder.create({ accountId: jointAccount.id, customerId: arjun.id, holderRole: 'Primary' });
  await AccountHolder.create({ accountId: jointAccount.id, customerId: kavya.id, holderRole: 'Joint' });

  // Arjun also has his own individual current account.
  const arjunSoloAccount = await Account.create({
    accountNumber: '1000300030003',
    accountType: 'Current',
    branchIfsc: 'OBSB0000123',
    balance: 42000,
  });
  await AccountHolder.create({ accountId: arjunSoloAccount.id, customerId: arjun.id, holderRole: 'Primary' });

  // ---------------- Beneficiaries ----------------
  const now = new Date();
  const pastCooling = new Date(now.getTime() - 60 * 60 * 1000); // activated 1h ago
  const futureCooling = new Date(now.getTime() + 30 * 60 * 1000); // still cooling down

  const activeBeneficiary = await Beneficiary.create({
    customerId: priya.id,
    beneficiaryName: 'Rahul Verma',
    accountNumber: '2000500050005',
    ifscCode: 'HDFC0001234',
    nickname: 'Rahul',
    status: 'Active',
    addedAt: pastCooling,
    activeFrom: pastCooling,
  });

  await Beneficiary.create({
    customerId: priya.id,
    beneficiaryName: 'Landlord - Mr. Iyer',
    accountNumber: '2000600060006',
    ifscCode: 'ICIC0005678',
    nickname: 'Rent',
    status: 'Pending Activation',
    addedAt: now,
    activeFrom: futureCooling,
  });

  // ---------------- Billers ----------------
  await Biller.create({
    customerId: priya.id,
    billerName: 'City Power Electricity Board',
    billerCategory: 'Electricity',
    consumerNumber: 'EB-99887766',
  });
  await Biller.create({
    customerId: priya.id,
    billerName: 'Metro Broadband',
    billerCategory: 'Internet',
    consumerNumber: 'BB-11223344',
  });

  // ---------------- A sample completed transaction ----------------
  await Transaction.create({
    sourceAccountId: priyaAccount.id,
    beneficiaryId: activeBeneficiary.id,
    transactionType: 'IMPS',
    amount: 5000,
    status: 'Success',
    referenceNumber: 'UTR' + Date.now(),
    initiatedAt: pastCooling,
    completedAt: pastCooling,
  });

  // ---------------- A sample deposit ----------------
  const principal = 50000, rate = 6.5, tenure = 12;
  const maturityAmount = +(principal * (1 + (rate / 100) * (tenure / 12))).toFixed(2);
  const maturityDate = new Date();
  maturityDate.setMonth(maturityDate.getMonth() + tenure);
  await Deposit.create({
    accountId: priyaAccount.id,
    depositType: 'FD',
    principalAmount: principal,
    interestRate: rate,
    tenureMonths: tenure,
    maturityDate: maturityDate.toISOString().slice(0, 10),
    maturityAmount,
  });

  // ---------------- Notifications ----------------
  await Notification.create({
    customerId: priya.id,
    message: 'Your account was credited/debited. Transfer of INR 5000 to Rahul was successful.',
    category: 'Transactional',
  });

  await ActivityLog.create({ userId: adminUser.id, actionDescription: 'Seed data initialized', entityAffected: 'System', entityId: null });

  console.log('\nSeed complete. Sample login credentials:');
  console.table([
    { role: 'admin', username: 'admin', password: 'Admin@123', mpin: '-' },
    { role: 'customer', username: 'priya', password: 'Customer@123', mpin: '1234', note: 'single account' },
    { role: 'customer', username: 'arjun', password: 'Customer@123', mpin: '4321', note: 'joint + solo account' },
    { role: 'customer', username: 'kavya', password: 'Customer@123', mpin: '5678', note: 'joint account holder' },
  ]);
}

seed()
  .then(() => { console.log('\nDone.'); process.exit(0); })
  .catch((err) => { console.error('Seed failed:', err); process.exit(1); });
