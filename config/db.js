const pool = require('./dbHandler.js')

const connectDB = async () => {
  try {
    await pool.connect();
    console.log('DB connected.');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;