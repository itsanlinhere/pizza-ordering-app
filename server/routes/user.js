const express = require('express');
const router = express.Router();

// Minimal user routes (stubs)
router.get('/', (req, res) => {
  res.json({ success: true, message: 'User API (stub)' });
});

module.exports = router;
