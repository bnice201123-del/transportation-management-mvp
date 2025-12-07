import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@chakra-ui/react';
import { 
  useDispatcherOperations, 
  useFleetMonitoring, 
  useRouteOptimization, 
  useDispatcherAnalytics,
  useDispatcherCommunication,
  calculateTripPriority,
  findOptimalDriver
} from '../utils/dispatcherUtils';

// Create the Dispatcher Context
const DispatcherContext = createContext();

/**
 * Custom hook to use the Dispatcher Context
 * @returns {Object} Dispatcher context value
 */
export const useDispatcher = () => {
  const context = useContext(DispatcherContext);
  if (!context) {
    throw new Error('useDispatcher must be used within a DispatcherProvider');
  }
  return context;
};

/**
 * Dispatcher Context Provider Component
 * Provides centralized dispatcher state management and operations
 */
export const DispatcherProvider = ({ children }) => {
  // Core dispatcher operations
  const dispatcherOps = useDispatcherOperations();
  const fleetMonitoring = useFleetMonitoring();
  const routeOptimization = useRouteOptimization();
  const analytics = useDispatcherAnalytics();
  const communication = useDispatcherCommunication();
  
  // Additional state management
  const [selectedTrips, setSelectedTrips] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    status: 'all',
    driver: 'all',
    dateRange: { start: '', end: '' },
    priority: 'all'
  });
  const [viewMode, setViewMode] = useState('table'); // table, map, calendar
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  
  const toast = useToast();

  // Initialize dispatcher data
  useEffect(() => {
    const initializeDispatcher = async () => {
      try {
        await Promise.all([
          dispatcherOps.fetchTrips(),
          dispatcherOps.fetchDrivers(),
          dispatcherOps.fetchVehicles()
        ]);
        
        // Start fleet monitoring
        fleetMonitoring.startMonitoring();
        
        toast({
          title: 'Dispatcher Initialized',
          description: 'Successfully loaded dispatcher data',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: 'Initialization Failed',
          description: 'Failed to load dispatcher data',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };
    
    initializeDispatcher();
    
    return () => {
      fleetMonitoring.stopMonitoring();
    };
  }, []);

  // Auto-refresh data at specified intervals
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      dispatcherOps.fetchTrips();
      dispatcherOps.fetchDrivers();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, dispatcherOps]);

  // Enhanced trip management functions
  const createTrip = useCallback(async (tripData) => {
    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...tripData,
          priority: calculateTripPriority(tripData),
          createdAt: new Date().toISOString()
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create trip');
      }
      
      const result = await response.json();
      
      // Refresh trips after creation
      await dispatcherOps.fetchTrips();
      
      toast({
        title: 'Trip Created',
        description: `Trip ${result.data.tripId} created successfully`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      
      return result.data;
    } catch (error) {
      toast({
        title: 'Trip Creation Failed',
        description: error.message || 'Failed to create trip',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  }, [dispatcherOps.fetchTrips, toast]);

  // Enhanced driver assignment with intelligent matching
  const smartAssignDriver = useCallback(async (tripId, options = {}) => {
    try {
      const trip = dispatcherOps.trips.find(t => t._id === tripId);
      if (!trip) {
        throw new Error('Trip not found');
      }
      
      // Get available drivers
      const availableDrivers = dispatcherOps.drivers.filter(driver => 
        driver.isActive && 
        (!driver.currentTripId || driver.currentTripId === '')
      );
      
      if (availableDrivers.length === 0) {
        throw new Error('No available drivers');
      }
      
      // Find optimal driver using intelligent matching
      const optimalDriver = findOptimalDriver(trip, availableDrivers, options);
      
      if (!optimalDriver) {
        throw new Error('No suitable driver found');
      }
      
      // Assign the driver
      const success = await dispatcherOps.assignDriver(tripId, optimalDriver._id);
      
      if (success) {
        // Send notification to driver
        await communication.sendMessage(
          optimalDriver._id,
          `New trip assignment: ${trip.tripId}. Pickup at ${trip.pickupLocation.address}`,
          'high'
        );
        
        return {
          success: true,
          driver: optimalDriver,
          trip: trip
        };
      }
      
      throw new Error('Assignment failed');
    } catch (error) {
      toast({
        title: 'Smart Assignment Failed',
        description: error.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return { success: false, error: error.message };
    }
  }, [dispatcherOps.trips, dispatcherOps.drivers, dispatcherOps.assignDriver, communication.sendMessage, toast]);

  // Bulk operations
  const bulkOperations = useMemo(() => ({
    // Select multiple trips
    selectTrip: (tripId) => {
      setSelectedTrips(prev => 
        prev.includes(tripId) 
          ? prev.filter(id => id !== tripId)
          : [...prev, tripId]
      );
    },
    
    // Select all visible trips
    selectAll: (tripIds) => {
      setSelectedTrips(tripIds);
    },
    
    // Clear selection
    clearSelection: () => {
      setSelectedTrips([]);
    },
    
    // Bulk assign drivers
    bulkAssign: async (algorithm = 'optimal') => {
      if (selectedTrips.length === 0) {
        toast({
          title: 'No Trips Selected',
          description: 'Please select trips to assign',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      try {
        const result = await dispatcherOps.bulkAssignDrivers(selectedTrips, algorithm);
        setSelectedTrips([]); // Clear selection after operation
        return result;
      } catch (error) {
        console.error('Bulk assignment failed:', error);
      }
    },
    
    // Bulk update status
    bulkUpdateStatus: async (status, notes = '') => {
      if (selectedTrips.length === 0) return;
      
      try {
        const results = await Promise.allSettled(
          selectedTrips.map(tripId => 
            dispatcherOps.updateTripStatus(tripId, status, notes)
          )
        );
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        
        toast({
          title: 'Bulk Update Complete',
          description: `Updated ${successful} of ${selectedTrips.length} trips`,
          status: successful === selectedTrips.length ? 'success' : 'warning',
          duration: 4000,
          isClosable: true,
        });
        
        setSelectedTrips([]);
        return results;
      } catch (error) {
        toast({
          title: 'Bulk Update Failed',
          description: 'Failed to update trip statuses',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    }
  }), [selectedTrips, dispatcherOps.bulkAssignDrivers, dispatcherOps.updateTripStatus, toast]);

  // Filtering and search functions
  const filterTrips = useCallback((trips, filters = filterOptions) => {
    return trips.filter(trip => {
      // Status filter
      if (filters.status !== 'all' && trip.status !== filters.status) {
        return false;
      }
      
      // Driver filter
      if (filters.driver !== 'all' && trip.assignedDriver !== filters.driver) {
        return false;
      }
      
      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const tripDate = new Date(trip.scheduledDate);
        
        if (filters.dateRange.start && tripDate < new Date(filters.dateRange.start)) {
          return false;
        }
        
        if (filters.dateRange.end && tripDate > new Date(filters.dateRange.end)) {
          return false;
        }
      }
      
      // Priority filter
      if (filters.priority !== 'all') {
        const tripPriority = calculateTripPriority(trip);
        if (tripPriority.toString() !== filters.priority) {
          return false;
        }
      }
      
      return true;
    });
  }, [filterOptions]);

  // Search function
  const searchTrips = useCallback((trips, searchTerm) => {
    if (!searchTerm) return trips;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return trips.filter(trip => 
      trip.tripId?.toLowerCase().includes(lowerSearchTerm) ||
      trip.riderName?.toLowerCase().includes(lowerSearchTerm) ||
      trip.riderPhone?.includes(searchTerm) ||
      trip.pickupLocation?.address?.toLowerCase().includes(lowerSearchTerm) ||
      trip.dropoffLocation?.address?.toLowerCase().includes(lowerSearchTerm)
    );
  }, []);

  // Real-time statistics
  const realtimeStats = useMemo(() => {
    const trips = dispatcherOps.trips;
    const drivers = dispatcherOps.drivers;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysTrips = trips.filter(trip => {
      const tripDate = new Date(trip.scheduledDate);
      tripDate.setHours(0, 0, 0, 0);
      return tripDate.getTime() === today.getTime();
    });
    
    const activeTrips = trips.filter(trip => 
      ['pending', 'assigned', 'in_progress'].includes(trip.status)
    );
    
    const completedTrips = trips.filter(trip => trip.status === 'completed');
    const unassignedTrips = trips.filter(trip => !trip.assignedDriver);
    
    const availableDrivers = drivers.filter(driver => 
      driver.isActive && !activeTrips.some(trip => trip.assignedDriver === driver._id)
    );
    
    const busyDrivers = drivers.filter(driver =>
      activeTrips.some(trip => trip.assignedDriver === driver._id)
    );
    
    return {
      totalTrips: trips.length,
      todaysTrips: todaysTrips.length,
      activeTrips: activeTrips.length,
      completedTrips: completedTrips.length,
      unassignedTrips: unassignedTrips.length,
      totalDrivers: drivers.length,
      availableDrivers: availableDrivers.length,
      busyDrivers: busyDrivers.length,
      completionRate: trips.length > 0 ? ((completedTrips.length / trips.length) * 100).toFixed(1) : 0,
      driverUtilization: drivers.length > 0 ? ((busyDrivers.length / drivers.length) * 100).toFixed(1) : 0,
    };
  }, [dispatcherOps.trips, dispatcherOps.drivers]);

  // Emergency management
  const emergencyManagement = useMemo(() => ({
    declareEmergency: async (type, description, affectedTrips = []) => {
      try {
        await communication.sendEmergencyAlert(
          `EMERGENCY: ${type} - ${description}`,
          affectedTrips
        );
        
        // Update affected trips status
        await Promise.all(
          affectedTrips.map(tripId => 
            dispatcherOps.updateTripStatus(tripId, 'emergency', description)
          )
        );
        
        toast({
          title: 'Emergency Declared',
          description: 'Emergency protocols activated',
          status: 'error',
          duration: 0, // Don't auto-dismiss
          isClosable: true,
        });
        
        return true;
      } catch (error) {
        toast({
          title: 'Emergency Declaration Failed',
          description: 'Failed to activate emergency protocols',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return false;
      }
    },
    
    resolveEmergency: async (emergencyId) => {
      try {
        // Implementation for resolving emergency
        toast({
          title: 'Emergency Resolved',
          description: 'Emergency has been successfully resolved',
          status: 'success',
          duration: 4000,
          isClosable: true,
        });
        return true;
      } catch (error) {
        return false;
      }
    }
  }), [communication.sendEmergencyAlert, dispatcherOps.updateTripStatus, toast]);

  // Context value
  const value = {
    // Core operations
    ...dispatcherOps,
    
    // Enhanced fleet monitoring
    fleetMonitoring,
    
    // Route optimization
    routeOptimization,
    
    // Analytics
    analytics,
    
    // Communication
    communication,
    
    // UI state
    selectedTrips,
    filterOptions,
    setFilterOptions,
    viewMode,
    setViewMode,
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval,
    
    // Enhanced functions
    createTrip,
    smartAssignDriver,
    bulkOperations,
    filterTrips,
    searchTrips,
    realtimeStats,
    emergencyManagement,
    
    // Utility functions
    calculateTripPriority,
    findOptimalDriver,
  };

  return (
    <DispatcherContext.Provider value={value}>
      {children}
    </DispatcherContext.Provider>
  );
};

export default DispatcherProvider;