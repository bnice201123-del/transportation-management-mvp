import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

/**
 * Migration script to add 'driver' role to existing admin, dispatcher, and scheduler users
 * This enables multi-role functionality for staff members
 */
async function addDriverRoleToStaff() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all users with admin, dispatcher, or scheduler roles
    const staffUsers = await User.find({
      role: { $in: ['admin', 'dispatcher', 'scheduler'] }
    });

    console.log(`📊 Found ${staffUsers.length} staff users to update\n`);

    let updatedCount = 0;
    let alreadyHaveDriver = 0;

    for (const user of staffUsers) {
      // Initialize roles array if it doesn't exist
      if (!user.roles || user.roles.length === 0) {
        user.roles = [user.role];
      }

      // Add driver role if not already present
      if (!user.roles.includes('driver')) {
        user.roles.push('driver');
        await user.save();
        updatedCount++;
        console.log(`✅ Added driver role to: ${user.firstName} ${user.lastName} (${user.email}) - Roles: [${user.roles.join(', ')}]`);
      } else {
        alreadyHaveDriver++;
        console.log(`ℹ️  Already has driver role: ${user.firstName} ${user.lastName} (${user.email}) - Roles: [${user.roles.join(', ')}]`);
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   Total staff users: ${staffUsers.length}`);
    console.log(`   Updated with driver role: ${updatedCount}`);
    console.log(`   Already had driver role: ${alreadyHaveDriver}`);
    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the migration
addDriverRoleToStaff();
