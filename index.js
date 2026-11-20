
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage
const users = [];
const exercises = [];

// Generate unique 24-character hexadecimal ID
function generateId() {
  return crypto.randomBytes(12).toString('hex');
}

// Parse YYYY-MM-DD as a local date
function parseLocalDate(dateString) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(year, month - 1, day);

  // Reject invalid calendar dates
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 1. Create User
app.post('/api/users', (req, res) => {
  const username = req.body.username;

  if (typeof username !== 'string' || !username.trim()) {
    return res.status(400).json({
      error: 'username is required'
    });
  }

  const user = {
    username: username.trim(),
    _id: generateId()
  };

  users.push(user);

  res.json(user);
});

// 2. Get All Users
app.get('/api/users', (req, res) => {
  res.json(users);
});

// 3. Add Exercise
app.post('/api/users/:_id/exercises', (req, res) => {
  const user = users.find(u => u._id === req.params._id);

  if (!user) {
    return res.status(404).json({
      error: 'User not found'
    });
  }

  const { description, duration, date } = req.body;

  const durationNum = Number(duration);

  if (
    typeof description !== 'string' ||
    !description.trim() ||
    duration === undefined ||
    duration === '' ||
    !Number.isFinite(durationNum) ||
    durationNum <= 0
  ) {
    return res.status(400).json({
      error: 'Invalid description or duration'
    });
  }

  let exerciseDate;

  if (date) {
    exerciseDate = parseLocalDate(date);

    if (!exerciseDate) {
      return res.status(400).json({
        error: 'Invalid date'
      });
    }
  } else {
    exerciseDate = new Date();
  }

  const exercise = {
    userId: user._id,
    description: description.trim(),
    duration: durationNum,
    date: exerciseDate
  };

  exercises.push(exercise);

  res.json({
    ...user,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString()
  });
});

// 4. Get Exercise Logs
app.get('/api/users/:_id/logs', (req, res) => {
  const user = users.find(u => u._id === req.params._id);

  if (!user) {
    return res.status(404).json({
      error: 'User not found'
    });
  }

  const { from, to, limit } = req.query;

  // Get all exercises belonging to this user
  let userExercises = exercises.filter(
    exercise => exercise.userId === user._id
  );

  // Filter FROM date
  if (from) {
    const fromDate = parseLocalDate(from);

    if (!fromDate) {
      return res.status(400).json({
        error: 'Invalid from date'
      });
    }

    userExercises = userExercises.filter(
      exercise => exercise.date >= fromDate
    );
  }

  // Filter TO date
  if (to) {
    const toDate = parseLocalDate(to);

    if (!toDate) {
      return res.status(400).json({
        error: 'Invalid to date'
      });
    }

    toDate.setHours(23, 59, 59, 999);

    userExercises = userExercises.filter(
      exercise => exercise.date <= toDate
    );
  }

  // Apply LIMIT
  if (limit !== undefined) {
    if (!/^\d+$/.test(limit)) {
      return res.status(400).json({
        error: 'Invalid limit'
      });
    }

    const limitNum = Number(limit);

    userExercises = userExercises.slice(0, limitNum);
  }

  // Prepare log response
  const log = userExercises.map(exercise => ({
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString()
  }));

  res.json({
    username: user.username,
    count: log.length,
    _id: user._id,
    log
  });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
