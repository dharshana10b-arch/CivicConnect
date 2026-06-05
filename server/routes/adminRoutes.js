const express    = require('express');
const router     = express.Router();
const auth       = require('../middleware/authMiddleware');
const adminAuth  = require('../middleware/adminMiddleware');
const {
    getAdminComplaints, updateStatus,
    getHeatmapData, getAnalytics, bulkUpdate,
} = require('../controllers/adminController');

router.get('/complaints',          auth, adminAuth, getAdminComplaints);
router.put('/complaints/:id',      auth, adminAuth, updateStatus);
router.post('/complaints/bulk',    auth, adminAuth, bulkUpdate);
router.get('/heatmap',             auth, adminAuth, getHeatmapData);
router.get('/analytics',           auth, adminAuth, getAnalytics);

module.exports = router;