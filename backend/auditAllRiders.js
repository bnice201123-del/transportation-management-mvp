import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const riderSchema = new mongoose.Schema({}, { strict: false });
const Rider = mongoose.model('Rider', riderSchema);

async function auditAllRiders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('\n📊 COMPLETE RIDER AUDIT\n');
    
    // Get ALL riders
    const allRiders = await Rider.find().sort({ createdAt: -1 });
    
    console.log(`Total riders in database: ${allRiders.length}\n`);
    
    // Categorize them
    const withExampleEmail = allRiders.filter(r => r.email && r.email.includes('@example.com'));
    const withoutEmail = allRiders.filter(r => !r.email);
    const withOtherEmail = allRiders.filter(r => r.email && !r.email.includes('@example.com'));
    
    console.log(`Riders with @example.com: ${withExampleEmail.length}`);
    withExampleEmail.forEach((r, i) => {
      console.log(`  ${i+1}. ${r.firstName} ${r.lastName} - ${r.email}`);
    });
    
    console.log(`\nRiders with NO email: ${withoutEmail.length}`);
    withoutEmail.forEach((r, i) => {
      console.log(`  ${i+1}. ${r.firstName} ${r.lastName} - (no email)`);
    });
    
    console.log(`\nRiders with OTHER email domains: ${withOtherEmail.length}`);
    withOtherEmail.forEach((r, i) => {
      console.log(`  ${i+1}. ${r.firstName} ${r.lastName} - ${r.email}`);
    });
    
    console.log('\n');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

auditAllRiders();
