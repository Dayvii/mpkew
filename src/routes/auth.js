const express = require('express');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { redirectIfAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /auth/register
router.get('/register', redirectIfAuth, (req, res) => {
  res.render('auth/register', { error: null });
});

// POST /auth/register
router.post('/register', redirectIfAuth, async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.render('auth/register', { error: 'An account with that email already exists.' });
    }

    if (!name || !email || !password || password.length < 8) {
      return res.render('auth/register', { error: 'Please fill all fields. Password must be at least 8 characters.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    // Log in immediately after registration
    req.session.user = { id: user.id, name: user.name, email: user.email };
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.render('auth/register', { error: 'Something went wrong. Please try again.' });
  }
});

// GET /auth/login
router.get('/login', redirectIfAuth, (req, res) => {
  res.render('auth/login', { error: null });
});

// POST /auth/login
router.post('/login', redirectIfAuth, async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.render('auth/login', { error: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render('auth/login', { error: 'Invalid email or password.' });
    }

    req.session.user = { id: user.id, name: user.name, email: user.email };
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.render('auth/login', { error: 'Something went wrong. Please try again.' });
  }
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
