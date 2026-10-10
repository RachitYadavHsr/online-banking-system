require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { errorHandler } = require('./middleware/errorHandler.middleware');
const healthRoutes = require('./routes/health.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/api/health', healthRoutes);
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/accounts', require('./routes/accounts.routes'));
app.use('/api/profile', require('./routes/profile.routes'));
app.use('/api/beneficiaries', require('./routes/beneficiary.routes'));
app.use('/api/transfers', require('./routes/transfer.routes'));
app.use('/api/bills', require('./routes/bill.routes'));
app.use('/api/deposits', require('./routes/deposit.routes'));

// Further route modules are mounted here as they are built:
// app.use('/api/accounts', require('./routes/account.routes'));
// app.use('/api/beneficiaries', require('./routes/beneficiary.routes'));
// app.use('/api/transfers', require('./routes/transfer.routes'));
// app.use('/api/bills', require('./routes/bill.routes'));
// app.use('/api/deposits', require('./routes/deposit.routes'));

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.use(errorHandler);

module.exports = app;
