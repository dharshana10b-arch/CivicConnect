const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name:       { type: String, required: true },
    email:      { type: String, required: true, unique: true },
    password:   { type: String, required: true },
    avatar:     { type: String, default: '🦁' },
    avatarLevel:{ type: String, enum: ['Basic','Silver','Gold','Legend'], default: 'Basic' },
    points:     { type: Number, default: 0 },
    locality:   { type: String, required: true },
    role:       { type: String, enum: ['user','admin'], default: 'user' },

    // Admin-only fields
    assignedArea:  { type: String, default: null }, // locality admin manages
    adminId:       { type: String, default: null },  // unique admin ID e.g. "ADMIN-CHN-001"
    department:    { type: String, default: null },  // which dept admin oversees (optional)
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);