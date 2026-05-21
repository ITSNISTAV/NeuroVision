const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./src/models/User');

// Load env vars
dotenv.config();

const seedUsers = async () => {
  try {
    // 1. Connect to DB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for seeding...');

    // 2. Clear existing users (Optional)
    // await User.deleteMany();
    // console.log('Existing users cleared.');

    // 3. Create a test user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const adminUser = {
      name: 'Admin User',
      email: 'admin@neurovision.com',
      password: hashedPassword,
      role: 'admin',
      profilePic: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
    };

    // 4. Check if already exists to avoid duplicates
    const exists = await User.findOne({ email: adminUser.email });
    if (!exists) {
      await User.create(adminUser);
      console.log('User data seeded successfully!');
    } else {
      console.log('User already exists, skipping seed.');
    }

    // 5. Close connection
    mongoose.connection.close();
    process.exit();
  } catch (error) {
    console.error(`Error with seeding: ${error.message}`);
    process.exit(1);
  }
};

seedUsers();
