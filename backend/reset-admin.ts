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

// Reset admin user
const resetAdmin = async () => {
  try {
    await connectDB();

    // Delete existing admin
    await User.deleteOne({ email: 'admin@ebarangay.com' });
    console.log('🗑️  Deleted old admin user');

    // Create new admin user (password will be hashed by the pre-save hook)
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
    console.log('Role:', admin.role);
    console.log('-----------------------------------');
    console.log('You can now login with these credentials!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting admin:', error);
    process.exit(1);
  }
};

resetAdmin();
