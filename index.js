
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
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  const user = users.find(u => u._id === _id);

  if (!user) {
    return res.status(404).json({
      error: 'User not found'
    });
  }

  if (
    typeof description !== 'string' ||
    !description.trim() ||
    duration === undefined ||
    duration === ''
  ) {
    return res.status(400).json({
      error: 'description and duration are required'
    });
  }

  const durationNum = Number(duration);

  if (!Number.isFinite(durationNum) || durationNum <= 0) {
    return res.status(400).json({
      error: 'duration must be a positive number'
    });
  }

  const dateObj = date
    ? new Date(date)
    : new Date();

  if (isNaN(dateObj.getTime())) {
    return res.status(400).json({
      error: 'invalid date'
    });
  }

  const exercise = {
    userId: user._id,
    description: description.trim(),
    duration: durationNum,
    date: dateObj.toDateString()
  };

  exercises.push(exercise);

  res.json({
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date,
    _id: user._id
  });
});

// D. Get Exercise Logs
app.get('/api/users/:_id/logs', (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  const user = users.find(u => u._id === _id);

  if (!user) {
    return res.status(404).json({
      error: 'User not found'
    });
  }

  // Get exercises belonging to this user
  let userExercises = exercises.filter(
    exercise => exercise.userId === user._id
  );

  // Validate and filter FROM date
  if (from) {
    const fromDate = new Date(from);

    if (isNaN(fromDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid from date'
      });
    }

    userExercises = userExercises.filter(
      exercise => new Date(exercise.date) >= fromDate
    );
  }

  // Validate and filter TO date
  if (to) {
    const toDate = new Date(to);

    if (isNaN(toDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid to date'
      });
    }

    toDate.setHours(23, 59, 59, 999);

    userExercises = userExercises.filter(
      exercise => new Date(exercise.date) <= toDate
    );
  }

  // Validate and apply LIMIT
  if (limit !== undefined) {
    const limitNumber = Number(limit);

    if (!Number.isInteger(limitNumber) || limitNumber < 0) {
      return res.status(400).json({
        error: 'Invalid limit'
      });
    }

    userExercises = userExercises.slice(0, limitNumber);
  }

  // Prepare log response
  const log = userExercises.map(exercise => ({
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date
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
