const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('./../../middleware/auth');
const User = require('./../../models/User');
const Post = require('./../../models/Post');
const Profile = require('./../../models/Profile');
const { trusted } = require('mongoose');
const objectId = require('mongodb').ObjectId;

//  @route  Post api/posts
//  @desc   Create a post
//  @access private
router.post(
  '/',
  [auth, [check('text', 'Text is required.').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');

      const newPost = new Post({
        text: req.body.text,
        fistName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        user: req.user.id,
      });

      const post = await newPost.save(newPost);

      res.json(post);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  }
);

//  @route  GET api/posts
//  @desc   Get all posts
//  @access private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

//  @route  GET api/posts/:id
//  @desc   Get post by id
//  @access private
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found.' });
    }

    res.json(post);
  } catch (err) {
    console.error(err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found.' });
    }
    res.status(500).send('Server Error');
  }
});

//  @route  PUT api/posts/:id
//  @desc   Edit post by id
//  @access private
router.put('/:id', auth, async (req, res) => {
  const postEdit = {
    text: req.body.text,
  };

  try {
    const posts = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: postEdit },
      { new: true }
    );
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

//  @route  DELETE api/posts/:id
//  @desc   Delete post by id
//  @access private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found.' });
    }

    // Check user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized.' });
    }

    await post.remove();

    res.json({ msg: 'Post removed.' });
  } catch (err) {
    console.error(err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found.' });
    }
    res.status(500).send('Server Error');
  }
});

//  @route  PUT api/posts/like/:id
//  @desc   Like a post
//  @access private
router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if the post has been liked by the user
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: 'Post already liked.' });
    }

    post.likes.unshift({ user: req.user.id });

    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

//  @route  PUT api/posts/unlike/:id
//  @desc   Like a post
//  @access private
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if the post has been liked by the user
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ msg: 'Post has not yet been liked.' });
    }

    // Get remove index
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);

    post.likes.splice(removeIndex, 1);

    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

//  @route  Post api/posts/comment/:id
//  @desc   Comment on a post
//  @access private
router.post(
  '/comment/:id',
  [auth, [check('text', 'Text is required.').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');
      const post = await Post.findById(req.params.id);

      const newComment = {
        text: req.body.text,
        fistName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        user: req.user.id,
      };

      console.log(user.firstName);

      post.comments.unshift(newComment);

      await post.save();

      res.json(post.comments);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  }
);

//  @route  PUT api/posts/:id
//  @desc   Edit a comment by id
//  @access private
router.put('/post/:post_id/comment/:comment_id', auth, async (req, res) => {
  try {
    const comment = await Post.findOneAndUpdate(
      {
        _id: objectId(req.params.post_id),
        'comments._id': objectId(req.params.comment_id),
      },
      { $set: { 'comments.$.text': req.body.text } },
      { new: true }
    );

    console.log(comment);
    res.json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

//  @route  DELETE api/comment/:id/:comment_id
//  @desc   Delete a comment by id
//  @access private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Pull out comment
    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );

    // Make sure comment exists
    if (!comment) {
      return res.status(404).json({ msg: 'Comment not found.' });
    }

    // Check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized.' });
    }

    const removeIndex = post.comments
      .map((comment) => comment.user.toString())
      .indexOf(req.user.id);

    post.comments.splice(removeIndex, 1);

    await post.save();

    res.json(post.comments);
  } catch (err) {
    console.error(err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Comment not found.' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
