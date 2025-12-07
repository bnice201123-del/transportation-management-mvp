import mongoose from 'mongoose';
import Trip from '../models/Trip.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const cleanupInvalidRiderTrips = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all trips
    const allTrips = await Trip.find({});
    console.log(`Found ${allTrips.length} total trips`);

    let invalidTrips = [];
    let tripsWithoutRiderField = [];
    let tripsWithInvalidRider = [];

    // Check each trip
    for (const trip of allTrips) {
      // Check if trip has rider field
      if (!trip.rider) {
        tripsWithoutRiderField.push(trip);
        continue;
      }

      // Check if rider exists and is a valid rider
      const rider = await User.findOne({
        _id: trip.rider,
        $or: [{ role: 'rider' }, { roles: 'rider' }],
        isActive: true
      });

      if (!rider) {
        tripsWithInvalidRider.push(trip);
        invalidTrips.push(trip);
      }
    }

    console.log('\n=== Cleanup Summary ===');
    console.log(`Trips without rider field: ${tripsWithoutRiderField.length}`);
    console.log(`Trips with invalid/non-existent rider: ${tripsWithInvalidRider.length}`);
    console.log(`Total invalid trips to remove: ${invalidTrips.length}`);

    if (invalidTrips.length === 0) {
      console.log('\n✅ No invalid trips found. All trips have valid riders!');
      await mongoose.disconnect();
      return;
    }

    // Display some examples
    console.log('\n=== Sample Invalid Trips ===');
    invalidTrips.slice(0, 5).forEach((trip, index) => {
      console.log(`${index + 1}. Trip ID: ${trip.tripId}`);
      console.log(`   Rider ID: ${trip.rider}`);
      console.log(`   Rider Name: ${trip.riderName}`);
      console.log(`   Status: ${trip.status}`);
      console.log(`   Scheduled: ${trip.scheduledDate}`);
      console.log('');
    });

    // Prompt for confirmation (in production, you might want to skip this)
    console.log('\n⚠️  WARNING: This will permanently delete all trips with invalid riders!');
    console.log('To proceed, run this script with the --confirm flag');

    // Check for confirmation flag
    if (!process.argv.includes('--confirm')) {
      console.log('\nDry run completed. No trips were deleted.');
      console.log('To actually delete these trips, run: node cleanupInvalidRiderTrips.js --confirm');
      await mongoose.disconnect();
      return;
    }

    // Delete invalid trips
    console.log('\n🗑️  Deleting invalid trips...');
    const deleteResult = await Trip.deleteMany({
      _id: { $in: invalidTrips.map(t => t._id) }
    });

    console.log(`\n✅ Successfully deleted ${deleteResult.deletedCount} trips with invalid riders`);

    // Summary of trips without rider field (these need manual review)
    if (tripsWithoutRiderField.length > 0) {
      console.log('\n⚠️  Note: Found trips without rider field:');
      console.log('These trips were created before rider validation was added.');
      console.log('They need manual review and rider assignment.');
      console.log(`Count: ${tripsWithoutRiderField.length}`);
      
      console.log('\nSample trips without rider field:');
      tripsWithoutRiderField.slice(0, 3).forEach((trip, index) => {
        console.log(`${index + 1}. Trip ID: ${trip.tripId}, Rider Name: ${trip.riderName}`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Cleanup completed successfully');
    process.exit(0);

  } catch (error) {
    console.error('Error during cleanup:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

cleanupInvalidRiderTrips();
