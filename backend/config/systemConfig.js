/**
 * System Configuration
 * Central configuration for the transportation management system
 */

export const SYSTEM_CONFIG = {
  // Default garage/office location for calculations
  GARAGE_LOCATION: {
    address: '5701 Shingle Creek Pkwy, Minneapolis, MN 55430',
    coordinates: {
      latitude: 45.0663,  // Approximate coordinates
      longitude: -93.3322
    },
    name: 'Main Garage'
  },

  // Trip monitoring thresholds
  TRIP_MONITORING: {
    // Minimum hours before pickup to send first unassigned alert
    minHoursBeforePickup: 1,
    
    // Minutes between follow-up alerts for unassigned trips
    followUpIntervalMinutes: 15,
    
    // Maximum number of follow-up alerts before stopping
    maxFollowUpAlerts: 10,
    
    // Minutes of no movement to trigger "driver stopped" alert
    driverStoppedThresholdMinutes: 5,
    
    // Minimum distance change (meters) to consider "moving"
    minimumMovementMeters: 50,
    
    // Tolerance for driver lateness (minutes)
    latenessToleranceMinutes: 0,  // Alert immediately if late
    
    // How often to check driver progress (seconds)
    driverProgressCheckInterval: 60,
    
    // GPS location staleness threshold (minutes)
    gpsStaleThresholdMinutes: 10
  },

  // Notification settings
  NOTIFICATIONS: {
    // Enable/disable notification types
    unassignedTripAlerts: true,
    tripLifecycleAlerts: true,
    driverLatenessAlerts: true,
    driverStoppedAlerts: true,
    
    // Priority levels
    unassignedTripPriority: 'high',
    lateDriverPriority: 'urgent',
    stoppedDriverPriority: 'urgent',
    lifecyclePriority: 'normal'
  },

  // Background job schedules (cron expressions)
  CRON_SCHEDULES: {
    checkUnassignedTrips: '* * * * *',        // Every minute
    checkDriverProgress: '* * * * *',         // Every minute
    checkDriverMovement: '*/2 * * * *',       // Every 2 minutes
    cleanupOldRecords: '0 2 * * *'            // 2 AM daily
  }
};

// Export individual configs for convenience
export const GARAGE_LOCATION = SYSTEM_CONFIG.GARAGE_LOCATION;
export const TRIP_MONITORING = SYSTEM_CONFIG.TRIP_MONITORING;
export const NOTIFICATIONS = SYSTEM_CONFIG.NOTIFICATIONS;
export const CRON_SCHEDULES = SYSTEM_CONFIG.CRON_SCHEDULES;

export default SYSTEM_CONFIG;
