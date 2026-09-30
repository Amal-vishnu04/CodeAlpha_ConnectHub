const router = require('express').Router();
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');
const protect = require('../middleware/authMiddleware');
const { isValidId, notify } = require('../utils/helpers');

router.use(protect);

router.get('/posts/:id/comments', async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Post not found.' });
  const comments = await Comment.find({ post: req.params.id })
    .populate('author', 'name username profilePicture').sort({ createdAt: 1 });
  res.json(comments);
});

router.post('/posts/:id/comments', async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Post not found.' });
  const content = (req.body.content || '').trim();
  if (!content) return res.status(400).json({ message: 'Write something before commenting.' });
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found.' });
  const comment = await Comment.create({ post: post._id, author: req.userId, content });
  await comment.populate('author', 'name username profilePicture');
  const me = await User.findById(req.userId);
  await notify({ recipient: post.author, sender: req.userId, type: 'comment', post: post._id, message: `${me.name} commented on your post.` });
  res.status(201).json(comment);
});

router.delete('/comments/:id', async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Comment not found.' });
  const comment = await Comment.findById(req.params.id);
  if (!comment) return res.status(404).json({ message: 'Comment not found.' });
  if (String(comment.author) !== req.userId)
    return res.status(403).json({ message: 'You can only delete your own comments.' });
  await comment.deleteOne();
  res.json({ message: 'Comment deleted.' });
});

module.exports = router;
