const express = require('express');
const { protect } = require('../middlewares/auth');
const { registerUser, authUser, logoutUser, getProfile, uploadProfileImage } = require('../controllers/userController');
const upload = require('../config/multerConfig');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/logout', logoutUser);
router.get('/profile', protect, getProfile);
router.post('/upload-profile-image', protect, upload.single('profileImage'), uploadProfileImage);

module.exports = router;
