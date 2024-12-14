const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = 'mongodb://localhost:27017/loginApp';

async function initializeDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing users
        await User.deleteMany({});
        console.log('Cleared existing users');

        // Create default users
        const defaultUsers = [
            {
                username: "user@gmail.com",
                password: "123"
            },
            {
                username: "admin@gmail.com",
                password: "123"
            }
        ];

        await User.create(defaultUsers);
        console.log('Default users created');

        await mongoose.disconnect();
        console.log('Database initialization complete');
    } catch (error) {
        console.error('Database initialization failed:', error);
    }
}

initializeDB(); 