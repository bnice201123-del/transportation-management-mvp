import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@chakra-ui/react';
import axios from 'axios';

// ================================
// DISPATCHER OPERATIONS HOOKS
// ================================

/**
 * Core dispatcher operations hook
 * Provides comprehensive dispatcher functionality for trip management, driver assignment, and fleet coordination
 */
export const useDispatcherOperations = () => {
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  // Fetch all trips
  const fetchTrips = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams(filters);
      const response = await axios.get(`/api/trips?${params}`);
      setTrips(response.data.data?.trips || []);
      return response.data.data?.trips || [];
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch trips';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch active drivers
  const fetchDrivers = useCallback(async () => {
    try {
      const response = await axios.get('/api/users?role=driver&isActive=true');
      const driversData = response.data.users || [];
      setDrivers(driversData);
      return driversData;
    } catch (error) {
      console.error('Error fetching drivers:', error);
      return [];
    }
  }, []);

  // Fetch vehicles
  const fetchVehicles = useCallback(async () => {
    try {
      const response = await axios.get('/api/vehicles');
      const vehiclesData = response.data.vehicles || [];
      setVehicles(vehiclesData);
      return vehiclesData;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      return [];
    }
  }, []);

  // Assign driver to trip
  const assignDriver = useCallback(async (tripId, driverId, vehicleId = null) => {
    try {
      setLoading(true);
      const payload = { driverId };
      if (vehicleId) payload.vehicleId = vehicleId;
      
      await axios.post(`/api/trips/${tripId}/assign`, payload);
      
      toast({
        title: 'Success',
        description: 'Driver assigned successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Refresh trips data
      await fetchTrips();
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to assign driver';
      toast({
        title: 'Assignment Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchTrips, toast]);

  // Bulk assign drivers using intelligent matching
  const bulkAssignDrivers = useCallback(async (tripIds, algorithm = 'optimal') => {
    try {
      setLoading(true);
      const response = await axios.post('/api/trips/bulk-assign', {
        tripIds,
        algorithm
      });
      
      toast({
        title: 'Bulk Assignment Complete',
        description: `Successfully assigned ${response.data.assigned} trips`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      
      await fetchTrips();
      return response.data;
    } catch (error) {
      toast({
        title: 'Bulk Assignment Failed',
        description: error.response?.data?.message || 'Failed to assign drivers',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return { assigned: 0, failed: tripIds.length };
    } finally {
      setLoading(false);
    }
  }, [fetchTrips, toast]);

  // Update trip status
  const updateTripStatus = useCallback(async (tripId, status, notes = '') => {
    try {
      await axios.patch(`/api/trips/${tripId}/status`, { status, notes });
      
      toast({
        title: 'Status Updated',
        description: `Trip status changed to ${status}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      await fetchTrips();
      return true;
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error.response?.data?.message || 'Failed to update trip status',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return false;
    }
  }, [fetchTrips, toast]);

  return {
    trips,
    drivers,
    vehicles,
    loading,
    error,
    fetchTrips,
    fetchDrivers,
    fetchVehicles,
    assignDriver,
    bulkAssignDrivers,
    updateTripStatus,
  };
};

// ================================
// ROUTE OPTIMIZATION HOOKS
// ================================

/**
 * Route optimization and planning hook
 * Provides route optimization algorithms, distance calculations, and trip efficiency analysis
 */
export const useRouteOptimization = () => {
  const [routes, setRoutes] = useState([]);
  const [optimizing, setOptimizing] = useState(false);
  const toast = useToast();

  // Calculate optimal route for multiple stops
  const optimizeRoute = useCallback(async (stops, options = {}) => {
    try {
      setOptimizing(true);
      const response = await axios.post('/api/routes/optimize', {
        stops,
        options: {
          algorithm: options.algorithm || 'nearest_neighbor',
          avoidTolls: options.avoidTolls || false,
          avoidHighways: options.avoidHighways || false,
          ...options
        }
      });
      
      const optimizedRoute = response.data.route;
      setRoutes(prev => [...prev, optimizedRoute]);
      
      return optimizedRoute;
    } catch (error) {
      toast({
        title: 'Route Optimization Failed',
        description: error.response?.data?.message || 'Failed to optimize route',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return null;
    } finally {
      setOptimizing(false);
    }
  }, [toast]);

  // Calculate distance and estimated time between two points
  const calculateRouteMetrics = useCallback(async (origin, destination) => {
    try {
      const response = await axios.post('/api/routes/calculate', {
        origin,
        destination
      });
      
      return {
        distance: response.data.distance,
        duration: response.data.duration,
        estimatedCost: response.data.estimatedCost
      };
    } catch (error) {
      console.error('Route calculation failed:', error);
      return null;
    }
  }, []);

  // Batch optimize multiple trips for efficient routing
  const batchOptimizeTrips = useCallback(async (trips) => {
    try {
      setOptimizing(true);
      const response = await axios.post('/api/routes/batch-optimize', {
        trips: trips.map(trip => ({
          id: trip._id,
          pickup: trip.pickupLocation,
          dropoff: trip.dropoffLocation,
          priority: trip.priority || 'normal'
        }))
      });
      
      toast({
        title: 'Batch Optimization Complete',
        description: `Optimized ${response.data.routes.length} trip routes`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      
      return response.data.routes;
    } catch (error) {
      toast({
        title: 'Batch Optimization Failed',
        description: error.response?.data?.message || 'Failed to optimize trip routes',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return [];
    } finally {
      setOptimizing(false);
    }
  }, [toast]);

  return {
    routes,
    optimizing,
    optimizeRoute,
    calculateRouteMetrics,
    batchOptimizeTrips,
  };
};

// ================================
// FLEET MONITORING HOOKS
// ================================

/**
 * Fleet monitoring and vehicle tracking hook
 * Provides real-time vehicle location tracking, status monitoring, and maintenance alerts
 */
export const useFleetMonitoring = () => {
  const [vehicles, setVehicles] = useState([]);
  const [locations, setLocations] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [monitoring, setMonitoring] = useState(false);

  // Start real-time fleet monitoring
  const startMonitoring = useCallback(() => {
    if (monitoring) return;
    
    setMonitoring(true);
    
    // Set up polling for vehicle locations every 30 seconds
    const interval = setInterval(async () => {
      try {
        const response = await axios.get('/api/vehicles/locations');
        setLocations(response.data.locations || {});
        
        // Check for alerts
        const alertsResponse = await axios.get('/api/vehicles/alerts');
        setAlerts(alertsResponse.data.alerts || []);
      } catch (error) {
        console.error('Failed to fetch vehicle data:', error);
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      setMonitoring(false);
    };
  }, [monitoring]);

  // Stop fleet monitoring
  const stopMonitoring = useCallback(() => {
    setMonitoring(false);
  }, []);

  // Get vehicle status and metrics
  const getVehicleStatus = useCallback((vehicleId) => {
    const vehicle = vehicles.find(v => v._id === vehicleId);
    const location = locations[vehicleId];
    const vehicleAlerts = alerts.filter(alert => alert.vehicleId === vehicleId);
    
    return {
      vehicle,
      location,
      alerts: vehicleAlerts,
      isActive: !!location && new Date(location.timestamp) > new Date(Date.now() - 5 * 60 * 1000), // Active if location updated in last 5 minutes
      status: vehicle?.status || 'unknown'
    };
  }, [vehicles, locations, alerts]);

  // Calculate fleet efficiency metrics
  const calculateFleetMetrics = useMemo(() => {
    const activeVehicles = vehicles.filter(v => v.status === 'active').length;
    const totalVehicles = vehicles.length;
    const utilizationRate = totalVehicles > 0 ? (activeVehicles / totalVehicles) * 100 : 0;
    
    const criticalAlerts = alerts.filter(alert => alert.severity === 'critical').length;
    const warningAlerts = alerts.filter(alert => alert.severity === 'warning').length;
    
    return {
      totalVehicles,
      activeVehicles,
      utilizationRate: utilizationRate.toFixed(1),
      criticalAlerts,
      warningAlerts,
      totalAlerts: alerts.length
    };
  }, [vehicles, alerts]);

  return {
    vehicles,
    locations,
    alerts,
    monitoring,
    startMonitoring,
    stopMonitoring,
    getVehicleStatus,
    fleetMetrics: calculateFleetMetrics,
  };
};

// ================================
// ANALYTICS AND REPORTING HOOKS
// ================================

/**
 * Dispatcher analytics and reporting hook
 * Provides performance metrics, efficiency analysis, and operational insights
 */
export const useDispatcherAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch comprehensive dispatcher analytics
  const fetchAnalytics = useCallback(async (dateRange = {}) => {
    try {
      setLoading(true);
      const response = await axios.get('/api/analytics/dispatcher', {
        params: {
          startDate: dateRange.start,
          endDate: dateRange.end
        }
      });
      
      setAnalytics(response.data.analytics);
      return response.data.analytics;
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate performance report
  const generateReport = useCallback(async (reportType, options = {}) => {
    try {
      const response = await axios.post('/api/reports/dispatcher', {
        type: reportType,
        options
      });
      
      return response.data.report;
    } catch (error) {
      console.error('Failed to generate report:', error);
      return null;
    }
  }, []);

  // Calculate KPI metrics
  const calculateKPIs = useMemo(() => {
    if (!analytics) return null;
    
    return {
      averageResponseTime: analytics.averageResponseTime || 0,
      completionRate: analytics.completionRate || 0,
      driverUtilization: analytics.driverUtilization || 0,
      customerSatisfaction: analytics.customerSatisfaction || 0,
      operationalEfficiency: analytics.operationalEfficiency || 0,
      costPerTrip: analytics.costPerTrip || 0
    };
  }, [analytics]);

  return {
    analytics,
    loading,
    fetchAnalytics,
    generateReport,
    kpis: calculateKPIs,
  };
};

// ================================
// COMMUNICATION HOOKS
// ================================

/**
 * Dispatcher communication hook
 * Provides messaging, notifications, and emergency communication tools
 */
export const useDispatcherCommunication = () => {
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [connected, setConnected] = useState(false);
  const toast = useToast();

  // Send message to driver
  const sendMessage = useCallback(async (driverId, message, priority = 'normal') => {
    try {
      await axios.post('/api/communications/send', {
        recipientId: driverId,
        recipientType: 'driver',
        message,
        priority,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: 'Message Sent',
        description: 'Message delivered successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      return true;
    } catch (error) {
      toast({
        title: 'Message Failed',
        description: 'Failed to send message',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return false;
    }
  }, [toast]);

  // Broadcast message to all drivers
  const broadcastMessage = useCallback(async (message, priority = 'normal') => {
    try {
      await axios.post('/api/communications/broadcast', {
        message,
        priority,
        targetRole: 'driver',
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: 'Broadcast Sent',
        description: 'Message sent to all active drivers',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      return true;
    } catch (error) {
      toast({
        title: 'Broadcast Failed',
        description: 'Failed to send broadcast message',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return false;
    }
  }, [toast]);

  // Send emergency alert
  const sendEmergencyAlert = useCallback(async (message, affectedTrips = []) => {
    try {
      await axios.post('/api/communications/emergency', {
        message,
        priority: 'critical',
        affectedTrips,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: 'Emergency Alert Sent',
        description: 'Critical alert dispatched to all relevant parties',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      
      return true;
    } catch (error) {
      toast({
        title: 'Emergency Alert Failed',
        description: 'Failed to send emergency alert',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
  }, [toast]);

  return {
    messages,
    notifications,
    connected,
    sendMessage,
    broadcastMessage,
    sendEmergencyAlert,
  };
};

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Calculate trip priority based on various factors
 */
export const calculateTripPriority = (trip) => {
  let priority = 1; // Base priority
  
  // Increase priority for medical trips
  if (trip.tripType === 'medical') priority += 3;
  
  // Increase priority for elderly passengers
  if (trip.passengerAge >= 65) priority += 1;
  
  // Increase priority for trips with mobility assistance
  if (trip.requiresAssistance) priority += 2;
  
  // Increase priority based on booking time urgency
  const hoursUntilTrip = (new Date(trip.scheduledDate) - new Date()) / (1000 * 60 * 60);
  if (hoursUntilTrip <= 2) priority += 2;
  else if (hoursUntilTrip <= 6) priority += 1;
  
  return Math.min(priority, 5); // Cap at 5
};

/**
 * Find optimal driver for trip assignment
 */
export const findOptimalDriver = (trip, availableDrivers, options = {}) => {
  if (!availableDrivers.length) return null;
  
  const scoredDrivers = availableDrivers.map(driver => {
    let score = 0;
    
    // Distance score (closer is better)
    if (driver.location && trip.pickupLocation) {
      const distance = calculateDistance(driver.location, trip.pickupLocation);
      score += Math.max(10 - distance, 0); // Max 10 points for distance
    }
    
    // Experience score
    score += Math.min(driver.experienceYears || 0, 5); // Max 5 points for experience
    
    // Rating score
    score += (driver.rating || 0) * 2; // Max 10 points for rating
    
    // Vehicle suitability score
    if (trip.requiresWheelchair && driver.vehicle?.wheelchairAccessible) {
      score += 5;
    }
    
    // Workload balance score (prefer drivers with fewer active trips)
    const activeTrips = driver.activeTrips || 0;
    score += Math.max(5 - activeTrips, 0);
    
    return { driver, score };
  });
  
  // Sort by score and return best match
  scoredDrivers.sort((a, b) => b.score - a.score);
  return scoredDrivers[0]?.driver || null;
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export const calculateDistance = (point1, point2) => {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(point2.lat - point1.lat);
  const dLon = toRad(point2.lng - point1.lng);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Convert degrees to radians
 */
const toRad = (value) => (value * Math.PI) / 180;

/**
 * Format trip duration for display
 */
export const formatTripDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return 'N/A';
  
  const duration = new Date(endTime) - new Date(startTime);
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Generate trip efficiency score
 */
export const calculateTripEfficiency = (trip) => {
  let efficiency = 100; // Start with perfect score
  
  // Deduct points for delays
  if (trip.actualStartTime && trip.scheduledStartTime) {
    const delay = new Date(trip.actualStartTime) - new Date(trip.scheduledStartTime);
    const delayMinutes = delay / (1000 * 60);
    efficiency -= Math.min(delayMinutes * 2, 50); // Max 50 points deduction
  }
  
  // Deduct points for route deviation
  if (trip.plannedDistance && trip.actualDistance) {
    const deviation = (trip.actualDistance - trip.plannedDistance) / trip.plannedDistance;
    efficiency -= Math.min(deviation * 100, 25); // Max 25 points deduction
  }
  
  // Add points for early completion
  if (trip.actualEndTime && trip.estimatedEndTime) {
    const early = new Date(trip.estimatedEndTime) - new Date(trip.actualEndTime);
    const earlyMinutes = early / (1000 * 60);
    if (earlyMinutes > 0) {
      efficiency += Math.min(earlyMinutes, 10); // Max 10 points bonus
    }
  }
  
  return Math.max(0, Math.min(100, efficiency));
};

/**
 * Export analytics data to CSV format
 */
export const exportToCSV = (data, filename) => {
  if (!data || !data.length) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};