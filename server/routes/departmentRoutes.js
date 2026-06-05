const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/authMiddleware');
const {
  getDepartments,
  getDepartmentComplaints,
  getCommunityComplaints,
  getLocalTopScorers,
  checkImageSimilarity,
  getCommunityMessages,
} = require('../controllers/departmentController');

// ── IMPORTANT: Specific routes MUST come before dynamic /:department routes ──
// Otherwise Express matches "community" as a :department param

// Specific static routes first
router.get('/community/complaints',         getCommunityComplaints);
router.get('/community/top-scorers',        getLocalTopScorers);
router.get('/community/messages',           getCommunityMessages);
router.post('/check-image-similarity', auth, checkImageSimilarity);

// Root — all departments summary
router.get('/', getDepartments);

// Dynamic route last — so "community" never accidentally matches here
router.get('/:department/complaints', getDepartmentComplaints);

module.exports = router;