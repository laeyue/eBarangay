import mongoose from 'mongoose';
import User from './models/User';

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/barangay-connect');
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// Seed admin user
const seedAdmin = async () => {
  try {
    await connectDB();

    // Check if admin exists
    const adminExists = await User.findOne({ email: 'admin@ebarangay.com' });
    
    if (adminExists) {
      console.log('⚠️  Admin user already exists!');
      console.log('-----------------------------------');
      console.log('Email: admin@ebarangay.com');
      console.log('Password: admin123');
      console.log('-----------------------------------');
      console.log('You can login with these credentials.');
      process.exit(0);
    }

    // Create admin user (password will be hashed by the pre-save hook)
    const admin = await User.create({
      email: 'admin@ebarangay.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      phoneNumber: '+63 123 456 7890',
      address: 'Barangay Hall',
      isActive: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('-----------------------------------');
    console.log('Email: admin@ebarangay.com');
    console.log('Password: admin123');
    console.log('-----------------------------------');
    console.log('⚠️  Please change this password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
