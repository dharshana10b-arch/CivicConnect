const User      = require('../models/User');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');

// ─── REGISTER (users only) ────────────────────────────────────────────────────
let mockUsers = [];

exports.register = async (req, res) => {
    try {
        const { name, email, password, avatar, locality } = req.body;

        if (require('mongoose').connection.readyState !== 1) {
            const token = jwt.sign({ id: 'mock123', role: 'user' }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
            return res.status(201).json({
                message: 'Mock Registration successful (DB Offline)',
                token,
                user: { id: 'mock123', name, email, avatar, locality, points: 0, role: 'user', avatarLevel: 'Basic' }
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email already registered' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name, email,
            password: hashedPassword,
            avatar, locality,
            role: 'user',
        });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: user._id, name: user.name, email: user.email,
                avatar: user.avatar, locality: user.locality,
                points: user.points, role: user.role,
                avatarLevel: user.avatarLevel,
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ─── LOGIN (users + admins) ───────────────────────────────────────────────────
exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        // role = 'user' | 'admin' — sent from frontend toggle

        if (require('mongoose').connection.readyState !== 1) {
            const token = jwt.sign({ id: 'mock123', role: role || 'user' }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
            return res.status(200).json({
                message: 'Mock Login successful (DB Offline)',
                token,
                user: { id: 'mock123', name: email || 'Test User', email, avatar: role === 'admin' ? '👮' : '🦁', locality: 'Mock City', points: 100, role: role || 'user', avatarLevel: 'Basic' }
            });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid email or password' });

        // Role mismatch
        if (role && user.role !== role) {
            return res.status(403).json({
                message: role === 'admin'
                    ? 'This account is not an admin account'
                    : 'Please use the Admin login for admin accounts'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id:           user._id,
                name:         user.name,
                email:        user.email,
                avatar:       user.avatar,
                locality:     user.locality,
                points:       user.points,
                role:         user.role,
                avatarLevel:  user.avatarLevel,
                assignedArea: user.assignedArea,
                adminId:      user.adminId,
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ─── GET ME ───────────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
    try {
        if (require('mongoose').connection.readyState !== 1) {
            return res.status(200).json({ user: { _id: req.user.id, name: 'Test User', email: 'test@example.com', avatar: '🦁', locality: 'Mock City', points: 150, role: req.user.role, avatarLevel: 'Gold' } });
        }
        const user = await User.findById(req.user.id).select('-password');
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ─── UPDATE AVATAR ────────────────────────────────────────────────────────────
exports.updateAvatar = async (req, res) => {
    try {
        const { avatar } = req.body;
        if (require('mongoose').connection.readyState !== 1) {
            return res.status(200).json({ user: { _id: req.user.id, name: 'Test User', email: 'test@example.com', avatar, locality: 'Mock City', points: 150, role: 'user', avatarLevel: 'Gold' } });
        }
        const user = await User.findByIdAndUpdate(
            req.user.id, { avatar }, { new: true }
        ).select('-password');
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
exports.getLeaderboard = async (req, res) => {
    try {
        if (require('mongoose').connection.readyState !== 1) {
            return res.status(200).json({ leaders: [
                { _id: '1', name: 'Mock Legend', points: 500, avatar: '🦅', locality: 'City Center' },
                { _id: '2', name: 'Test User', points: 150, avatar: '🦁', locality: 'Mock City' }
            ]});
        }
        const leaders = await User.find({ role: 'user' })
            .select('-password')
            .sort({ points: -1 })
            .limit(50);
        res.status(200).json({ leaders });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ─── CREATE ADMIN (run once from Postman/terminal to seed admin account) ──────
exports.createAdmin = async (req, res) => {
    try {
        const { name, email, password, assignedArea, adminId } = req.body;

        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Email already exists' });

        const hashed = await bcrypt.hash(password, 10);
        const admin  = await User.create({
            name, email,
            password:     hashed,
            role:         'admin',
            locality:     assignedArea,
            assignedArea,
            adminId:      adminId || `ADMIN-${Date.now()}`,
            avatar:       '👮',
        });

        res.status(201).json({
            message: 'Admin created successfully',
            admin: { id: admin._id, name: admin.name, adminId: admin.adminId, assignedArea: admin.assignedArea }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};