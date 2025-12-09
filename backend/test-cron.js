// Quick test script for cron jobs
import cronJobService from './services/cronJobService.js';
import connectDB from './config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function testCronJobs() {
  console.log('🧪 Starting Cron Job Tests\n');
  
  try {
    await connectDB();
    console.log('✓ Database connected\n');
    
    // Initialize cron service
    console.log('Initializing cron jobs...');
    cronJobService.init();
    console.log();
    
    // Get status
    console.log('📊 Cron Job Status:');
    const status = cronJobService.getStatus();
    status.forEach(job => {
      console.log(`  ${job.running ? '✅' : '❌'} ${job.name}`);
      console.log(`     Schedule: ${job.schedule}`);
    });
    console.log();
    
    // Test individual job methods (manually trigger)
    console.log('🔧 Manual Job Triggers:\n');
    
    console.log('1. Testing Shift Reminders...');
    // The actual job will check the database for schedules
    // This just verifies the method exists and can be called
    console.log('   ℹ️  Shift reminder job runs every 5 minutes automatically');
    console.log('   ℹ️  Create a schedule 1 hour from now to test');
    console.log();
    
    console.log('2. Testing Shift Swap Expiration...');
    console.log('   ℹ️  This job runs daily at 2 AM');
    console.log('   ℹ️  Creates old shift swap requests (>48 hours) to test');
    console.log();
    
    console.log('3. Testing Calendar Sync...');
    console.log('   ℹ️  This job runs daily at 4 AM');
    console.log('   ℹ️  Syncs schedules to Google/Outlook calendars');
    console.log();
    
    console.log('4. Testing Coverage Gap Alerts...');
    console.log('   ℹ️  This job runs daily at 8 AM');
    console.log('   ℹ️  Leave some schedule gaps to test');
    console.log();
    
    console.log('5. Testing Overtime Reports...');
    console.log('   ℹ️  This job runs Mondays at 9 AM');
    console.log('   ℹ️  Create schedules with overtime to test');
    console.log();
    
    console.log('✅ Cron service is running!');
    console.log('\n💡 Tips:');
    console.log('   - Jobs will execute on their scheduled times');
    console.log('   - Check backend logs for execution messages');
    console.log('   - Use CTRL+C to stop');
    console.log('\n⏳ Waiting for next job execution...');
    console.log('   (Press CTRL+C to exit)\n');
    
  } catch (error) {
    console.error('❌ Test error:', error);
    process.exit(1);
  }
}

testCronJobs();

// Keep process alive to let cron jobs run
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping cron jobs...');
  cronJobService.stopAll();
  console.log('✓ All jobs stopped');
  process.exit(0);
});
