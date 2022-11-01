const express = require('express');
const router = express.Router();
const auth = require('./../../middleware/auth');
const pool = require('./../../config/dbHandler');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const jwtGen = require('./../../utils/jwtGenerator');

//  @route  GET api/auth
//  @desc   Test route
//  @access public
router.get('/', auth, async (req, res) => {
  const token = req.header('x-auth-token');
  const decoded = jwt.verify(token, process.env.JWT_TOKEN);
  const id = decoded.user;
  try {
    const user = await pool.query(
      'SELECT id, name, email, avatar, date FROM users WHERE id = $1',
      [id]
    );
    res.json(user.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error.');
  }
});

//  @route  Post api/auth
//  @desc   Authenticate User & Get Token
//  @access Public
router.post(
  '/',
  [
    check('email', 'Please include a valid email.').isEmail(),
    check('password', 'Password is required.').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Destructure the req.body (name, email, password)
      const { email, password } = req.body;
      // See if user exists (if exists, throw error)
      const user = await pool.query('SELECT * FROM users WHERE email = $1', [
        email,
      ]);

      const isMatch = await bcrypt.compare(password, user.rows[0].password);

      if (user.rows.length === 0) {
        return res.status(401).send('Invalid Credentials.');
      }

      if (!isMatch) {
        return res.status(401).send('Invalid Credentials.');
      }

      // Return jsonwebtoken
      const payload = {
        user: user.rows[0].id,
      };

      jwt.sign(
        payload,
        process.env.JWT_TOKEN,
        { expiresIn: 3600000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
