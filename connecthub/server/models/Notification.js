const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const notificationSchema = new mongoose.Schema({
  recipient: { type: ObjectId, ref: 'User', required: true, index: true },
  sender: { type: ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['like', 'comment', 'follow'], required: true },
  post: { type: ObjectId, ref: 'Post' },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
