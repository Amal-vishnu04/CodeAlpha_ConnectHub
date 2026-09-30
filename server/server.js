require('dotenv').config();
const express = require('express');
const path = require('path');
const connectDB = require('./config/db');

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
