// Sample data creation script for testing analytics
// This creates sample trips to test our analytics functionality

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Sample trip data
const sampleTrips = [
  {
    riderName: 'John Smith',
    riderPhone: '+1-555-0101',
    riderEmail: 'john.smith@email.com',
    pickupLocation: {
      address: '123 Main St, Downtown',
      lat: 40.7128,
      lng: -74.0060
    },
    dropoffLocation: {
      address: '456 Oak Ave, Uptown',
      lat: 40.7589,
      lng: -73.9851
    },
    scheduledDate: new Date(),
    scheduledTime: '09:00',
    estimatedDuration: 25,
    status: 'completed',
    actualPickupTime: new Date(Date.now() - 30 * 60000), // 30 mins ago
    actualDropoffTime: new Date(Date.now() - 5 * 60000),  // 5 mins ago
    actualCost: 24.50,
    rating: 5,
    feedback: 'Great service!'
  },
  {
    riderName: 'Sarah Johnson',
    riderPhone: '+1-555-0102',
    riderEmail: 'sarah.j@email.com',
    pickupLocation: {
      address: '789 Pine St, Westside',
      lat: 40.7505,
      lng: -73.9934
    },
    dropoffLocation: {
      address: '321 Elm St, Eastside',
      lat: 40.7282,
      lng: -73.9942
    },
    scheduledDate: new Date(Date.now() - 24 * 60 * 60000), // Yesterday
    scheduledTime: '14:30',
    estimatedDuration: 20,
    status: 'completed',
    actualPickupTime: new Date(Date.now() - 24 * 60 * 60000 + 5 * 60000),
    actualDropoffTime: new Date(Date.now() - 24 * 60 * 60000 + 25 * 60000),
    actualCost: 18.75,
    rating: 4,
    feedback: 'Good experience'
  },
  {
    riderName: 'Mike Davis',
    riderPhone: '+1-555-0103',
    riderEmail: 'mike.davis@email.com',
    pickupLocation: {
      address: '555 Broadway, Theater District',
      lat: 40.7590,
      lng: -73.9845
    },
    dropoffLocation: {
      address: '777 Park Ave, Upper East',
      lat: 40.7614,
      lng: -73.9776
    },
    scheduledDate: new Date(),
    scheduledTime: '16:15',
    estimatedDuration: 15,
    status: 'in_progress',
    actualPickupTime: new Date(Date.now() - 10 * 60000), // 10 mins ago
    actualCost: 22.00
  }
];

async function createSampleData(authToken) {
  try {
    console.log('Creating sample trip data for analytics testing...');
    
    for (const trip of sampleTrips) {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/trips`,
          trip,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log(`Created trip: ${response.data.tripId}`);
      } catch (error) {
        console.log(`Trip creation skipped (may already exist): ${trip.riderName}`);
      }
    }
    
    console.log('Sample data creation completed!');
    return true;
  } catch (error) {
    console.error('Error creating sample data:', error.message);
    return false;
  }
}

async function testAnalyticsEndpoints(authToken) {
  try {
    console.log('Testing analytics endpoints...');
    
    // Test dashboard endpoint
    const dashboardResponse = await axios.get(
      `${API_BASE_URL}/analytics/dashboard`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Dashboard data:', dashboardResponse.data);
    
    // Test statistics endpoint
    const statisticsResponse = await axios.get(
      `${API_BASE_URL}/analytics/statistics?range=7days`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Statistics data:', statisticsResponse.data);
    
    return true;
  } catch (error) {
    console.error('Analytics test failed:', error.response?.data || error.message);
    return false;
  }
}

// Export functions for use
export { createSampleData, testAnalyticsEndpoints };

// Usage instructions
console.log(`
Analytics Test Setup
===================

1. Make sure you're logged in as an admin user
2. Get your auth token from localStorage.getItem('token')
3. Run: createSampleData(yourAuthToken)
4. Run: testAnalyticsEndpoints(yourAuthToken)
5. Check AdminStatistics component to see live data

Example:
const token = localStorage.getItem('token');
await createSampleData(token);
await testAnalyticsEndpoints(token);
`);