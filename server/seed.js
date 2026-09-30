require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Post = require('./models/Post');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const hash = await bcrypt.hash('password123', 10);
  const people = [
    { name: 'Amal Vishnu', username: 'amal', email: 'amal@example.com', bio: 'Full stack intern. Building ConnectHub.' },
    { name: 'Rahul Kumar', username: 'rahul', email: 'rahul@example.com', bio: 'Coffee, code and cricket.' },
    { name: 'Priya Sharma', username: 'priya', email: 'priya@example.com', bio: 'Designer who loves clean UI.' }
  ];
  const users = [];
  for (const p of people) {
    users.push(await User.findOneAndUpdate({ email: p.email }, { ...p, password: hash }, { upsert: true, new: true, setDefaultsOnInsert: true }));
  }
  const [amal, rahul, priya] = users;
  if (!(await Post.countDocuments({ author: { $in: users.map((u) => u._id) } }))) {
    await Post.create([
      { author: amal._id, content: 'Just launched ConnectHub. Say hello!', feeling: '😊 Happy' },
      { author: rahul._id, content: 'Anyone up for a weekend hackathon?', feeling: '🔥 Excited' },
      { author: priya._id, content: 'Dark mode is not a feature, it is a lifestyle.', feeling: '😎 Cool' }
    ]);
  }
  await User.updateOne({ _id: rahul._id }, { $addToSet: { followers: amal._id } });
  await User.updateOne({ _id: amal._id }, { $addToSet: { following: rahul._id } });
  console.log('Seeded. Login with amal / rahul / priya, password: password123');
  await mongoose.disconnect();
})();
