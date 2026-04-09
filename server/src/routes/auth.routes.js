const express = require('express');
const router = express.Router();
const auth = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/login', auth.login);
router.post('/logout', protect, auth.logout);
router.get('/me', protect, auth.getMe);
router.put('/profile', protect, auth.updateProfile);
router.put('/change-password', protect, auth.changePassword);

module.exports = router;
