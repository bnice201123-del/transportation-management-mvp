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

const fixUserRoles = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    let fixed = 0;
    for (const user of users) {
      let needsUpdate = false;
      
      // Ensure roles array exists
      if (!user.roles || user.roles.length === 0) {
        user.roles = [user.role];
        needsUpdate = true;
      }
      
      // Ensure primary role is in roles array
      if (!user.roles.includes(user.role)) {
        user.roles.unshift(user.role); // Add primary role at beginning
        needsUpdate = true;
      }
      
      // For admin/dispatcher/scheduler, ensure they have driver role too
      if (['admin', 'dispatcher', 'scheduler'].includes(user.role)) {
        if (!user.roles.includes('driver')) {
          user.roles.push('driver');
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        await user.save();
        fixed++;
        console.log(`Fixed roles for ${user.email}: role="${user.role}" roles=[${user.roles.join(', ')}]`);
      } else {
        console.log(`${user.email} roles are correct: [${user.roles.join(', ')}]`);
      }
    }

    console.log(`\nFixed ${fixed} users`);
    console.log('Done!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

fixUserRoles();
