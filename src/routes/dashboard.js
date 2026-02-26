const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// GET /dashboard
router.get('/', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.session.user.id },
  });
  res.render('dashboard/index', { user });
});

module.exports = router;
