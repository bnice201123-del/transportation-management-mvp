import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
  settings: {
    system: {
      siteName: { type: String, default: 'Transportation Management System' },
      companyName: { type: String, default: 'TransportCorp Inc.' },
      supportEmail: { type: String, default: 'support@transportcorp.com' },
      timezone: { type: String, default: 'America/New_York' },
      dateFormat: { type: String, default: 'MM/DD/YYYY' },
      timeFormat: { type: String, default: '12h' },
      language: { type: String, default: 'en' },
      maintenanceMode: { type: Boolean, default: false },
      enableRegistration: { type: Boolean, default: true }
    },
    security: {
      sessionTimeout: { type: Number, default: 30 },
      passwordMinLength: { type: Number, default: 8 },
      requireSpecialChar: { type: Boolean, default: true },
      requireNumber: { type: Boolean, default: true },
      maxLoginAttempts: { type: Number, default: 5 },
      lockoutDuration: { type: Number, default: 15 },
      twoFactorAuth: { type: Boolean, default: false },
      passwordExpiry: { type: Number, default: 90 }
    },
    notifications: {
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
      pushNotifications: { type: Boolean, default: true },
      tripUpdates: { type: Boolean, default: true },
      systemAlerts: { type: Boolean, default: true },
      weeklyReports: { type: Boolean, default: true },
      adminAlerts: { type: Boolean, default: true },
      maintenanceAlerts: { type: Boolean, default: true }
    },
    users: {
      maxUsers: { type: Number, default: 1000 },
      defaultRole: { type: String, default: 'rider' },
      requireApproval: { type: Boolean, default: false },
      autoAssignVehicles: { type: Boolean, default: true },
      allowProfileEdit: { type: Boolean, default: true }
    },
    trips: {
      maxAdvanceBooking: { type: Number, default: 30 },
      minBookingNotice: { type: Number, default: 2 },
      autoAssignDrivers: { type: Boolean, default: true },
      allowCancellation: { type: Boolean, default: true },
      cancellationWindow: { type: Number, default: 24 },
      enableRecurringTrips: { type: Boolean, default: true },
      maxRecurringInstances: { type: Number, default: 50 }
    },
    vehicles: {
      requireInspection: { type: Boolean, default: true },
      inspectionInterval: { type: Number, default: 30 },
      maintenanceReminders: { type: Boolean, default: true },
      trackMileage: { type: Boolean, default: true },
      fuelTracking: { type: Boolean, default: true },
      maxVehicleAge: { type: Number, default: 10 }
    },
    performance: {
      cacheEnabled: { type: Boolean, default: true },
      cacheDuration: { type: Number, default: 300 },
      logLevel: { type: String, default: 'info' },
      enableMetrics: { type: Boolean, default: true },
      dataRetention: { type: Number, default: 365 },
      backupFrequency: { type: String, default: 'daily' }
    },
    features: {
      gpsTracking: { type: Boolean, default: true },
      liveTracking: { type: Boolean, default: true },
      routeOptimization: { type: Boolean, default: true },
      analytics: { type: Boolean, default: true },
      reporting: { type: Boolean, default: true },
      mobileApp: { type: Boolean, default: true },
      apiAccess: { type: Boolean, default: false }
    }
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Singleton pattern - only one settings document
systemSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({ settings: {} });
  }
  return settings;
};

systemSettingsSchema.statics.updateSettings = async function(newSettings, userId) {
  let settings = await this.getSettings();
  settings.settings = { ...settings.settings, ...newSettings };
  settings.updatedBy = userId;
  await settings.save();
  return settings;
};

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

export default SystemSettings;
