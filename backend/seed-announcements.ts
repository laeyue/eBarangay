import mongoose from 'mongoose';
import Announcement from './models/Announcement';
import User from './models/User';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/barangay-connect';

async function seedAnnouncements() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB Connected');

    // Find an admin user to be the creator
    const admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.error('No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    console.log(`Using admin: ${admin.email}`);

    // Sample announcements
    const announcements = [
      {
        title: 'Community Clean-Up Drive This Saturday',
        content: 'Join us this Saturday, November 23, 2025, for our monthly community clean-up drive. We will start at 7:00 AM at the Barangay Hall. Bring your cleaning materials and let\'s work together to keep our barangay clean and green!',
        category: 'event',
        isPinned: true,
        priority: 'high',
        isActive: true,
        createdBy: admin._id,
      },
      {
        title: 'Barangay Health Center Schedule Update',
        content: 'Please be informed that the Barangay Health Center will have modified operating hours starting next week. Monday to Friday: 8:00 AM - 5:00 PM (Lunch break: 12:00 PM - 1:00 PM). Free check-ups available every Tuesday and Thursday.',
        category: 'update',
        isPinned: false,
        priority: 'normal',
        isActive: true,
        createdBy: admin._id,
      },
      {
        title: 'Reminder: Garbage Collection Schedule',
        content: 'Reminder to all residents: Biodegradable waste - Monday, Wednesday, Friday. Non-biodegradable waste - Tuesday, Thursday, Saturday. Please segregate your waste properly. Collection time: 6:00 AM - 9:00 AM.',
        category: 'general',
        isPinned: false,
        priority: 'normal',
        isActive: true,
        createdBy: admin._id,
      },
      {
        title: 'Basketball Court Renovation Complete',
        content: 'Great news! The basketball court renovation is now complete. The court is open for use daily from 6:00 AM to 10:00 PM. We encourage everyone to maintain cleanliness and proper use of the facility.',
        category: 'announcement',
        isPinned: false,
        priority: 'low',
        isActive: true,
        createdBy: admin._id,
      },
      {
        title: 'Free Skills Training Program for Youth',
        content: 'The Barangay Youth Council is offering free skills training programs including Computer Basics, Digital Marketing, and Cooking. Registration is now open for residents aged 15-30. Limited slots available. Register at the Barangay Hall.',
        category: 'event',
        isPinned: true,
        priority: 'high',
        isActive: true,
        createdBy: admin._id,
      },
      {
        title: 'IMPORTANT: COVID-19 Booster Shots Available',
        content: 'FREE COVID-19 booster shots are now available at the Barangay Health Center. Bring your vaccination card and valid ID. Walk-ins welcome. For seniors (60+), please call ahead to schedule an appointment.',
        category: 'alert',
        isPinned: true,
        priority: 'high',
        isActive: true,
        createdBy: admin._id,
      },
    ];

    // Clear existing announcements (optional - comment out if you want to keep existing ones)
    await Announcement.deleteMany({});
    console.log('Cleared existing announcements');

    // Insert new announcements
    const result = await Announcement.insertMany(announcements);
    console.log(`✅ Successfully created ${result.length} announcements`);

    // Display created announcements
    console.log('\nCreated Announcements:');
    result.forEach((ann, index) => {
      console.log(`${index + 1}. ${ann.title} [${ann.category}] ${ann.isPinned ? '📌 PINNED' : ''}`);
    });

    console.log('\n✅ Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seedAnnouncements();
