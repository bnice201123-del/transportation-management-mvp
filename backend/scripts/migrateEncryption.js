/**
 * Data Encryption Migration Script
 * 
 * Encrypts all existing unencrypted sensitive data in the database.
 * Run this script after initializing the encryption system.
 * 
 * Usage:
 *   node scripts/migrateEncryption.js [options]
 * 
 * Options:
 *   --collection <name>  Encrypt specific collection (users, riders, or all)
 *   --batch-size <num>   Number of records to process per batch (default: 100)
 *   --dry-run            Show what would be encrypted without actually encrypting
 * 
 * Example:
 *   node scripts/migrateEncryption.js --collection users --batch-size 50
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Rider from '../models/Rider.js';
import EncryptionKey from '../models/EncryptionKey.js';
import { isEncryptionConfigured } from '../utils/encryption.js';

// Load environment variables
dotenv.config();

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  collection: 'all',
  batchSize: 100,
  dryRun: false
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--collection':
      options.collection = args[++i];
      break;
    case '--batch-size':
      options.batchSize = parseInt(args[++i]);
      break;
    case '--dry-run':
      options.dryRun = true;
      break;
  }
}

// Validate options
if (!['all', 'users', 'riders'].includes(options.collection)) {
  console.error('❌ Invalid collection. Must be "all", "users", or "riders"');
  process.exit(1);
}

// Statistics
const stats = {
  users: { total: 0, encrypted: 0, skipped: 0, errors: 0 },
  riders: { total: 0, encrypted: 0, skipped: 0, errors: 0 }
};

/**
 * Connect to MongoDB
 */
async function connectDB() {
  try {
    const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/transportation-management';
    await mongoose.connect(dbURI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

/**
 * Check encryption prerequisites
 */
async function checkPrerequisites() {
  // Check if encryption is configured
  if (!isEncryptionConfigured()) {
    console.error('❌ Encryption not configured. Please set ENCRYPTION_MASTER_KEY environment variable.');
    process.exit(1);
  }
  
  // Check if encryption is initialized
  const keyCount = await EncryptionKey.countDocuments();
  if (keyCount === 0) {
    console.error('❌ Encryption not initialized. Please initialize encryption first.');
    process.exit(1);
  }
  
  // Get active key
  const activeKey = await EncryptionKey.getActiveKey();
  console.log(`✅ Using active key version: ${activeKey.version}`);
  
  return activeKey;
}

/**
 * Encrypt users
 */
async function encryptUsers() {
  console.log('\n📊 Processing Users...');
  
  // Find unencrypted users
  const users = await User.find({ 
    'encryptionMetadata.isEncrypted': { $ne: true }
  });
  
  stats.users.total = users.length;
  console.log(`Found ${users.length} unencrypted users`);
  
  if (users.length === 0) {
    console.log('✅ No users to encrypt');
    return;
  }
  
  // Process in batches
  for (let i = 0; i < users.length; i += options.batchSize) {
    const batch = users.slice(i, i + options.batchSize);
    const batchNum = Math.floor(i / options.batchSize) + 1;
    const totalBatches = Math.ceil(users.length / options.batchSize);
    
    console.log(`\nProcessing batch ${batchNum}/${totalBatches} (${batch.length} users)...`);
    
    for (const user of batch) {
      try {
        // Check if user has any sensitive fields
        const hasSensitiveData = user.email || user.phone || user.licenseNumber || user.twoFactorSecret;
        
        if (!hasSensitiveData) {
          stats.users.skipped++;
          console.log(`  ⏭️  User ${user._id}: No sensitive data to encrypt`);
          continue;
        }
        
        if (options.dryRun) {
          console.log(`  🔍 User ${user._id}: Would encrypt ${[
            user.email && 'email',
            user.phone && 'phone',
            user.licenseNumber && 'license',
            user.twoFactorSecret && '2FA'
          ].filter(Boolean).join(', ')}`);
          stats.users.encrypted++;
          continue;
        }
        
        // Encrypt sensitive fields
        await user.encryptSensitiveFields();
        await user.save();
        
        stats.users.encrypted++;
        console.log(`  ✅ User ${user._id}: Encrypted successfully`);
      } catch (error) {
        stats.users.errors++;
        console.error(`  ❌ User ${user._id}: Encryption failed - ${error.message}`);
      }
    }
    
    // Show batch progress
    console.log(`Batch ${batchNum} complete: ${stats.users.encrypted} encrypted, ${stats.users.errors} errors`);
  }
}

/**
 * Encrypt riders
 */
async function encryptRiders() {
  console.log('\n📊 Processing Riders...');
  
  // Find unencrypted riders
  const riders = await Rider.find({ 
    'encryptionMetadata.isEncrypted': { $ne: true }
  });
  
  stats.riders.total = riders.length;
  console.log(`Found ${riders.length} unencrypted riders`);
  
  if (riders.length === 0) {
    console.log('✅ No riders to encrypt');
    return;
  }
  
  // Process in batches
  for (let i = 0; i < riders.length; i += options.batchSize) {
    const batch = riders.slice(i, i + options.batchSize);
    const batchNum = Math.floor(i / options.batchSize) + 1;
    const totalBatches = Math.ceil(riders.length / options.batchSize);
    
    console.log(`\nProcessing batch ${batchNum}/${totalBatches} (${batch.length} riders)...`);
    
    for (const rider of batch) {
      try {
        // Check if rider has any sensitive fields
        const hasSensitiveData = rider.email || rider.phone || rider.address || rider.dateOfBirth;
        
        if (!hasSensitiveData) {
          stats.riders.skipped++;
          console.log(`  ⏭️  Rider ${rider._id}: No sensitive data to encrypt`);
          continue;
        }
        
        if (options.dryRun) {
          console.log(`  🔍 Rider ${rider._id}: Would encrypt ${[
            rider.email && 'email',
            rider.phone && 'phone',
            rider.address && 'address',
            rider.dateOfBirth && 'DOB'
          ].filter(Boolean).join(', ')}`);
          stats.riders.encrypted++;
          continue;
        }
        
        // Encrypt sensitive fields
        await rider.encryptSensitiveFields();
        await rider.save();
        
        stats.riders.encrypted++;
        console.log(`  ✅ Rider ${rider._id}: Encrypted successfully`);
      } catch (error) {
        stats.riders.errors++;
        console.error(`  ❌ Rider ${rider._id}: Encryption failed - ${error.message}`);
      }
    }
    
    // Show batch progress
    console.log(`Batch ${batchNum} complete: ${stats.riders.encrypted} encrypted, ${stats.riders.errors} errors`);
  }
}

/**
 * Print summary
 */
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 ENCRYPTION MIGRATION SUMMARY');
  console.log('='.repeat(60));
  
  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No data was actually encrypted\n');
  }
  
  console.log('Users:');
  console.log(`  Total found:    ${stats.users.total}`);
  console.log(`  Encrypted:      ${stats.users.encrypted}`);
  console.log(`  Skipped:        ${stats.users.skipped}`);
  console.log(`  Errors:         ${stats.users.errors}`);
  
  console.log('\nRiders:');
  console.log(`  Total found:    ${stats.riders.total}`);
  console.log(`  Encrypted:      ${stats.riders.encrypted}`);
  console.log(`  Skipped:        ${stats.riders.skipped}`);
  console.log(`  Errors:         ${stats.riders.errors}`);
  
  const totalEncrypted = stats.users.encrypted + stats.riders.encrypted;
  const totalErrors = stats.users.errors + stats.riders.errors;
  
  console.log('\nOverall:');
  console.log(`  Total encrypted: ${totalEncrypted}`);
  console.log(`  Total errors:    ${totalErrors}`);
  
  console.log('='.repeat(60));
  
  if (totalErrors > 0) {
    console.log('\n⚠️  Some records failed to encrypt. Please review the errors above.');
  } else if (totalEncrypted > 0) {
    console.log('\n✅ All records encrypted successfully!');
  } else {
    console.log('\n✅ No records needed encryption.');
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('🔐 Data Encryption Migration Script');
  console.log('='.repeat(60));
  console.log(`Collection:  ${options.collection}`);
  console.log(`Batch Size:  ${options.batchSize}`);
  console.log(`Dry Run:     ${options.dryRun ? 'YES' : 'NO'}`);
  console.log('='.repeat(60));
  
  try {
    // Connect to database
    await connectDB();
    
    // Check prerequisites
    await checkPrerequisites();
    
    // Encrypt data based on collection option
    if (options.collection === 'all' || options.collection === 'users') {
      await encryptUsers();
    }
    
    if (options.collection === 'all' || options.collection === 'riders') {
      await encryptRiders();
    }
    
    // Print summary
    printSummary();
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Disconnect from database
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run migration
migrate().then(() => {
  console.log('\n✅ Migration complete');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Migration error:', error);
  process.exit(1);
});
