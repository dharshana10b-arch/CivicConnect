const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function run() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB successfully!');
        
        const admins = await User.find({ role: 'admin' });
        console.log('Admins found:', admins.length);
        admins.forEach(admin => {
            console.log(`Email: ${admin.email}, Role: ${admin.role}`);
        });
        
    } catch (err) {
        console.error('ERROR OCCURRED:');
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
run();
