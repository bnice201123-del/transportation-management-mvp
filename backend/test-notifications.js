// Quick test script for notification service
import notificationService from './services/notificationService.js';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import User from './models/User.js';

dotenv.config();

async function runTests() {
  console.log('🧪 Starting Notification Service Tests\n');
  
  try {
    await connectDB();
    console.log('✓ Database connected\n');
    
    // Test 1: Email
    console.log('Test 1: Sending test email...');
    const emailResult = await notificationService.testEmail('your-email@example.com');
    console.log(emailResult.success ? '✅ Email test passed' : '❌ Email test failed:', emailResult.error);
    console.log();
    
    // Test 2: SMS
    console.log('Test 2: Sending test SMS...');
    const smsResult = await notificationService.testSMS('+15551234567');
    console.log(smsResult.success ? '✅ SMS test passed' : '❌ SMS test failed:', smsResult.error);
    console.log();
    
    // Test 3: Shift Reminder
    console.log('Test 3: Shift reminder notification...');
    const driver = await User.findOne({ role: 'driver' });
    
    if (driver) {
      const mockSchedule = {
        _id: 'test-schedule-id',
        startTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        endTime: new Date(Date.now() + 9 * 60 * 60 * 1000), // 9 hours from now
        shiftType: 'morning',
        location: 'Test Location'
      };
      
      const reminderResult = await notificationService.sendShiftReminder(
        driver,
        mockSchedule,
        1 // 1 hour before
      );
      
      console.log('Email sent:', reminderResult.email?.success);
      console.log('SMS sent:', reminderResult.sms?.success);
      console.log();
    } else {
      console.log('⚠️  No driver found in database');
      console.log();
    }
    
    // Test 4: Coverage Gap Alert
    console.log('Test 4: Coverage gap alert...');
    const admin = await User.findOne({ role: 'admin' });
    
    if (admin) {
      const mockGaps = [
        {
          date: new Date(),
          timeSlot: '6:00 AM - 8:00 AM',
          requiredDrivers: 3,
          assignedDrivers: 1,
          gap: 2
        }
      ];
      
      const gapResult = await notificationService.sendCoverageGapAlert(admin, mockGaps);
      console.log('Gap alert sent:', gapResult.email?.success);
      console.log();
    } else {
      console.log('⚠️  No admin found in database');
      console.log();
    }
    
    console.log('✅ All tests completed!\n');
    console.log('Check your email and phone for test messages.');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    process.exit(0);
  }
}

runTests();
