const express = require('express');
const router = express.Router();
const auth = require('./../../middleware/auth')
const pool = require('./../../config/dbHandler')
const jwt = require('jsonwebtoken');
const { Polly } = require('aws-sdk');
require('dotenv').config();



//  @route  GET api/auth
//  @desc   Test route
//  @access public
router.get('/', auth, async (req, res) => {
    const token = req.header('x-auth-token');
    const decoded = jwt.verify(token, process.env.JWT_TOKEN);
    const id = decoded.user;
    try {
        const user = await pool.query("SELECT id, name, email, avatar, date FROM users WHERE id = $1", [id])
        res.json(user.rows[0])
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Server Error.')
    }
});

module.exports = router;