require('dotenv').config();
const { Pool, Client } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.PG_PASSWORD,
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE
});

module.exports = pool;