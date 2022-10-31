require('dotenv').config();
const { Pool, Client } = require('pg');

const pool = new Pool({
  user: process.env.REACT_APP_DB_USER,
  password: process.env.REACT_APP_PG_PASSWORD,
  host: process.env.REACT_APP_PG_HOST,
  port: process.env.REACT_APP_PG_PORT,
  database: process.env.REACT_APP_PG_DATABASE
});

module.exports = pool;