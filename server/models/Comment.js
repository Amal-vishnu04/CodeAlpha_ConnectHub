const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const commentSchema = new mongoose.Schema({
  post: { type: ObjectId, ref: 'Post', required: true, index: true },
  author: { type: ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Comment', commentSchema);
