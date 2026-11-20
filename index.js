const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage
const users = [];
const exercises = [];

// Helper: generate MongoDB-style 24-char hex ID
function generateId() {
  const hex = '0123456789abcdef';
  let id = '';
  for (let i = 0; i < 24; i++) {
    id += hex[Math.floor(Math.random() * 16)];
  }
  return id;
}

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// A. Create User
app.post('/api/users', (req, res) => {
  const username = req.body.username;
  if (!username) {
    return res.status(400).json({ error: 'username is required' });
  }
  const _id = generateId();
  const user = { username, _id };
  users.push(user);
  res.json(user);
});

// B. Get All Users
app.get('/api/users', (req, res) => {
  res.json(users);
});

// C. Add Exercise
app.post('/api/users/:_id/exercises', (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  // Validate user ID
  const user = users.find(u => u._id === _id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!description || duration === undefined || duration === '') {
    return res.status(400).json({ error: 'description and duration are required' });
  }

  // Ensure duration is a number
  const durationNum = Number(duration);
  if (isNaN(durationNum)) {
    return res.status(400).json({ error: 'duration must be a number' });
  }

  // Handle date
  let dateObj;
  if (date && date.trim() !== '') {
    dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ error: 'invalid date' });
    }
  } else {
    dateObj = new Date();
  }

  const exercise = {
    _id: generateId(),
    username: user.username,
    description: String(description),
    duration: durationNum,
    date: dateObj.toDateString()
  };

  exercises.push(exercise);
  res.json({
    username: exercise.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date,
    _id: exercise._id
  });
});

// D. Get Exercise Logs
app.get('/api/users/:_id/logs', (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  const user = users.find(u => u._id === _id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  let userExercises = exercises.filter(e => e.username === user.username);

  // Apply date filter
  if (from) {
    const fromObj = new Date(from);
    if (!isNaN(fromObj.getTime())) {
      userExercises = userExercises.filter(e => new Date(e.date) >= fromObj);
    }
  }

  if (to) {
    const toObj = new Date(to);
    if (!isNaN(toObj.getTime())) {
      toObj.setHours(23, 59, 59, 999);
      userExercises = userExercises.filter(e => new Date(e.date) <= toObj);
    }
  }

  // Apply limit
  if (limit && !isNaN(Number(limit))) {
    userExercises = userExercises.slice(0, Number(limit));
  }

  const log = userExercises.map(e => ({
    description: e.description,
    duration: e.duration,
    date: e.date
  }));

  res.json({
    username: user.username,
    count: log.length,
    _id: user._id,
    log
  });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});