const router = require('express').Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const protect = require('../middleware/authMiddleware');
const { isValidId, notify } = require('../utils/helpers');

router.use(protect);

const AUTHOR_FIELDS = 'name username profilePicture';

async function formatPosts(posts, userId) {
  const counts = await Comment.aggregate([
    { $match: { post: { $in: posts.map((p) => p._id) } } },
    { $group: { _id: '$post', n: { $sum: 1 } } }
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.n]));
  return posts.map((p) => ({
    id: p._id, author: p.author, content: p.content, image: p.image, feeling: p.feeling,
    createdAt: p.createdAt,
    likesCount: p.likes.length,
    liked: p.likes.some((l) => String(l) === userId),
    commentsCount: countMap.get(String(p._id)) || 0
  }));
}

router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.user && isValidId(req.query.user)) filter.author = req.query.user;
  const posts = await Post.find(filter).populate('author', AUTHOR_FIELDS).sort({ createdAt: -1 }).limit(100);
  res.json(await formatPosts(posts, req.userId));
});

router.post('/', async (req, res) => {
  try {
    const { content = '', image = '', feeling = '' } = req.body;
    if (!content.trim() && !image)
      return res.status(400).json({ message: 'Please enter some content before posting.' });
    const post = await Post.create({ author: req.userId, content: content.trim(), image, feeling });
    await post.populate('author', AUTHOR_FIELDS);
    const [formatted] = await formatPosts([post], req.userId);
    res.status(201).json(formatted);
  } catch {
    res.status(500).json({ message: 'Could not publish your post. Please try again.' });
  }
});

router.get('/:id', async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Post not found.' });
  const post = await Post.findById(req.params.id).populate('author', AUTHOR_FIELDS);
  if (!post) return res.status(404).json({ message: 'Post not found.' });
  res.json((await formatPosts([post], req.userId))[0]);
});

router.delete('/:id', async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Post not found.' });
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found.' });
  if (String(post.author) !== req.userId)
    return res.status(403).json({ message: 'You can only delete your own posts.' });
  await Promise.all([post.deleteOne(), Comment.deleteMany({ post: post._id })]);
  res.json({ message: 'Post deleted.' });
});

router.post('/:id/like', async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Post not found.' });
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found.' });
  // $addToSet prevents the same user liking twice
  const result = await Post.updateOne({ _id: post._id }, { $addToSet: { likes: req.userId } });
  if (result.modifiedCount) {
    const me = await User.findById(req.userId);
    await notify({ recipient: post.author, sender: req.userId, type: 'like', post: post._id, message: `${me.name} liked your post.` });
  }
  const fresh = await Post.findById(post._id);
  res.json({ liked: true, likesCount: fresh.likes.length });
});

router.delete('/:id/like', async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Post not found.' });
  const post = await Post.findByIdAndUpdate(req.params.id, { $pull: { likes: req.userId } }, { new: true });
  if (!post) return res.status(404).json({ message: 'Post not found.' });
  res.json({ liked: false, likesCount: post.likes.length });
});

module.exports = router;
