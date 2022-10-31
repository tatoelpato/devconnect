const { request } = require('express');
const express = require('express');
const router = express.Router();
const pool = require('./../../config/db');
const { check, validationResult } = require('express-validator');

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
      'Please enter an alphanumeric password with 9 or more chracters.'
    )
    .isLength({ min: 9 })
      ,
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // See if user exists

    // Get user's gravatar

    //

    res.send('User route');
  }
);

module.exports = router;
