import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Trip from '../models/Trip.js';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/transportation-management');
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const addSampleTrips = async () => {
  try {
    console.log('🚀 Adding sample scheduled trips...');

    // First, let's get a scheduler user to assign as creator
    let scheduler = await User.findOne({ role: 'scheduler' });
    if (!scheduler) {
      // Create a sample scheduler if none exists
      scheduler = new User({
        firstName: 'Sample',
        lastName: 'Scheduler',
        email: 'scheduler@sample.com',
        password: 'hashedpassword', // This should be properly hashed in real app
        phone: '+1-555-0100',
        role: 'scheduler',
        isActive: true
      });
      await scheduler.save();
      console.log('📝 Created sample scheduler user');
    }

    // Get a driver user for assignment
    let driver = await User.findOne({ role: 'driver' });
    if (!driver) {
      // Create a sample driver if none exists
      driver = new User({
        firstName: 'John',
        lastName: 'Driver',
        email: 'driver@sample.com',
        password: 'hashedpassword',
        phone: '+1-555-0200',
        role: 'driver',
        isActive: true,
        isAvailable: true
      });
      await driver.save();
      console.log('📝 Created sample driver user');
    }

    // Sample Trip 1: Medical Appointment
    const trip1 = new Trip({
      tripId: `TRIP-${Date.now()}-001`,
      riderName: 'Sarah Johnson',
      riderPhone: '+1-555-0150',
      riderEmail: 'sarah.johnson@email.com',
      pickupLocation: {
        address: '123 Oak Street, Springfield, IL 62701',
        lat: 39.7817,
        lng: -89.6501,
        notes: 'Blue house with white fence, ring doorbell twice'
      },
      dropoffLocation: {
        address: 'Springfield Medical Center, 800 E Carpenter St, Springfield, IL 62769',
        lat: 39.7990,
        lng: -89.6440,
        notes: 'Main entrance, wait in lobby area'
      },
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      scheduledTime: '10:30',
      status: 'assigned',
      assignedDriver: driver._id,
      specialInstructions: 'Please arrive 5 minutes early. Patient has mobility issues.',
      tripType: 'medical',
      isRecurring: false,
      estimatedDuration: 15, // in minutes
      estimatedDistance: 5.1, // in kilometers (3.2 miles = 5.1 km)
      createdBy: scheduler._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Sample Trip 2: Airport Transfer
    const trip2 = new Trip({
      tripId: `TRIP-${Date.now()}-002`,
      riderName: 'Robert Chen',
      riderPhone: '+1-555-0175',
      riderEmail: 'robert.chen@business.com',
      pickupLocation: {
        address: '456 Business Plaza, Suite 200, Springfield, IL 62704',
        lat: 39.7956,
        lng: -89.6645,
        notes: 'Office building - call upon arrival, will come down'
      },
      dropoffLocation: {
        address: 'Abraham Lincoln Capital Airport, 1200 Capital Airport Dr, Springfield, IL 62707',
        lat: 39.8441,
        lng: -89.6779,
        notes: 'Terminal B departure area'
      },
      scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
      scheduledTime: '14:45',
      status: 'assigned',
      assignedDriver: driver._id,
      specialInstructions: 'Professional service required. Help with luggage.',
      tripType: 'regular',
      isRecurring: false,
      estimatedDuration: 25, // in minutes
      estimatedDistance: 14.0, // in kilometers (8.7 miles = 14.0 km)
      createdBy: scheduler._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Sample Trip 3: Recurring Weekly Trip
    const trip3 = new Trip({
      tripId: `TRIP-${Date.now()}-003`,
      riderName: 'Eleanor Martinez',
      riderPhone: '+1-555-0190',
      riderEmail: 'eleanor.martinez@senior.com',
      pickupLocation: {
        address: '789 Sunset Manor, Apartment 4B, Springfield, IL 62702',
        lat: 39.7889,
        lng: -89.6234,
        notes: 'Senior living facility - check in at front desk'
      },
      dropoffLocation: {
        address: 'Walmart Supercenter, 3045 Freedom Dr, Springfield, IL 62704',
        lat: 39.7645,
        lng: -89.6123,
        notes: 'Drop off at main entrance near shopping carts'
      },
      scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      scheduledTime: '09:15',
      status: 'pending',
      assignedDriver: driver._id,
      specialInstructions: 'Please help with groceries. Wait for 1 hour shopping time.',
      tripType: 'recurring',
      isRecurring: true,
      recurringPattern: {
        frequency: 'weekly',
        daysOfWeek: [1], // Monday
        isIndefinite: true
      },
      estimatedDuration: 12, // in minutes
      estimatedDistance: 4.5, // in kilometers (2.8 miles = 4.5 km)
      createdBy: scheduler._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Save all trips
    await trip1.save();
    await trip2.save();
    await trip3.save();

    console.log('✅ Sample trips added successfully!');
    console.log('📋 Trip Details:');
    console.log(`   1. Medical Appointment - ${trip1.riderName} (${trip1.tripId})`);
    console.log(`   2. Airport Transfer - ${trip2.riderName} (${trip2.tripId})`);
    console.log(`   3. Weekly Grocery Shopping - ${trip3.riderName} (${trip3.tripId})`);
    console.log(`\n🎯 These trips will now appear in the Trip Management Center!`);
    
  } catch (error) {
    console.error('❌ Error adding sample trips:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the script
const runScript = async () => {
  await connectDB();
  await addSampleTrips();
};

runScript();