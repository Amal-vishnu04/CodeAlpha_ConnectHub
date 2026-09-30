const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const protect = require('../middleware/authMiddleware');
const { publicUser } = require('../utils/helpers');

const signToken = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/register', async (req, res) => {
  try {
    const { name, username, email, password, confirmPassword, profilePicture } = req.body;
    if (!name?.trim() || !username?.trim() || !email?.trim() || !password)
      return res.status(400).json({ message: 'Please fill in all required fields.' });
    if (!/^[a-z0-9_]{3,20}$/i.test(username.trim()))
      return res.status(400).json({ message: 'Username must be 3-20 characters: letters, numbers or underscores.' });
    if (!/^\S+@\S+\.\S+$/.test(email))
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    if (confirmPassword !== undefined && password !== confirmPassword)
      return res.status(400).json({ message: 'Passwords do not match.' });

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();
    if (await User.findOne({ email: cleanEmail }))
      return res.status(409).json({ message: 'That email is already registered.' });
    if (await User.findOne({ username: cleanUsername }))
      return res.status(409).json({ message: 'That username is taken. Try another one.' });

    const user = await User.create({
      name: name.trim(), username: cleanUsername, email: cleanEmail,
      password: await bcrypt.hash(password, 10), profilePicture: profilePicture || ''
    });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch {
    res.status(500).json({ message: 'Could not create your account. Please try again.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password)
      return res.status(400).json({ message: 'Enter your email or username and password.' });
    const id = identifier.trim().toLowerCase();
    const user = await User.findOne({ $or: [{ email: id }, { username: id }] }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ message: 'Invalid email or password.' });
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch {
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ message: 'Please log in to continue.' });
  res.json(publicUser(user));
});

module.exports = router;
