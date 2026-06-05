const Complaint = require('../models/Complaint');
const User = require('../models/User');
const axios = require('axios');

// ─── GET all departments with complaint counts for user's locality ─────────────
exports.getDepartments = async (req, res) => {
  try {
    const { locality } = req.query;

    const departments = ['Water', 'Electricity', 'Waste', 'Roads', 'Sanitation', 'Other'];

    if (require('mongoose').connection.readyState !== 1) {
        const mockStats = departments.map(dept => ({ department: dept, total: 0, pending: 0, progress: 0, resolved: 0, emergency: 0 }));
        return res.status(200).json({ departments: mockStats });
    }

    const deptStats = await Promise.all(
      departments.map(async (dept) => {
        const query = locality ? { department: dept, locality: new RegExp(locality, 'i') } : { department: dept };
        const total    = await Complaint.countDocuments(query);
        const pending  = await Complaint.countDocuments({ ...query, status: 'Pending' });
        const progress = await Complaint.countDocuments({ ...query, status: 'In Progress' });
        const resolved = await Complaint.countDocuments({ ...query, status: 'Resolved' });
        const emergency= await Complaint.countDocuments({ ...query, severity: 'Emergency' });

        return { department: dept, total, pending, progress, resolved, emergency };
      })
    );

    res.status(200).json({ departments: deptStats });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── GET complaints for a specific department (with locality filter) ───────────
exports.getDepartmentComplaints = async (req, res) => {
  try {
    const { department } = req.params;
    const { locality, status } = req.query;

    if (require('mongoose').connection.readyState !== 1) {
        return res.status(200).json({ complaints: [], grouped: { pending: [], inProgress: [], resolved: [] }, total: 0 });
    }

    const query = { department };
    if (locality) query.locality = new RegExp(locality, 'i');
    if (status && status !== 'All') query.status = status;

    const complaints = await Complaint.find(query)
      .populate('user', 'name avatar avatarLevel locality')
      .sort({ priorityScore: -1, createdAt: -1 });

    // Group by status
    const grouped = {
      pending:    complaints.filter(c => c.status === 'Pending'),
      inProgress: complaints.filter(c => c.status === 'In Progress'),
      resolved:   complaints.filter(c => c.status === 'Resolved'),
    };

    res.status(200).json({ complaints, grouped, total: complaints.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── GET community complaints for a locality (dashboard) ──────────────────────
exports.getCommunityComplaints = async (req, res) => {
  try {
    const { locality } = req.query;
    if (!locality) return res.status(400).json({ message: 'Locality required' });

    if (require('mongoose').connection.readyState !== 1) {
        return res.status(200).json({ complaints: [] });
    }

    const complaints = await Complaint.find({
      locality: new RegExp(locality, 'i'),
      isDuplicate: false,
    })
      .populate('user', 'name avatar avatarLevel')
      .sort({ priorityScore: -1, createdAt: -1 })
      .limit(20);

    res.status(200).json({ complaints });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── GET top 3 scorers in a locality ──────────────────────────────────────────
exports.getLocalTopScorers = async (req, res) => {
  try {
    const { locality } = req.query;
    if (!locality) return res.status(400).json({ message: 'Locality required' });

    if (require('mongoose').connection.readyState !== 1) {
        return res.status(200).json({ topUsers: [] });
    }

    const topUsers = await User.find({
      locality: new RegExp(locality, 'i'),
      role: 'user',
    })
      .select('name avatar avatarLevel points locality')
      .sort({ points: -1 })
      .limit(3);

    res.status(200).json({ topUsers });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── Image similarity check using Google Vision labels ────────────────────────
exports.checkImageSimilarity = async (req, res) => {
  try {
    const { imageUrl, department, locality } = req.body;
    if (!imageUrl || !department || !locality) {
      return res.status(400).json({ message: 'imageUrl, department and locality required' });
    }

    // Get Vision API labels for uploaded image
    const visionRes = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
      {
        requests: [{
          image: { source: { imageUri: imageUrl } },
          features: [
            { type: 'LABEL_DETECTION', maxResults: 10 },
            { type: 'OBJECT_LOCALIZATION', maxResults: 5 },
          ]
        }]
      }
    );

    const labels  = (visionRes.data.responses[0].labelAnnotations  || []).map(l => l.description.toLowerCase());
    const objects = (visionRes.data.responses[0].localizedObjectAnnotations || []).map(o => o.name.toLowerCase());
    const newTags = [...new Set([...labels, ...objects])];

    // Find existing open complaints in same dept + locality
    const existing = await Complaint.find({
      department,
      locality: new RegExp(locality, 'i'),
      status: { $ne: 'Resolved' },
      visionLabels: { $exists: true, $ne: [] },
    }).limit(20);

    // Compare labels — if 3+ labels match, consider duplicate
    let bestMatch   = null;
    let bestScore   = 0;

    for (const complaint of existing) {
      const existingTags = complaint.visionLabels || [];
      const common = newTags.filter(t => existingTags.includes(t));
      const score  = common.length;
      if (score >= 3 && score > bestScore) {
        bestScore = score;
        bestMatch = complaint;
      }
    }

    if (bestMatch) {
      return res.status(200).json({
        isDuplicate: true,
        matchScore: bestScore,
        existingComplaint: {
          _id:          bestMatch._id,
          title:        bestMatch.title,
          status:       bestMatch.status,
          severity:     bestMatch.severity,
          priorityScore:bestMatch.priorityScore,
          image:        bestMatch.image,
          upvotes:      bestMatch.upvotes?.length || 0,
        }
      });
    }

    res.status(200).json({ isDuplicate: false, labels: newTags });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─── GET community messages for a locality ────────────────────────────────────
exports.getCommunityMessages = async (req, res) => {
  try {
    const { locality } = req.query;
    if (!locality) return res.status(400).json({ message: 'Locality required' });

    if (require('mongoose').connection.readyState !== 1) {
        return res.status(200).json({ messages: [] });
    }

    // Use complaint status updates as community messages
    const recentActivity = await Complaint.find({
      locality: new RegExp(locality, 'i'),
    })
      .populate('user', 'name avatar avatarLevel')
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('title status severity department user updatedAt createdAt upvotes');

    const messages = recentActivity.map(c => ({
      type: c.status === 'Resolved' ? 'resolved' : c.status === 'In Progress' ? 'progress' : 'new',
      text: c.status === 'Resolved'
        ? `✅ "${c.title}" has been resolved!`
        : c.status === 'In Progress'
        ? `🔧 "${c.title}" is now being addressed by ${c.department} dept.`
        : `📍 New ${c.severity} issue: "${c.title}" reported in ${c.department}`,
      user:      c.user,
      time:      c.updatedAt,
      complaintId: c._id,
      upvotes:   c.upvotes?.length || 0,
    }));

    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};