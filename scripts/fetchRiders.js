import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const riderSchema = new mongoose.Schema({}, { strict: false });
const Rider = mongoose.model('Rider', riderSchema);

async function fetchRiders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://user:password@cluster.mongodb.net/transportation');
    
    const riders = await Rider.find().sort({ createdAt: -1 });
    
    console.log(`\n📋 Total Riders in System: ${riders.length}\n`);
    console.log('═'.repeat(100));
    console.log('ID'.padEnd(25) + 'Name'.padEnd(30) + 'Email'.padEnd(30) + 'Phone'.padEnd(15));
    console.log('═'.repeat(100));
    
    riders.forEach((rider, index) => {
      const name = (rider.firstName || '') + ' ' + (rider.lastName || '') || rider.name || 'N/A';
      const email = rider.email || 'N/A';
      const phone = rider.phone || 'N/A';
      const id = rider._id.toString().substring(0, 20);
      
      console.log(id.padEnd(25) + name.substring(0, 29).padEnd(30) + email.substring(0, 29).padEnd(30) + phone.substring(0, 14).padEnd(15));
    });
    
    console.log('═'.repeat(100));
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fetchRiders();
