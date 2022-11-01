const express = require('express');
const router = express.Router();
const pool = require('./../../config/dbHandler.js');
const { check, validationResult } = require('express-validator');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwtGen = require('./../../utils/jwtGenerator');

//  @route  Post api/users
//  @desc   Register User
//  @access Public
router.post(
  '/',
  [
    check('name', 'Name is required.').not().isEmpty(),
    check('email', 'Please include a valid email.').isEmail(),
    check(
      'password',
      'Please enter a password with 9 or more characters.'
    ).isLength({ min: 9 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Destructure the req.body (name, email, password)
      const { name, email, password } = req.body;
      // See if user exists (if exists, throw error)
      const user = await pool.query('SELECT * FROM users WHERE email = $1', [
        email,
      ]);

      if (user.rows.length !== 0) {
        return res.status(401).send('User already exists.');
      }

      // Get user's gravatar
      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm',
      });

      // Encrypt password
      const salt = await bcrypt.genSalt(10);
      const bcryptPass = await bcrypt.hash(password, salt);

      // Register user
      const newUser = await pool.query(
        'INSERT INTO users (name, email, password, avatar) values ($1, $2, $3, $4) RETURNING *',
        [name, email, bcryptPass, avatar]
      );

      // Return jsonwebtoken
      const token = jwtGen(newUser.rows[0].id);

      res.json({token});
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;