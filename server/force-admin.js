const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const email = 'admin@civic.com';
        let adminUser = await User.findOne({ email });

        if (!adminUser) {
            console.log('User not found. Creating anew.');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            adminUser = await User.create({
                name: 'System Admin',
                email: email,
                password: hashedPassword,
                role: 'admin',
                locality: 'Chennai',
                assignedArea: 'Chennai',
                adminId: 'ADMIN-PRESET',
                avatar: '👮'
            });
        } else {
            console.log(`User found! Current role: ${adminUser.role}`);
            if (adminUser.role !== 'admin') {
                console.log('Role was NOT admin. Fixing it now...');
                adminUser.role = 'admin';
                await adminUser.save();
                console.log('User role successfully updated to admin.');
            } else {
                console.log('Role is ALREADY admin. Checking password...');
                const isMatch = await bcrypt.compare('admin123', adminUser.password);
                console.log(`Password match for 'admin123': ${isMatch}`);
                if (!isMatch) {
                   console.log('Password was wrong. Updating password...');
                   adminUser.password = await bcrypt.hash('admin123', 10);
                   await adminUser.save();
                }
            }
        }
        
        console.log('--- ALL GOOD. FINISHED. ---');
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
run();
