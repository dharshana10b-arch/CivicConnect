const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    department: {
        type: String,
        enum: ['Water', 'Electricity', 'Waste', 'Roads', 'Sanitation', 'Other'],
        required: true
    },
    severity: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Emergency'],
        default: 'Low'
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Resolved'],
        default: 'Pending'
    },
    locality: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    upvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    downvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    priorityScore: {
        type: Number,
        default: 0
    },
    isDuplicate: {
        type: Boolean,
        default: false
    },
    // Google Vision labels stored for image similarity matching
    visionLabels: [{
        type: String
    }]
}, { timestamps: true });

// ← Fix: prevents "OverwriteModelError" when nodemon reloads
module.exports = mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);