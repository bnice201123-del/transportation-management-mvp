import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const riderSchema = new mongoose.Schema({}, { strict: false });
const Rider = mongoose.model('Rider', riderSchema);

async function cleanupTestRiders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Real rider IDs (the ones we want to keep)
    const realRiderIds = [
      '692a3c439d36748d4455a54e',
      '6928bfe4e51e6f9c7d0f28a4',
      '6922129a68b76a40ae40f1c9',
      '6920d4d5a4b7ae559740c2b1',
      '691bcf0569d4ab613ee5f4e8'
    ];
    
    console.log('🔍 Before cleanup:');
    const allRidersBefore = await Rider.find();
    console.log(`Total riders: ${allRidersBefore.length}`);
    
    // Delete all riders except the real ones
    const result = await Rider.deleteMany({
      _id: { $nin: realRiderIds }
    });
    
    console.log(`\n🗑️ Deleted ${result.deletedCount} test riders`);
    
    console.log('\n✅ After cleanup:');
    const allRidersAfter = await Rider.find();
    console.log(`Total riders: ${allRidersAfter.length}`);
    allRidersAfter.forEach(rider => {
      console.log(`  - ${rider.firstName} ${rider.lastName} | ${rider.email || 'N/A'} | ${rider.phone}`);
    });
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

cleanupTestRiders();
