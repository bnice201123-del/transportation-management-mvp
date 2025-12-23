import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const riderSchema = new mongoose.Schema({}, { strict: false });
const Rider = mongoose.model('Rider', riderSchema);

async function recreateRiders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const realRiders = [
      {
        riderId: 'R001',
        firstName: 'sia',
        lastName: 'kolie',
        email: 'sia.kolie@example.com',
        phone: '654-789-2135',
        dateOfBirth: new Date('1990-01-15'),
        address: '123 Main St',
        isActive: true
      },
      {
        riderId: 'R002',
        firstName: 'mike',
        lastName: 'brooklyn',
        email: 'mike.brooklyn@example.com',
        phone: '763-123-4567',
        dateOfBirth: new Date('1985-05-20'),
        address: '456 Oak Ave',
        isActive: true
      },
      {
        riderId: 'R003',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        phone: '987-987-6541',
        dateOfBirth: new Date('1992-03-10'),
        address: '789 Pine Rd',
        isActive: true
      },
      {
        riderId: 'R004',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '763-111-2222',
        dateOfBirth: new Date('1988-07-22'),
        address: '321 Elm St',
        isActive: true
      },
      {
        riderId: 'R005',
        firstName: 'bak',
        lastName: 'gil',
        email: 'rider1763430149093@placeholder.com',
        phone: '763-789-4563',
        dateOfBirth: new Date('1995-11-05'),
        address: '654 Maple Ln',
        isActive: true
      }
    ];
    
    console.log('📝 Creating real riders...\n');
    
    for (const riderData of realRiders) {
      const rider = new Rider(riderData);
      await rider.save();
      console.log(`✅ Created: ${riderData.firstName} ${riderData.lastName} (${riderData.phone})`);
    }
    
    console.log('\n✅ All riders recreated successfully!');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

recreateRiders();
