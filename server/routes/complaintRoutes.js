const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const auth    = require('../middleware/authMiddleware');
const {
    createComplaint,
    getAllComplaints,
    getComplaint,
    voteComplaint,
    getMyComplaints,
} = require('../controllers/complaintController');

// ─── Multer config — store uploaded images temporarily ────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const ext     = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime    = allowed.test(file.mimetype);
        if (ext && mime) cb(null, true);
        else cb(new Error('Only image files are allowed'));
    },
});

// ─── Routes ───────────────────────────────────────────────────────────────────
router.post('/',              auth, upload.single('image'), createComplaint);
router.get('/',               getAllComplaints);
router.get('/my',             auth, getMyComplaints);
router.get('/:id',            getComplaint);
router.post('/:id/vote',      auth, voteComplaint);

module.exports = router;