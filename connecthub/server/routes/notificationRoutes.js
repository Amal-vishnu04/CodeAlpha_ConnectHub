const router = require('express').Router();
const Notification = require('../models/Notification');
const protect = require('../middleware/authMiddleware');
const { isValidId } = require('../utils/helpers');

router.use(protect);

router.get('/', async (req, res) => {
  const list = await Notification.find({ recipient: req.userId })
    .populate('sender', 'name username profilePicture').sort({ createdAt: -1 }).limit(30);
  res.json(list);
});

router.get('/unread-count', async (req, res) => {
  res.json({ count: await Notification.countDocuments({ recipient: req.userId, isRead: false }) });
});

router.put('/read-all', async (req, res) => {
  await Notification.updateMany({ recipient: req.userId, isRead: false }, { isRead: true });
  res.json({ message: 'All notifications marked as read.' });
});

router.put('/:id/read', async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Notification not found.' });
  const n = await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.userId }, { isRead: true }, { new: true });
  if (!n) return res.status(404).json({ message: 'Notification not found.' });
  res.json(n);
});

module.exports = router;
