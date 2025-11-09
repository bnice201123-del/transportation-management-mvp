import axios from 'axios';

// Sample trip data for today's date
const today = new Date();
const sampleTrip = {
  riderName: 'John Smith',
  riderPhone: '+1-555-0123',
  riderEmail: 'john.smith@example.com',
  pickupLocation: {
    address: '123 Main Street, New York, NY 10001',
    lat: 40.7505,
    lng: -73.9934,
    notes: 'Apartment 4B, call when arrived'
  },
  dropoffLocation: {
    address: '456 Broadway, New York, NY 10012',
    lat: 40.7589,
    lng: -73.9851,
    notes: 'Office building, ask for reception'
  },
  scheduledDate: today.toISOString().split('T')[0], // Today's date
  scheduledTime: '09:00', // 9 AM
  estimatedDuration: 30,
  estimatedDistance: 5.2,
  tripType: 'regular',
  specialInstructions: 'Wheelchair accessible vehicle required',
  status: 'pending'
};

async function createSampleTrip() {
  try {
    // First, login to get token
    console.log('Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@test.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('Login successful, got token');

    // Set authorization header
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Create the sample trip
    console.log('Creating sample trip...');
    const tripResponse = await axios.post('http://localhost:3001/api/trips', sampleTrip, { headers });

    console.log('✅ Sample trip created successfully!');
    console.log('Trip ID:', tripResponse.data.trip.tripId);
    console.log('Rider:', tripResponse.data.trip.riderName);
    console.log('Scheduled:', tripResponse.data.trip.scheduledDate, 'at', tripResponse.data.trip.scheduledTime);
    console.log('Status:', tripResponse.data.trip.status);

  } catch (error) {
    console.error('❌ Error creating sample trip:', error.response?.data || error.message);
  }
}

// Run the function
createSampleTrip();