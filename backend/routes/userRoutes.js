const express = require('express');
const { protect } = require('../middlewares/auth'); // Ensure you have the protect middleware imported
const { registerUser, authUser, logoutUser, getProfile } = require('../controllers/userController');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/logout', logoutUser);
router.get('/profile', protect, getProfile); // Add this line

module.exports = router;
