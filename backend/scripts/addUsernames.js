import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

/**
 * Migration script to add username field to existing users
 * Generates usernames based on email or firstName/lastName
 */
async function addUsernamesToExistingUsers() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all users without username
    const usersWithoutUsername = await User.find({
      $or: [
        { username: { $exists: false } },
        { username: null },
        { username: '' }
      ]
    });

    console.log(`📊 Found ${usersWithoutUsername.length} users without usernames\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of usersWithoutUsername) {
      try {
        // Generate username from email or firstName + lastName
        let username;
        
        if (user.email) {
          // Use email prefix as username
          username = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        } else {
          // Use firstName + lastName
          username = `${user.firstName}${user.lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '');
        }

        // Ensure username is unique
        let finalUsername = username;
        let counter = 1;
        while (await User.findOne({ username: finalUsername })) {
          finalUsername = `${username}${counter}`;
          counter++;
        }

        // Update user
        user.username = finalUsername;
        
        // Make email optional (not required)
        if (!user.email || user.email.includes('@placeholder.com')) {
          user.email = undefined;
        }

        await user.save({ validateBeforeSave: false }); // Skip validation for migration
        
        updatedCount++;
        console.log(`✅ Added username to: ${user.firstName} ${user.lastName} → Username: ${finalUsername}`);
      } catch (error) {
        skippedCount++;
        console.error(`❌ Error updating user ${user._id}:`, error.message);
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   Total users without usernames: ${usersWithoutUsername.length}`);
    console.log(`   Successfully updated: ${updatedCount}`);
    console.log(`   Skipped (errors): ${skippedCount}`);
    console.log('\n✅ Migration completed!');

    // Show sample of created usernames
    const sampleUsers = await User.find().select('username firstName lastName email').limit(10);
    console.log('\n📋 Sample usernames:');
    sampleUsers.forEach(u => {
      console.log(`   ${u.username} - ${u.firstName} ${u.lastName} (${u.email || 'no email'})`);
    });

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the migration
addUsernamesToExistingUsers();
