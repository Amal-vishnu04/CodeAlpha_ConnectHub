const mongoose = require('mongoose');

module.exports = async function connectDB() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/connecthub';
  await mongoose.connect(mongoUri);
  console.log('MongoDB connected');
};
