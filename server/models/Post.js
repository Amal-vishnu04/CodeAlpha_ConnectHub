const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const postSchema = new mongoose.Schema({
  author: { type: ObjectId, ref: 'User', required: true, index: true },
  content: { type: String, default: '', maxlength: 1000 },
  image: { type: String, default: '' },
  feeling: { type: String, default: '' },
  likes: [{ type: ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
