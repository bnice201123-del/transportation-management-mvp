// Quick test script for calendar integration
import googleCalendarService from './services/googleCalendarService.js';
import outlookCalendarService from './services/outlookCalendarService.js';
import connectDB from './config/database.js';
import User from './models/User.js';
import Schedule from './models/Schedule.js';
import dotenv from 'dotenv';

dotenv.config();

async function testCalendarIntegration() {
  console.log('🧪 Starting Calendar Integration Tests\n');
  
  try {
    await connectDB();
    console.log('✓ Database connected\n');
    
    // Find a user with calendar integration
    const userWithGoogle = await User.findOne({ 'integrations.googleCalendar.enabled': true });
    const userWithOutlook = await User.findOne({ 'integrations.outlookCalendar.enabled': true });
    
    // Test Google Calendar
    if (userWithGoogle) {
      console.log('📅 Testing Google Calendar Integration...');
      console.log(`   User: ${userWithGoogle.firstName} ${userWithGoogle.lastName}`);
      
      // Find user's schedules
      const schedules = await Schedule.find({
        driver: userWithGoogle._id,
        startTime: { $gte: new Date() }
      }).limit(5);
      
      console.log(`   Found ${schedules.length} upcoming schedules`);
      
      if (schedules.length > 0) {
        console.log('   Syncing to Google Calendar...');
        try {
          const result = await googleCalendarService.syncSchedules(userWithGoogle._id, schedules);
          console.log(`   ✅ Synced: ${result.created} created, ${result.updated} updated`);
        } catch (error) {
          console.log(`   ❌ Sync failed: ${error.message}`);
        }
      } else {
        console.log('   ⚠️  No schedules to sync');
      }
      console.log();
    } else {
      console.log('📅 Google Calendar: Not configured');
      console.log('   ℹ️  Visit: http://localhost:3001/api/calendar/google/auth');
      console.log();
    }
    
    // Test Outlook Calendar
    if (userWithOutlook) {
      console.log('📅 Testing Outlook Calendar Integration...');
      console.log(`   User: ${userWithOutlook.firstName} ${userWithOutlook.lastName}`);
      
      const schedules = await Schedule.find({
        driver: userWithOutlook._id,
        startTime: { $gte: new Date() }
      }).limit(5);
      
      console.log(`   Found ${schedules.length} upcoming schedules`);
      
      if (schedules.length > 0) {
        console.log('   Syncing to Outlook Calendar...');
        try {
          const result = await outlookCalendarService.syncSchedules(userWithOutlook._id, schedules);
          console.log(`   ✅ Synced: ${result.created} created, ${result.updated} updated`);
        } catch (error) {
          console.log(`   ❌ Sync failed: ${error.message}`);
        }
      } else {
        console.log('   ⚠️  No schedules to sync');
      }
      console.log();
    } else {
      console.log('📅 Outlook Calendar: Not configured');
      console.log('   ℹ️  Visit: http://localhost:3001/api/calendar/outlook/auth');
      console.log();
    }
    
    // Summary
    console.log('✅ Calendar integration tests completed!\n');
    
    if (!userWithGoogle && !userWithOutlook) {
      console.log('💡 Next Steps:');
      console.log('   1. Follow OAUTH_SETUP_GUIDE.md to configure OAuth');
      console.log('   2. Login to app and connect calendar from settings');
      console.log('   3. Run this test again');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    process.exit(0);
  }
}

testCalendarIntegration();
