const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const dotenv     = require('dotenv');
const http       = require('http');
const { Server } = require('socket.io');
const User       = require('./models/User');
const bcrypt     = require('bcryptjs');

dotenv.config();

const app    = express();
const server = http.createServer(app);

// ─── Socket.io — real-time notifications ─────────────────────────────────────
const io = new Server(server, {
    cors: {
        origin:      'http://localhost:3000',
        methods:     ['GET','POST'],
        credentials: true,
    }
});

// Make io available in controllers
app.set('io', io);

io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Admin joins their area room to get notifications
    socket.on('joinAdminRoom', (area) => {
        socket.join(`admin-${area}`);
        console.log(`Admin joined room: admin-${area}`);
    });

    // User joins their locality room
    socket.on('joinLocalityRoom', (locality) => {
        socket.join(`locality-${locality}`);
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
    });
});

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
    origin:         'http://localhost:3000',
    credentials:    true,
    methods:        ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
}));
// preflight handled by cors middleware

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
const authRoutes       = require('./routes/authRoutes');
const complaintRoutes  = require('./routes/complaintRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const adminRoutes      = require('./routes/adminRoutes');

app.use('/api/auth',        authRoutes);
app.use('/api/complaints',  complaintRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/admin',       adminRoutes);

app.get('/', (req, res) => res.send('CivicConnect Server Running!'));

// ─── MongoDB + Start ──────────────────────────────────────────────────────────
async function startServer() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected Successfully!');
    } catch (err) {
        console.log('MongoDB Connection Failed:', err.message);
        console.log('⚠️ Running in MOCK DB MODE. Authentication and Complaints will use local memory array.');
    }

    // ─── SEED PRESET ADMIN ───
    if (mongoose.connection.readyState === 1) {
        try {
            const presetEmail = 'admin@civic.com';
            const presetPassword = 'admin123';
            const existingAdmin = await User.findOne({ email: presetEmail });
            
            if (!existingAdmin) {
                const hashedPassword = await bcrypt.hash(presetPassword, 10);
                await User.create({
                    name: 'System Admin',
                    email: presetEmail,
                    password: hashedPassword,
                    role: 'admin',
                    locality: 'Chennai',
                    assignedArea: 'Chennai',
                    adminId: 'ADMIN-PRESET',
                    avatar: '👮',
                });
                console.log(`\n✅ Preset Admin Created! Email: ${presetEmail} | Password: ${presetPassword}\n`);
            } else {
                console.log('\n✅ Preset Admin already exists in Database.\n');
            }
        } catch (seedErr) {
            console.error('Failed to seed preset admin:', seedErr);
        }
    }

    server.listen(process.env.PORT || 5000, () => {
        console.log('Server running on port 5000');
    });
}
startServer();