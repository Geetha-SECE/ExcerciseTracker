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

// Parse yyyy-mm-dd strings in local time to prevent UTC timezone shifts
function parseLocalDate(dateStr) {
  if (!dateStr) return new Date();

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (match) {
    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return new Date(dateStr);
}

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// A. Create User
app.post('/api/users', (req, res) => {
  const username = req.body.username;

  if (!username || !username.trim()) {
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

// B. Get All Users
app.get('/api/users', (req, res) => {
  res.json(users);
});

// C. Add Exercise
app.post('/api/users/:_id/exercises', (req, res) => {
  const user = users.find(u => u._id === req.params._id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
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

  const exerciseDate = parseLocalDate(date);

  if (isNaN(exerciseDate.getTime())) {
    return res.status(400).json({ error: 'Invalid date' });
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

// D. Get Exercise Logs
app.get('/api/users/:_id/logs', (req, res) => {
  const user = users.find(u => u._id === req.params._id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { from, to, limit } = req.query;

  let userExercises = exercises.filter(
    exercise => exercise.userId === user._id
  );

  if (from) {
    const fromDate = parseLocalDate(from);

    if (isNaN(fromDate.getTime())) {
      return res.status(400).json({ error: 'Invalid from date' });
    }

    fromDate.setHours(0, 0, 0, 0);

    userExercises = userExercises.filter(
      exercise => exercise.date >= fromDate
    );
  }

  if (to) {
    const toDate = parseLocalDate(to);

    if (isNaN(toDate.getTime())) {
      return res.status(400).json({ error: 'Invalid to date' });
    }

    toDate.setHours(23, 59, 59, 999);

    userExercises = userExercises.filter(
      exercise => exercise.date <= toDate
    );
  }

  if (limit !== undefined) {
    const limitNum = parseInt(limit, 10);

    if (!Number.isInteger(limitNum) || limitNum < 0) {
      return res.status(400).json({ error: 'Invalid limit' });
    }

    userExercises = userExercises.slice(0, limitNum);
  }

  const log = userExercises.map(exercise => ({
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString()
  }));

  res.json({
    username: user.username,
    count: log.length,
    _id: user._id,
    log: log
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
