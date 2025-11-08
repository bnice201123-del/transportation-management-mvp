// Simple test script to check analytics functionality
// Run this in browser console when logged in as admin

const testAnalytics = async () => {
  try {
    console.log('Testing analytics API...');
    
    // Test the statistics endpoint
    const response = await fetch('/api/analytics/statistics?range=7days', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Analytics data received:', data);
    
    // Check data structure
    console.log('Overview data:', data.overview);
    console.log('Performance data:', data.performance);
    console.log('Financial data:', data.financial);
    console.log('Trends data:', data.trends);
    
    return data;
  } catch (error) {
    console.error('Analytics test failed:', error);
    return null;
  }
};

// Test dashboard endpoint as well
const testDashboard = async () => {
  try {
    console.log('Testing dashboard API...');
    
    const response = await fetch('/api/analytics/dashboard', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Dashboard data received:', data);
    
    return data;
  } catch (error) {
    console.error('Dashboard test failed:', error);
    return null;
  }
};

// Run tests
console.log('Analytics Testing Started');
console.log('=========================');
console.log('Run testAnalytics() to test statistics endpoint');
console.log('Run testDashboard() to test dashboard endpoint');

// Make functions available globally
window.testAnalytics = testAnalytics;
window.testDashboard = testDashboard;