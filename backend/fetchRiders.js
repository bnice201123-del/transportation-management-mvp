import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const riderSchema = new mongoose.Schema({}, { strict: false });
const Rider = mongoose.model('Rider', riderSchema);

async function fetchRiders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const riders = await Rider.find().sort({ createdAt: -1 });
    
    console.log(`\n📋 Total Riders in System: ${riders.length}\n`);
    console.log('═'.repeat(120));
    console.log('ID'.padEnd(25) + 'Name'.padEnd(35) + 'Email'.padEnd(35) + 'Phone'.padEnd(20));
    console.log('═'.repeat(120));
    
    riders.forEach((rider, index) => {
      const name = (rider.firstName || '') + ' ' + (rider.lastName || '') || rider.name || 'N/A';
      const email = rider.email || 'N/A';
      const phone = rider.phone || 'N/A';
      const id = rider._id.toString().substring(0, 20);
      
      console.log(id.padEnd(25) + name.substring(0, 34).padEnd(35) + email.substring(0, 34).padEnd(35) + phone.substring(0, 19).padEnd(20));
    });
    
    console.log('═'.repeat(120));
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fetchRiders();
