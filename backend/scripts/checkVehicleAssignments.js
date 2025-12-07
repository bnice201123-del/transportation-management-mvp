import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';

dotenv.config();

const checkAssignments = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all drivers
    console.log('=== DRIVERS ===');
    const drivers = await User.find({ 
      $or: [
        { role: 'driver' },
        { roles: 'driver' }
      ]
    }).select('firstName lastName email role roles');
    
    console.log(`Found ${drivers.length} drivers:`);
    drivers.forEach(driver => {
      console.log(`- ${driver.firstName} ${driver.lastName} (${driver.email})`);
      console.log(`  ID: ${driver._id}`);
      console.log(`  Role: ${driver.role}, Roles: ${driver.roles?.join(', ') || 'none'}\n`);
    });

    // Get all vehicles
    console.log('\n=== VEHICLES ===');
    const vehicles = await Vehicle.find({ isActive: true })
      .populate('currentDriver', 'firstName lastName email');
    
    console.log(`Found ${vehicles.length} active vehicles:\n`);
    vehicles.forEach(vehicle => {
      console.log(`- ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`);
      console.log(`  ID: ${vehicle._id}`);
      console.log(`  Status: ${vehicle.status}`);
      console.log(`  Current Driver: ${vehicle.currentDriver ? 
        `${vehicle.currentDriver.firstName} ${vehicle.currentDriver.lastName} (${vehicle.currentDriver._id})` : 
        'NOT ASSIGNED'}`);
      console.log(`  Assigned Date: ${vehicle.assignedDate || 'N/A'}\n`);
    });

    // Check for assignment mismatches
    console.log('\n=== CHECKING FOR ISSUES ===');
    for (const driver of drivers) {
      const assignedVehicle = await Vehicle.findOne({
        currentDriver: driver._id,
        isActive: true
      });
      
      if (assignedVehicle) {
        console.log(`✅ ${driver.firstName} ${driver.lastName} HAS vehicle: ${assignedVehicle.licensePlate}`);
      } else {
        console.log(`❌ ${driver.firstName} ${driver.lastName} has NO vehicle assigned`);
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkAssignments();
