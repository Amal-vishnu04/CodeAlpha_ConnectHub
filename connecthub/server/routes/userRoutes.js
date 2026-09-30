const router = require('express').Router();
const User = require('../models/User');
const Post = require('../models/Post');
const protect = require('../middleware/authMiddleware');
const { isValidId, notify } = require('../utils/helpers');

router.use(protect);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);
  const rx = new RegExp(escapeRegex(q), 'i');
  const users = await User.find({ $or: [{ name: rx }, { username: rx }] })
    .select('name username profilePicture').limit(8);
  res.json(users);
});

router.get('/stats/community', async (req, res) => {
  const [users, posts] = await Promise.all([User.countDocuments(), Post.countDocuments()]);
  res.json({ users, posts });
});

router.get('/:id', async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(404).json({ message: 'User not found.' });
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.json({
    id: user._id, name: user.name, username: user.username, bio: user.bio,
    profilePicture: user.profilePicture, createdAt: user.createdAt,
    postsCount: await Post.countDocuments({ author: user._id }),
    followersCount: user.followers.length,
    followingCount: user.following.length,
    isFollowing: user.followers.some((f) => String(f) === req.userId),
    isMe: String(user._id) === req.userId
  });
});

router.put('/:id', async (req, res) => {
  if (req.params.id !== req.userId)
    return res.status(403).json({ message: 'You can only edit your own profile.' });
  const { name, bio, profilePicture } = req.body;
  if (name !== undefined && !name.trim())
    return res.status(400).json({ message: 'Name cannot be empty.' });
  const update = {};
  if (name !== undefined) update.name = name.trim();
  if (bio !== undefined) update.bio = bio.trim().slice(0, 200);
  if (profilePicture !== undefined) update.profilePicture = profilePicture;
  const user = await User.findByIdAndUpdate(req.userId, update, { new: true });
  res.json({ id: user._id, name: user.name, username: user.username, bio: user.bio, profilePicture: user.profilePicture });
});

router.post('/:id/follow', async (req, res) => {
  const targetId = req.params.id;
  if (!isValidId(targetId)) return res.status(404).json({ message: 'User not found.' });
  if (targetId === req.userId) return res.status(400).json({ message: "You can't follow yourself." });
  const target = await User.findById(targetId);
  if (!target) return res.status(404).json({ message: 'User not found.' });

  // $addToSet guarantees no duplicate follow relationships
  const result = await User.updateOne({ _id: targetId }, { $addToSet: { followers: req.userId } });
  await User.updateOne({ _id: req.userId }, { $addToSet: { following: targetId } });
  if (result.modifiedCount) {
    const me = await User.findById(req.userId);
    await notify({ recipient: targetId, sender: req.userId, type: 'follow', message: `${me.name} started following you.` });
  }
  const updated = await User.findById(targetId);
  res.json({ following: true, followersCount: updated.followers.length, message: `You are now following ${target.name}.` });
});

router.delete('/:id/follow', async (req, res) => {
  const targetId = req.params.id;
  if (!isValidId(targetId)) return res.status(404).json({ message: 'User not found.' });
  await User.updateOne({ _id: targetId }, { $pull: { followers: req.userId } });
  await User.updateOne({ _id: req.userId }, { $pull: { following: targetId } });
  const updated = await User.findById(targetId);
  res.json({ following: false, followersCount: updated?.followers.length ?? 0, message: 'You unfollowed this user.' });
});

module.exports = router;
