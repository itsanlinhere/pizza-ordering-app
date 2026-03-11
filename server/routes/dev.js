const express = require('express');
const router = express.Router();
const { sendTestEmail } = require('../utils/email');

// POST /api/dev/send-test-email
// body: { email: string }
router.post('/send-test-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    await sendTestEmail(email);

    res.json({ success: true, message: 'Test email sent (or logged in server console if no SMTP configured)' });
  } catch (err) {
    console.error('Test email failed:', err && (err.message || err));
    res.status(500).json({ success: false, message: 'Failed to send test email', error: err && err.message });
  }
});

module.exports = router;
