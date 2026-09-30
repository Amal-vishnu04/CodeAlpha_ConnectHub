const mongoose = require('mongoose');
const Notification = require('../models/Notification');

const isValidId = (id) => mongoose.isValidObjectId(id);

const publicUser = (u) => ({
  id: u._id, name: u.name, username: u.username, profilePicture: u.profilePicture
});

// Never notify users about their own actions
async function notify({ recipient, sender, type, post, message }) {
  if (String(recipient) === String(sender)) return;
  await Notification.create({ recipient, sender, type, post, message });
}

module.exports = { isValidId, publicUser, notify };
