import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const addDriverRoleToAdmins = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all admin, dispatcher, and scheduler users
    const users = await User.find({
      role: { $in: ['admin', 'dispatcher', 'scheduler'] }
    });

    console.log(`Found ${users.length} admin/dispatcher/scheduler users`);

    let updated = 0;
    for (const user of users) {
      // Initialize roles array if it doesn't exist
      if (!user.roles || user.roles.length === 0) {
        user.roles = [user.role];
      }

      // Add driver role if not already present
      if (!user.roles.includes('driver')) {
        user.roles.push('driver');
        await user.save();
        updated++;
        console.log(`Added driver role to ${user.email} (${user.role})`);
      } else {
        console.log(`${user.email} already has driver role`);
      }
    }

    console.log(`\nUpdated ${updated} users with driver role`);
    console.log('Done!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

addDriverRoleToAdmins();
