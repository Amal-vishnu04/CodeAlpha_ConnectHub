require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const path = require('path');
const connectDB = require('./config/db');

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set before starting ConnectHub in production.');
  }
  process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex');
  console.warn('JWT_SECRET is not set; using a temporary development secret for this run.');
}

const app = express();
app.use(express.json({ limit: '6mb' })); // images are sent as base64 data URLs
app.use(express.static(path.join(__dirname, '..', 'client')));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api', require('./routes/commentRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

app.use('/api', (req, res) => res.status(404).json({ message: 'Endpoint not found.' }));

// Central error handler (Express 5 forwards async errors here)
app.use((err, req, res, next) => {
  console.error(err);
  const tooBig = err.type === 'entity.too.large';
  res.status(tooBig ? 413 : 500).json({ message: tooBig ? 'That image is too large. Try a smaller one.' : 'Something went wrong. Please try again.' });
});

const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => app.listen(PORT, () => console.log(`ConnectHub running at http://localhost:${PORT}`)))
  .catch((e) => { console.error('Database connection failed:', e.message); process.exit(1); });
