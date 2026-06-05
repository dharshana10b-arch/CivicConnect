const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authMiddleware');
const {
    register, login, getMe,
    updateAvatar, getLeaderboard, createAdmin,
} = require('../controllers/authController');

router.post('/register',      register);
router.post('/login',         login);
router.post('/create-admin',  createAdmin); // use from Postman to seed admin
router.get('/me',             auth, getMe);
router.put('/update-avatar',  auth, updateAvatar);
router.get('/leaderboard',    auth, getLeaderboard);

module.exports = router;