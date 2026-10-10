require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log(`Database connected (${sequelize.getDialect()}).`);

    // Dev-stage table sync. A production deployment would replace this
    // with versioned Sequelize migrations (see README).
    await sequelize.sync();
    console.log('All 13 tables synced.');

    app.listen(PORT, () => {
      console.log(`Online Banking System API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
