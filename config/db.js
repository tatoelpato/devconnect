const Pool = require("pg").Pool;

const pool = new Pool({
    user: "postgres",
    password: "postgres",
    host: "database-1.cwkmd4pcunnw.us-east-1.rds.amazonaws.com",
    port: 5432,
    database: "reactdb",
});

const connectDB = async () => {
    try {
        await pool.connect();
        console.log('DB connected.');
    } catch (err) {
        console.err(err.message);
        process.exit(1)
    }
}

module.exports = connectDB;