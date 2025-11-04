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

const verifyTrips = async () => {
  try {
    console.log('🔍 Checking sample trips in database...\n');

    const trips = await Trip.find({})
      .populate('assignedDriver', 'firstName lastName phone')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`📊 Total trips found: ${trips.length}\n`);

    if (trips.length === 0) {
      console.log('❌ No trips found in database. Run addSampleTrips.js first.');
      return;
    }

    trips.forEach((trip, index) => {
      console.log(`🚗 Trip ${index + 1}: ${trip.tripId}`);
      console.log(`   📋 Rider: ${trip.riderName}`);
      console.log(`   📞 Phone: ${trip.riderPhone || 'Not provided'}`);
      console.log(`   📍 From: ${trip.pickupLocation.address.substring(0, 50)}...`);
      console.log(`   🎯 To: ${trip.dropoffLocation.address.substring(0, 50)}...`);
      console.log(`   📅 Date: ${trip.scheduledDate.toDateString()} at ${trip.scheduledTime}`);
      console.log(`   🟢 Status: ${trip.status}`);
      console.log(`   👨‍✈️ Driver: ${trip.assignedDriver ? `${trip.assignedDriver.firstName} ${trip.assignedDriver.lastName}` : 'Unassigned'}`);
      console.log(`   ⏱️ Duration: ${trip.estimatedDuration || 'N/A'} minutes`);
      console.log(`   🛣️ Distance: ${trip.estimatedDistance || 'N/A'} km`);
      console.log(`   ♻️ Recurring: ${trip.isRecurring ? 'Yes' : 'No'}`);
      console.log('   ' + '─'.repeat(50));
    });

    console.log('\n✅ Trip verification complete!');
    console.log('🎯 These trips should now be visible in the Trip Management Center.');
    console.log('📱 Access at: http://localhost:5176');
    console.log('🔑 Login with test credentials to view the trips.');
    
  } catch (error) {
    console.error('❌ Error verifying trips:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the verification
const runVerification = async () => {
  await connectDB();
  await verifyTrips();
};

runVerification();