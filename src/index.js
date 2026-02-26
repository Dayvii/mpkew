require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const path = require('path');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const { requireAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL pool for sessions
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Sessions
app.use(session({
  store: new pgSession({ pool, createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  },
}));

// Make user available in all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Routes
app.get('/', (req, res) => res.render('home'));
app.use('/auth', authRoutes);
app.use('/dashboard', requireAuth, dashboardRoutes);

// 404 handler
app.use((req, res) => res.status(404).render('404'));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
