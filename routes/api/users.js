const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./../../models/User');
require('dotenv').config

//  @route  Post api/users
//  @desc   Register User
//  @access Public
router.post(
  '/',
  [
    check('firstName', 'First name is required.').not().isEmpty(),
    check('lastName', 'Last name is required.').not().isEmpty(),
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
      const { firstName, lastName, email, password } = req.body;
      // See if user exists (if exists, throw error)
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ errors: 'User already exists.' });
      }

      // Get user's gravatar
      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm',
      });

      user = new User({
        firstName,
        lastName,
        email,
        password,
        avatar,
      });

      // Encrypt password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      // Register user
      await user.save();

      // Return jsonwebtoken
      const payload = {
        id: user.id,
      };

      jwt.sign(
        payload,
        process.env.JWT_TOKEN,
        { expiresIn: 360000 },
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
