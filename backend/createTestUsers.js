import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import connectDB from './config/database.js';

dotenv.config();

const createTestUsers = async () => {
  try {
    // Connect to database
    await connectDB();

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@test.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
    } else {
      // Create admin user
      const adminUser = new User({
        email: 'admin@test.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        phone: '555-0001',
        isActive: true
      });

      await adminUser.save();
      console.log('✅ Admin user created: admin@test.com / admin123');
    }

    // Check if scheduler user already exists
    const existingScheduler = await User.findOne({ email: 'scheduler@test.com' });
    if (existingScheduler) {
      console.log('Scheduler user already exists');
    } else {
      // Create scheduler user
      const schedulerUser = new User({
        email: 'scheduler@test.com',
        password: 'scheduler123',
        firstName: 'Scheduler',
        lastName: 'User',
        role: 'scheduler',
        phone: '555-0002',
        isActive: true
      });

      await schedulerUser.save();
      console.log('✅ Scheduler user created: scheduler@test.com / scheduler123');
    }

    // Check if dispatcher user already exists
    const existingDispatcher = await User.findOne({ email: 'dispatcher@test.com' });
    if (existingDispatcher) {
      console.log('Dispatcher user already exists');
    } else {
      // Create dispatcher user
      const dispatcherUser = new User({
        email: 'dispatcher@test.com',
        password: 'dispatcher123',
        firstName: 'Dispatcher',
        lastName: 'User',
        role: 'dispatcher',
        phone: '555-0003',
        isActive: true
      });

      await dispatcherUser.save();
      console.log('✅ Dispatcher user created: dispatcher@test.com / dispatcher123');
    }

    // Check if driver user already exists
    const existingDriver = await User.findOne({ email: 'driver@test.com' });
    if (existingDriver) {
      console.log('Driver user already exists');
    } else {
      // Create driver user
      const driverUser = new User({
        email: 'driver@test.com',
        password: 'driver123',
        firstName: 'Driver',
        lastName: 'User',
        role: 'driver',
        phone: '555-0004',
        licenseNumber: 'DL123456',
        vehicleInfo: {
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          licensePlate: 'ABC-123',
          color: 'White'
        },
        isActive: true
      });

      await driverUser.save();
      console.log('✅ Driver user created: driver@test.com / driver123');
    }

    console.log('\n🎉 Test users setup complete!');
    console.log('📝 Available test accounts:');
    console.log('   Admin: admin@test.com / admin123');
    console.log('   Scheduler: scheduler@test.com / scheduler123');
    console.log('   Dispatcher: dispatcher@test.com / dispatcher123');
    console.log('   Driver: driver@test.com / driver123');

  } catch (error) {
    console.error('❌ Error creating test users:', error.message);
  } finally {
    mongoose.disconnect();
  }
};

// Run the script
createTestUsers();