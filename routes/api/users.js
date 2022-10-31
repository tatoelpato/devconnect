const { request } = require('express');
const express = require('express');
const router = express.Router();
const pool = require('./../../config/dbHandler.js');
const { check, validationResult } = require('express-validator');

//  @route  Post api/users
//  @desc   Register User
//  @access Public
router.post(
  '/register',
//   [
//     check('name', 'Name is required.').not().isEmpty(),
//     check('email', 'Please include a valid email.').isEmail(),
//     check(
//       'password',
//       'Please enter an alphanumeric password with 9 or more chracters.'
//     )
//     .isLength({ min: 9 })
//       ,
//   ],
  async (req, res) => {
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   return res.status(400).json({ errors: errors.array() });
    // }

    try {
        // Destructure the req.body (name, email, password, avatar)
        const { name, email, password, avatar } = req.body;
        // See if user exists (if exists, throw error)
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email])
        //query("SELECT * FROM users email = $1", [email]);

        res.json(user.rows)
        // Encrypt password
        
        // Register user

        // Return jsonwebtoken

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error')
    }
    
    
    // Get user's gravatar

    

    

  }
);

module.exports = router;
