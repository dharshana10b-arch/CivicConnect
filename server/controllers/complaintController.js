const Complaint  = require('../models/Complaint');
const cloudinary = require('cloudinary').v2;
const { analyzeImageSeverity } = require('./aiController');
const axios = require('axios');

let mockComplaints = [];

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Timeout helper ───────────────────────────────────────────────────────────
const withTimeout = (promise, ms, fallback) =>
    Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
    ]).catch(() => fallback);

// ─── Get Vision labels ────────────────────────────────────────────────────────
const getVisionLabels = async (imageUrl) => {
    try {
        const response = await withTimeout(
            axios.post(
                `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
                {
                    requests: [{
                        image: { source: { imageUri: imageUrl } },
                        features: [
                            { type: 'LABEL_DETECTION',     maxResults: 15 },
                            { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
                        ]
                    }]
                },
                { timeout: 10000 }
            ),
            10000,
            null
        );
        if (!response) return [];
        const labels  = (response.data.responses[0].labelAnnotations          || []).map(l => l.description.toLowerCase());
        const objects = (response.data.responses[0].localizedObjectAnnotations || []).map(o => o.name.toLowerCase());
        return [...new Set([...labels, ...objects])];
    } catch (_) { return []; }
};

// ─── Smart duplicate finder ───────────────────────────────────────────────────
// Checks BOTH text similarity AND image similarity
// Returns the existing complaint if duplicate found, null otherwise
const findDuplicate = async (department, locality, newLabels) => {
    if (require('mongoose').connection.readyState !== 1) return null; // MOCK DB MODE bypass

    // Find ALL open complaints in same department + locality (no time limit)
    const existing = await Complaint.find({
        department,
        locality:  new RegExp(locality.trim(), 'i'),
        status:    { $ne: 'Resolved' },
    }).limit(50);

    if (existing.length === 0) return null;

    let bestMatch  = null;
    let bestScore  = 0;

    for (const complaint of existing) {
        const storedLabels = complaint.visionLabels || [];
        if (storedLabels.length === 0) continue;

        // Count matching labels
        const matchingLabels = newLabels.filter(l => storedLabels.includes(l));
        const score          = matchingLabels.length;

        // Calculate match percentage
        const matchPct = newLabels.length > 0
            ? (matchingLabels.length / Math.min(newLabels.length, storedLabels.length)) * 100
            : 0;

        console.log(`Comparing with "${complaint.title}": ${score} matching labels (${matchPct.toFixed(0)}%)`);

        // Consider duplicate if 40%+ labels match OR 4+ labels match
        if ((matchPct >= 40 || score >= 4) && score > bestScore) {
            bestScore = score;
            bestMatch = complaint;
        }
    }

    return bestMatch;
};

// ─── CREATE COMPLAINT ─────────────────────────────────────────────────────────
exports.createComplaint = async (req, res) => {
    try {
        const { title, description, department, locality } = req.body;

        // 1. Upload image to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder:  'civicconnect',
            timeout: 30000,
        });

        // 2. Get Vision labels + severity analysis simultaneously
        const [visionLabels, analysis] = await Promise.all([
            getVisionLabels(result.secure_url),
            analyzeImageSeverity(result.secure_url, department),
        ]);

        const severity        = analysis.severity            || 'Medium';
        const wrongDepartment = analysis.wrongDepartment     || false;
        const suggestedDept   = analysis.suggestedDepartment || null;
        const allLabels       = [...new Set([...visionLabels, ...(analysis.labels || [])])];

        console.log(`New complaint labels (${allLabels.length}):`, allLabels.slice(0,8).join(', '));

        // 3. Smart duplicate detection — checks all open complaints, no time limit
        const duplicate = await findDuplicate(department, locality, allLabels);

        if (duplicate) {
            // BLOCK the submission — return the existing complaint
            console.log(`Duplicate found: "${duplicate.title}" (ID: ${duplicate._id})`);
            return res.status(409).json({
                isDuplicate: true,
                message:     'A similar complaint already exists in your area!',
                existingComplaint: {
                    _id:          duplicate._id,
                    title:        duplicate.title,
                    status:       duplicate.status,
                    severity:     duplicate.severity,
                    priorityScore:duplicate.priorityScore,
                    upvotes:      duplicate.upvotes?.length || 0,
                    createdAt:    duplicate.createdAt,
                    image:        duplicate.image,
                },
            });
        }

        // 4. No duplicate — save complaint
        const severityMap   = { Low: 1, Medium: 2, High: 3, Emergency: 4 };
        const priorityScore = (severityMap[severity] || 2) * 10;
        
        // MOCK DB MODE
        if (require('mongoose').connection.readyState !== 1) {
            const complaint = {
                _id: Math.random().toString(36).substring(2, 10),
                title, description,
                image: result.secure_url || 'https://via.placeholder.com/300',
                department, severity, locality,
                user: { id: req.user.id, name: 'Test User', avatar: '🦁', locality: locality, avatarLevel: 'Basic' },
                priorityScore,
                status: 'Pending',
                isDuplicate: false,
                visionLabels: allLabels,
                createdAt: new Date(),
                upvotes: [], downvotes: []
            };
            mockComplaints.push(complaint);
            
            return res.status(201).json({
                message: 'Complaint submitted successfully (DB Offline)',
                complaint, severity,
                isDuplicate: false,
                wrongDepartment,
                suggestedDepartment: suggestedDept,
                duplicateComplaint:  null,
            });
        }

        const complaint = await Complaint.create({
            title, description,
            image:        result.secure_url,
            department,   severity, locality,
            user:         req.user.id,
            priorityScore,
            isDuplicate:  false,
            visionLabels: allLabels,
        });

        // 5. Award points + update avatar level
        const severityPoints = { Low: 10, Medium: 20, High: 30, Emergency: 50 };
        const updatedUser    = await require('../models/User').findByIdAndUpdate(
            req.user.id,
            { $inc: { points: severityPoints[severity] || 10 } },
            { new: true }
        );

        let avatarLevel = 'Basic';
        if (updatedUser.points > 200)      avatarLevel = 'Legend';
        else if (updatedUser.points > 100) avatarLevel = 'Gold';
        else if (updatedUser.points > 50)  avatarLevel = 'Silver';
        await require('../models/User').findByIdAndUpdate(req.user.id, { avatarLevel });

        // Real-time notification to admin dashboard
        const io = req.app.get('io');
        if (io) {
            io.to(`admin-${locality}`).emit('newComplaint', {
                complaint: {
                    _id:          complaint._id,
                    title:        complaint.title,
                    department:   complaint.department,
                    severity:     complaint.severity,
                    locality:     complaint.locality,
                    status:       complaint.status,
                    priorityScore:complaint.priorityScore,
                    createdAt:    complaint.createdAt,
                },
                message: `New ${severity} complaint filed in ${locality}!`,
            });
        }

        res.status(201).json({
            message: 'Complaint submitted successfully',
            complaint, severity,
            isDuplicate: false,
            wrongDepartment,
            suggestedDepartment: suggestedDept,
            duplicateComplaint:  null,
        });

    } catch (error) {
        console.error('createComplaint error:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ─── GET ALL COMPLAINTS ───────────────────────────────────────────────────────
exports.getAllComplaints = async (req, res) => {
    try {
        const { department, locality, status } = req.query;
        
        if (require('mongoose').connection.readyState !== 1) {
            let filtered = mockComplaints;
            if (department) filtered = filtered.filter(c => c.department === department);
            if (locality)   filtered = filtered.filter(c => c.locality.toLowerCase().includes(locality.toLowerCase()));
            if (status && status !== 'All') filtered = filtered.filter(c => c.status === status);
            return res.status(200).json({ complaints: filtered });
        }

        const query = { isDuplicate: false };
        if (department) query.department = department;
        if (locality)   query.locality   = new RegExp(locality, 'i');
        if (status && status !== 'All') query.status = status;
        const complaints = await Complaint.find(query)
            .populate('user', 'name avatar locality avatarLevel')
            .sort({ priorityScore: -1, createdAt: -1 });
        res.status(200).json({ complaints });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ─── GET SINGLE COMPLAINT ─────────────────────────────────────────────────────
exports.getComplaint = async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id)
            .populate('user', 'name avatar locality avatarLevel');
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
        res.status(200).json({ complaint });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ─── VOTE ON COMPLAINT ────────────────────────────────────────────────────────
exports.voteComplaint = async (req, res) => {
    try {
        const { voteType } = req.body;
        const complaint    = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
        const userId = req.user.id;
        if (voteType === 'upvote') {
            if (complaint.upvotes.includes(userId)) complaint.upvotes.pull(userId);
            else { complaint.upvotes.push(userId); complaint.downvotes.pull(userId); }
        } else {
            if (complaint.downvotes.includes(userId)) complaint.downvotes.pull(userId);
            else { complaint.downvotes.push(userId); complaint.upvotes.pull(userId); }
        }
        const severityMap = { Low:1, Medium:2, High:3, Emergency:4 };
        complaint.priorityScore = (severityMap[complaint.severity]*10) +
            (complaint.upvotes.length - complaint.downvotes.length);
        await complaint.save();
        res.status(200).json({ message: 'Vote recorded', complaint });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ─── GET MY COMPLAINTS ────────────────────────────────────────────────────────
exports.getMyComplaints = async (req, res) => {
    try {
        if (require('mongoose').connection.readyState !== 1) {
            const filtered = mockComplaints.filter(c => String(c.user.id) === String(req.user.id));
            return res.status(200).json({ complaints: filtered });
        }
        
        const complaints = await Complaint.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({ complaints });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};