import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notification from './models/Notification.js';
import User from './models/User.js';
import Trip from './models/Trip.js';

dotenv.config();

const createSampleNotifications = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a test user (you can modify this to target specific users)
    const users = await User.find().limit(5);
    
    if (users.length === 0) {
      console.log('No users found. Please create users first.');
      process.exit(1);
    }

    console.log(`Found ${users.length} users to create notifications for`);

    // Find a sample trip (optional)
    const trip = await Trip.findOne();

    // Create different types of notifications for each user
    for (const user of users) {
      console.log(`\nCreating notifications for user: ${user.firstName} ${user.lastName} (${user.email})`);

      // Trip Assignment Notification
      await Notification.createNotification({
        userId: user._id,
        type: 'trip_assigned',
        title: 'New Trip Assigned',
        message: `You have been assigned to trip #${trip?.tripId || 'T12345'}. Pickup scheduled for today at 9:00 AM.`,
        relatedData: trip ? {
          tripId: trip._id,
          actionUrl: '/driver'
        } : {},
        priority: 'normal'
      });
      console.log('✓ Created trip assignment notification');

      // Trip Update Notification
      await Notification.createNotification({
        userId: user._id,
        type: 'trip_updated',
        title: 'Trip Schedule Updated',
        message: 'The pickup time for your upcoming trip has been changed to 10:30 AM.',
        relatedData: trip ? {
          tripId: trip._id,
          actionUrl: '/trips'
        } : {},
        priority: 'high'
      });
      console.log('✓ Created trip update notification');

      // Trip Completed Notification
      await Notification.createNotification({
        userId: user._id,
        type: 'trip_completed',
        title: 'Trip Completed Successfully',
        message: 'Your trip to Downtown Medical Center has been completed. Thank you!',
        relatedData: {},
        priority: 'low',
        read: Math.random() > 0.5 // Randomly mark some as read
      });
      console.log('✓ Created trip completion notification');

      // System Alert
      await Notification.createNotification({
        userId: user._id,
        type: 'system_alert',
        title: 'System Maintenance Scheduled',
        message: 'The system will undergo maintenance tonight from 11 PM to 1 AM. Please plan accordingly.',
        relatedData: {},
        priority: 'normal'
      });
      console.log('✓ Created system alert notification');

      // Urgent Notification
      if (Math.random() > 0.5) {
        await Notification.createNotification({
          userId: user._id,
          type: 'urgent',
          title: 'Urgent: Weather Alert',
          message: 'Severe weather expected in your area. Please exercise caution.',
          relatedData: {},
          priority: 'urgent'
        });
        console.log('✓ Created urgent notification');
      }

      // Driver Assignment Notification
      await Notification.createNotification({
        userId: user._id,
        type: 'driver_assigned',
        title: 'Driver Assigned to Your Trip',
        message: 'Driver John Smith has been assigned to your upcoming trip. Vehicle: Toyota Camry (ABC-123)',
        relatedData: trip ? {
          tripId: trip._id,
          actionUrl: '/riders'
        } : {},
        priority: 'normal'
      });
      console.log('✓ Created driver assignment notification');

      // Schedule Change Notification
      await Notification.createNotification({
        userId: user._id,
        type: 'schedule_change',
        title: 'Schedule Change Notice',
        message: 'Your regular Monday pickup time has been adjusted to 8:45 AM starting next week.',
        relatedData: {},
        priority: 'normal'
      });
      console.log('✓ Created schedule change notification');
    }

    // Get count of notifications created
    const notificationCount = await Notification.countDocuments();
    console.log(`\n✅ Successfully created sample notifications!`);
    console.log(`Total notifications in database: ${notificationCount}`);

    // Show unread count per user
    console.log('\nUnread notification counts:');
    for (const user of users) {
      const unreadCount = await Notification.countDocuments({
        userId: user._id,
        read: false
      });
      console.log(`  ${user.firstName} ${user.lastName}: ${unreadCount} unread`);
    }

  } catch (error) {
    console.error('Error creating sample notifications:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
};

// Run the script
createSampleNotifications();
