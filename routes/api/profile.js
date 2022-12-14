const express = require('express');
const request = require('request');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const Profile = require('./../../models/Profile');
const User = require('./../../models/User');
const { exists } = require('./../../models/Profile');
const objectId = require('mongodb').ObjectId;

//  @route  GET api/profile/me
//  @desc   Get current user's profile
//  @access private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      'user',
      ['firstName', 'lastName', 'avatar']
    );

    if (!profile) {
      return res
        .status(400)
        .json({ msg: 'There is no profile for this user.' });
    }

    res.json(profile);
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

    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    //Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;

    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.company = githubusername;
    if (skills)
      profileFields.skills = skills.split(',').map((skill) => skill.trim());

    // Build Social Object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      if (profile) {
        // Update
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(profile);
      }
      // Create
      profile = new Profile(profileFields);

      await profile.save();
      res.json(profile);
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
    const profiles = await Profile.find().populate('user', [
      'firstName',
      'lastName',
      'avatar',
    ]);
    res.json(profiles);
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
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate('user', ['firstName', 'lastName', 'avatar']);

    if (!profile) return res.status(400).json({ msg: 'Profile not found.' });
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found.' });
    }
    res.status(500).send('Server Error');
  }
});

//  @route  Delete api/profile
//  @desc   Delete profile, user, & posts
//  @access private
router.delete('/', auth, async (req, res) => {
  try {
    // @todo - remove user's posts
    // Remove user and profile
    await Profile.findOneAndRemove({ user: req.user.id });
    await User.findOneAndRemove({ _id: req.user.id });
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
      const profile = await Profile.findOne({ user: req.user.id });

      profile.experience.unshift(newExp);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//  @route  PUT api/profile/experience/:exp_id
//  @desc   Edit experience from profile
//  @access private
// router.put('/experience/:exp_id', auth, async (req, res) => {
//   const { title, company, location, from, to, current, description } = req.body;
//   const expFields = {
//     title,
//     company,
//     location,
//     from,
//     to,
//     current,
//     description,
//   };

//   try {
//     let profile = await Profile.findOne({ id: req.params.exp_id });

//     const removeIndex = profile.experience
//       .map((item) => item.id)
//       .indexOf(req.params.exp_id);

//     profile.experience.splice(removeIndex, 1);

//     profile.experience.unshift(expFields);

//     await profile.save();

//     res.json(profile);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server Error');
//   }
// });

//  @route  PUT api/profile/experience/:exp_id
//  @desc   Edit experience from profile
//  @access private
router.put('/:profile_id/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      {
        _id: objectId(req.params.profile_id),
        'experience._id': objectId(req.params.exp_id),
      },
      {
        $set: {
          'experience.$.title': req.body.title,
          'experience.$.company': req.body.company,
          'experience.$.location': req.body.location,
          'experience.$.from': req.body.from,
          'experience.$.to': req.body.to,
          'experience.$.current': req.body.current,
          'experience.$.description': req.body.description,
        },
      },
      { new: true }
    );

    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

//  @route  DELETE api/profile/experience/:exp_id
//  @desc   Delete experience from profile
//  @access private
router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    // Get remove index
    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.exp_id);

    profile.experience.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//  @route  PUT api/profile/education
//  @desc   Add profile education
//  @access private
router.put(
  '/education',
  [
    auth,
    [
      check('school', 'School is required').not().isEmpty(),
      check('degree', 'Degree is required').not().isEmpty(),
      check('fieldOfStudy', 'Field of study is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { school, degree, fieldOfStudy, from, to, current, description } =
      req.body;

    const newEdu = {
      school,
      degree,
      fieldOfStudy,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.education.unshift(newEdu);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//  @route  PUT api/profile/experience/:exp_id
//  @desc   Edit experience from profile
//  @access private
// router.put('/education/:edu_id', auth, async (req, res) => {
//   const { school, degree, fieldOfStudy, from, to, current, description } =
//     req.body;
//   const eduFields = {
//     school,
//     degree,
//     fieldOfStudy,
//     from,
//     to,
//     current,
//     description,
//   };

//   try {
//     let profile = await Profile.findOne({ id: req.params.edu_id });

//     const removeIndex = profile.education
//       .map((item) => item.id)
//       .indexOf(req.params.edu_id);

//     profile.education.splice(removeIndex, 1);

//     profile.education.unshift(eduFields);

//     await profile.save();

//     res.json(profile);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server Error');
//   }
// });

//  @route  PUT api/profile/education/:edu_id
//  @desc   Edit education from profile
//  @access private
router.put('/:profile_id/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      {
        _id: objectId(req.params.profile_id),
        'education._id': objectId(req.params.edu_id),
      },
      {
        $set: {
          'education.$.school': req.body.school,
          'education.$.degree': req.body.degree,
          'education.$.fieldOfStudy': req.body.fieldOfStudy,
          'education.$.from': req.body.from,
          'education.$.to': req.body.to,
          'education.$.current': req.body.current,
          'education.$.description': req.body.description,
        },
      },
      { new: true }
    );

    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

//  @route  DELETE api/profile/education/:edu_id
//  @desc   Delete experience from profile
//  @access private
router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    // Get remove index
    const removeIndex = profile.education
      .map((item) => item.id)
      .indexOf(req.params.edu_id);

    profile.education.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//  @route  GET api/profile/github/:username
//  @desc   GET github repo
//  @access public
router.get('/github/:username', async (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${req.params.username}/repos?sort=created:asc&per_page=5`,
      method: 'GET',
      headers: { 'user-agent': 'node.js' },
    };

    request(options, (error, response, body) => {
      if (error) console.error(error);

      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: 'No GitHub profile found.' });
      }

      res.json(JSON.parse(body));
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
