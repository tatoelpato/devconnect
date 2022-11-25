const express = require('express');
const { restart } = require('nodemon');
const router = express.Router();
const auth = require('../../middleware/auth');
const pool = require('./../../config/dbHandler.js');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { check, validationResult } = require('express-validator');

//  @route  GET api/profile/me
//  @desc   Get current user's profile
//  @access private
router.get('/me', auth, async (req, res) => {
  const token = req.header('x-auth-token');
  const decoded = jwt.verify(token, process.env.JWT_TOKEN);
  const user_id = decoded.user;
  try {
    const profile = await await pool.query(
      'SELECT * FROM profile WHERE user_id = $1',
      [user_id]
    );

    if (profile.rows.length === 0) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }

    res.json(profile.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//  @route  POST api/profile
//  @desc   Create or Update user profile
//  @access private
router.post(
  '/',
  [
    auth,
    [
      check('status', 'Status is required').not().isEmpty(),
      check('skills', 'Skills is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const token = req.header('x-auth-token');
    const decoded = jwt.verify(token, process.env.JWT_TOKEN);
    const id = decoded.user;

    const {
      company,
      website,
      location,
      status,
      skills,
      bio,
      githubusername,
      experience,
      education,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    //Build profile object
    const profileFields = {};
    profileFields.user = id;

    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.company = githubusername;
    if (skills) profileFields.skills = skills.split(',');

    // Build Social Object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      let profile = await pool.query(
        'SELECT * FROM profile WHERE user_id = $1',
        [id]
      );

      if (profile.rows.length !== 0) {
        profile = await pool.query(
          'UPDATE profile SET company = $1, website = $2, location = $3, status = $4, skills = $5, bio = $6, githubusername = $7, experience = $8, education = $9, social = $10 WHERE user_id = $11',
          [
            company,
            website,
            location,
            status,
            profileFields.skills,
            bio,
            JSON.stringify(githubusername),
            experience,
            education,
            JSON.stringify(profileFields.social),
            id,
          ]
        );
        return res.json(profile);
      }

      //Create
      if (profile.rows.length === 0) {
        profile = await pool.query(
          'INSERT INTO profile (user_id, company, website, location, status, skills, bio, githubusername, experience, education, social) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
          [
            id,
            company,
            website,
            location,
            status,
            profileFields.skills,
            bio,
            JSON.stringify(githubusername),
            experience,
            education,
            JSON.stringify(profileFields.social),
          ]
        );
        return res.json(profile);
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//  @route  GET api/profile
//  @desc   GET ALL PROFILES
//  @access public
router.get('/', async (req, res) => {
  try {
    const profiles = await pool.query(
      'SELECT name, avatar, company, website, location, status, skills, bio, githubusername, experience, education, social FROM profile p JOIN users u ON u.id = p.user_id'
    );
    res.json(profiles.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//  @route  GET api/profile/user/:user_id
//  @desc   GET ALL PROFILES
//  @access public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await pool.query(
      'SELECT name, avatar, company, website, location, status, skills, bio, githubusername, experience, education, social FROM profile p JOIN users u ON u.id = p.user_id WHERE id = $1',
      [req.params.user_id]
    );

    if (profile.rows.length === 0) {
      return res.status(400).json({ msg: 'Profile not found.' });
    }
    res.json(profile.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//  @route  Delete api/profile
//  @desc   Delete profile, user, & posts
//  @access private
router.delete('/', auth, async (req, res) => {
  const token = req.header('x-auth-token');
  const decoded = jwt.verify(token, process.env.JWT_TOKEN);
  const id = decoded.user;
  try {
    // @todo - remove user's posts

    // Remove user and profile
    await pool.query('delete from users where id = $1', [id]);
    res.json({ msg: 'User has been deleted.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//  @route  PUT api/profile/experience
//  @desc   Add profile experience
//  @access private
router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('company', 'Company is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const token = req.header('x-auth-token');
    const decoded = jwt.verify(token, process.env.JWT_TOKEN);
    const id = decoded.user;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, company, location, from, to, current, description } =
      req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await pool.query(
        'UPDATE profile SET experience = experience || ARRAY[$1]::json[] where user_id = $2 RETURNING *',
        [newExp, id]
      );

      res.json(profile.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//  @route  DELETE api/profile/experience
//  @desc   Delete experience from profile
//  @access private
router.get('/experience', auth, async (req, res) => {
  const token = req.header('x-auth-token');
  const decoded = jwt.verify(token, process.env.JWT_TOKEN);
  const id = decoded.user;
  try {
    const profile = await pool.query(
      'select element as experience, id from profile , unnest(experience) WITH ordinality AS a(element, id) WHERE user_id = $1 ORDER BY id ',
      [id]
    );

    const { title, company, location, from, to, current, description } =
      req.body;

      if(title) profile.title = title

    // Get remove index

    //const removeIndex = profile.rows.map(item => item.id).indexOf(req.params.id);
    const removeIndex = 

    console.log(removeIndex)
    res.json(profile.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
