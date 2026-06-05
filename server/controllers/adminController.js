const Complaint = require('../models/Complaint');
const User      = require('../models/User');

// ─── GET admin's complaints (filtered by assignedArea) ────────────────────────
exports.getAdminComplaints = async (req, res) => {
    try {
        if (require('mongoose').connection.readyState !== 1) {
            return res.status(200).json({ complaints: [], stats: { total: 0, pending: 0, inProgress: 0, resolved: 0, emergency: 0, high: 0 }, slaBreach: 0, deptBreakdown: {}, area: 'Offline' });
        }
        const admin  = await User.findById(req.user.id);
        const area   = admin.assignedArea || admin.locality;
        const { status, department, severity, sort } = req.query;

        const query = { locality: new RegExp(area, 'i') };
        if (status     && status     !== 'All') query.status     = status;
        if (department && department !== 'All') query.department = department;
        if (severity   && severity   !== 'All') query.severity   = severity;

        const sortOpt = sort === 'oldest'
            ? { createdAt: 1 }
            : sort === 'priority'
            ? { priorityScore: -1 }
            : { createdAt: -1 };

        const complaints = await Complaint.find(query)
            .populate('user', 'name avatar locality avatarLevel points')
            .sort(sortOpt);

        // Stats
        const stats = {
            total:      complaints.length,
            pending:    complaints.filter(c => c.status === 'Pending').length,
            inProgress: complaints.filter(c => c.status === 'In Progress').length,
            resolved:   complaints.filter(c => c.status === 'Resolved').length,
            emergency:  complaints.filter(c => c.severity === 'Emergency').length,
            high:       complaints.filter(c => c.severity === 'High').length,
        };

        // SLA breach — complaints pending > 48 hours
        const now      = Date.now();
        const slaHours = 48 * 60 * 60 * 1000;
        const slaBreach = complaints.filter(c =>
            c.status === 'Pending' &&
            (now - new Date(c.createdAt).getTime()) > slaHours
        ).length;

        // Department breakdown
        const deptBreakdown = {};
        complaints.forEach(c => {
            deptBreakdown[c.department] = (deptBreakdown[c.department] || 0) + 1;
        });

        res.status(200).json({ complaints, stats, slaBreach, deptBreakdown, area });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ─── UPDATE complaint status ───────────────────────────────────────────────────
exports.updateStatus = async (req, res) => {
    try {
        const { status, adminNote } = req.body;
        if (require('mongoose').connection.readyState !== 1) {
            return res.status(200).json({ message: `Status updated to ${status} (Offline Mode)`, complaint: { _id: req.params.id, status } });
        }
        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { status, ...(adminNote && { adminNote }) },
            { new: true }
        ).populate('user', 'name avatar locality');

        if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
        res.status(200).json({ message: `Status updated to ${status}`, complaint });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ─── GET heatmap data ─────────────────────────────────────────────────────────
exports.getHeatmapData = async (req, res) => {
    try {
        if (require('mongoose').connection.readyState !== 1) {
            return res.status(200).json({ heatmap: {}, alerts: [], area: 'Offline', total: 0 });
        }
        const admin = await User.findById(req.user.id);
        const area  = admin.assignedArea || admin.locality;

        const complaints = await Complaint.find({
            locality: new RegExp(area, 'i'),
            status:   { $ne: 'Resolved' },
        }).select('department severity locality createdAt status priorityScore');

        // Group by department for heatmap intensity
        const heatmap = {};
        complaints.forEach(c => {
            const key = c.department;
            if (!heatmap[key]) heatmap[key] = { count:0, emergency:0, high:0, medium:0, low:0, totalScore:0 };
            heatmap[key].count++;
            heatmap[key].totalScore += c.priorityScore || 0;
            const sev = c.severity?.toLowerCase();
            if (sev === 'emergency') heatmap[key].emergency++;
            else if (sev === 'high') heatmap[key].high++;
            else if (sev === 'medium') heatmap[key].medium++;
            else heatmap[key].low++;
        });

        // Predictive alerts — 3+ same dept complaints = likely systemic issue
        const alerts = Object.entries(heatmap)
            .filter(([, v]) => v.count >= 3)
            .map(([dept, v]) => ({
                department: dept,
                count:      v.count,
                message:    `${v.count} ${dept} complaints detected — possible systemic issue in ${area}`,
                severity:   v.emergency > 0 ? 'Emergency' : v.high > 0 ? 'High' : 'Medium',
            }));

        res.status(200).json({ heatmap, alerts, area, total: complaints.length });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ─── GET analytics ────────────────────────────────────────────────────────────
exports.getAnalytics = async (req, res) => {
    try {
        if (require('mongoose').connection.readyState !== 1) {
            return res.status(200).json({ daily: {}, avgResolutionHours: 0, totalFiled: 0, totalResolved: 0, resolutionRate: 0, topReporters: [], area: 'Offline' });
        }
        const admin = await User.findById(req.user.id);
        const area  = admin.assignedArea || admin.locality;

        const all = await Complaint.find({ locality: new RegExp(area, 'i') })
            .sort({ createdAt: 1 });

        // Last 7 days daily counts
        const daily = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toLocaleDateString('en-IN', { month:'short', day:'numeric' });
            daily[key] = { filed:0, resolved:0 };
        }
        all.forEach(c => {
            const key = new Date(c.createdAt).toLocaleDateString('en-IN', { month:'short', day:'numeric' });
            if (daily[key]) {
                daily[key].filed++;
                if (c.status === 'Resolved') daily[key].resolved++;
            }
        });

        // Avg resolution time (resolved complaints)
        const resolved  = all.filter(c => c.status === 'Resolved');
        const avgResTime = resolved.length > 0
            ? Math.round(resolved.reduce((sum, c) =>
                sum + (new Date(c.updatedAt) - new Date(c.createdAt)), 0
              ) / resolved.length / (1000*60*60))
            : 0;

        // Top reporters in area
        const topReporters = await User.find({
            locality: new RegExp(area, 'i'),
            role:     'user',
        }).select('name avatar avatarLevel points').sort({ points: -1 }).limit(5);

        res.status(200).json({
            daily,
            avgResolutionHours: avgResTime,
            totalFiled:         all.length,
            totalResolved:      resolved.length,
            resolutionRate:     all.length > 0 ? Math.round((resolved.length/all.length)*100) : 0,
            topReporters,
            area,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ─── Bulk status update ───────────────────────────────────────────────────────
exports.bulkUpdate = async (req, res) => {
    try {
        const { ids, status } = req.body;
        if (require('mongoose').connection.readyState !== 1) {
            return res.status(200).json({ message: `${ids.length} complaints updated to ${status} (Offline Mode)` });
        }
        await Complaint.updateMany({ _id: { $in: ids } }, { status });
        res.status(200).json({ message: `${ids.length} complaints updated to ${status}` });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};