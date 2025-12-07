import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  // System Settings
  'system.appName': {
    type: String,
    default: 'TransportHub'
  },
  'system.maintenanceMode': {
    type: Boolean,
    default: false
  },
  'system.maintenanceMessage': {
    type: String,
    default: 'System is under maintenance. Please check back later.'
  },
  'system.timezone': {
    type: String,
    default: 'America/New_York'
  },
  'system.dateFormat': {
    type: String,
    default: 'MM/DD/YYYY'
  },
  'system.timeFormat': {
    type: String,
    default: '12h'
  },
  'system.language': {
    type: String,
    default: 'en'
  },
  'system.maxFileUploadSize': {
    type: Number,
    default: 5242880 // 5MB in bytes
  },
  'system.sessionTimeout': {
    type: Number,
    default: 3600000 // 1 hour in ms
  },
  'system.logLevel': {
    type: String,
    enum: ['error', 'warn', 'info', 'debug'],
    default: 'info'
  },

  // Security Settings
  'security.passwordMinLength': {
    type: Number,
    default: 8
  },
  'security.passwordRequireUppercase': {
    type: Boolean,
    default: true
  },
  'security.passwordRequireLowercase': {
    type: Boolean,
    default: true
  },
  'security.passwordRequireNumbers': {
    type: Boolean,
    default: true
  },
  'security.passwordRequireSpecialChars': {
    type: Boolean,
    default: true
  },
  'security.passwordExpiryDays': {
    type: Number,
    default: 90
  },
  'security.maxLoginAttempts': {
    type: Number,
    default: 5
  },
  'security.lockoutDuration': {
    type: Number,
    default: 900000 // 15 minutes in ms
  },
  'security.twoFactorRequired': {
    type: Boolean,
    default: false
  },
  'security.sessionEncryption': {
    type: Boolean,
    default: true
  },
  'security.ipWhitelist': {
    type: [String],
    default: []
  },
  'security.allowedOrigins': {
    type: [String],
    default: []
  },

  // Notification Settings
  'notifications.emailEnabled': {
    type: Boolean,
    default: true
  },
  'notifications.smsEnabled': {
    type: Boolean,
    default: false
  },
  'notifications.pushEnabled': {
    type: Boolean,
    default: true
  },
  'notifications.tripAssignmentEmail': {
    type: Boolean,
    default: true
  },
  'notifications.tripReminderEmail': {
    type: Boolean,
    default: true
  },
  'notifications.tripReminderMinutes': {
    type: Number,
    default: 30
  },
  'notifications.systemAlertEmail': {
    type: Boolean,
    default: true
  },
  'notifications.securityAlertEmail': {
    type: Boolean,
    default: true
  },

  // Maps & GPS Settings
  'maps.defaultZoom': {
    type: Number,
    default: 12
  },
  'maps.defaultCenter': {
    type: {
      lat: Number,
      lng: Number
    },
    default: { lat: 40.7128, lng: -74.0060 } // NYC
  },
  'maps.trackingInterval': {
    type: Number,
    default: 30000 // 30 seconds in ms
  },
  'maps.routeOptimization': {
    type: Boolean,
    default: true
  },
  'maps.trafficLayer': {
    type: Boolean,
    default: true
  },

  // Business Settings
  'business.companyName': {
    type: String,
    default: 'Transport Company'
  },
  'business.companyEmail': {
    type: String,
    default: ''
  },
  'business.companyPhone': {
    type: String,
    default: ''
  },
  'business.companyAddress': {
    type: String,
    default: ''
  },
  'business.operatingHoursStart': {
    type: String,
    default: '08:00'
  },
  'business.operatingHoursEnd': {
    type: String,
    default: '18:00'
  },
  'business.operatingDays': {
    type: [String],
    default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  },
  'business.currency': {
    type: String,
    default: 'USD'
  },
  'business.taxRate': {
    type: Number,
    default: 0
  },

  // Integration Settings
  'integration.twilioEnabled': {
    type: Boolean,
    default: false
  },
  'integration.googleMapsApiKey': {
    type: String,
    default: ''
  },
  'integration.stripeEnabled': {
    type: Boolean,
    default: false
  },
  'integration.webhooksEnabled': {
    type: Boolean,
    default: false
  },
  'integration.webhookUrl': {
    type: String,
    default: ''
  },

  // Audit Settings
  'audit.enabled': {
    type: Boolean,
    default: true
  },
  'audit.retentionDays': {
    type: Number,
    default: 90
  },
  'audit.logUserActions': {
    type: Boolean,
    default: true
  },
  'audit.logSystemEvents': {
    type: Boolean,
    default: true
  },

  // Rate Limit Settings
  'rateLimit.enabled': {
    type: Boolean,
    default: true
  },
  'rateLimit.maxRequests': {
    type: Number,
    default: 100
  },
  'rateLimit.windowMs': {
    type: Number,
    default: 900000 // 15 minutes
  },

  // Metadata
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'settings'
});

// Ensure only one settings document exists
settingsSchema.statics.getSingleton = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// Update setting with nested path support
settingsSchema.statics.updateSetting = async function(path, value, userId, req = null) {
  const settings = await this.getSingleton();
  const oldValue = settings.get(path);
  
  // Update the setting
  settings.set(path, value);
  settings.lastUpdated = new Date();
  settings.lastUpdatedBy = userId;
  await settings.save();
  
  // Log the change
  const { logSettingChange } = await import('../routes/settingsHistory.js');
  const category = path.split('.')[0]; // Extract category from path (e.g., 'system' from 'system.appName')
  
  await logSettingChange(path, category, oldValue, value, userId, req);
  
  return settings;
};

// Bulk update settings
settingsSchema.statics.bulkUpdate = async function(updates, userId, req = null) {
  const settings = await this.getSingleton();
  const changes = [];
  
  for (const [path, value] of Object.entries(updates)) {
    const oldValue = settings.get(path);
    if (oldValue !== value) {
      changes.push({ path, oldValue, newValue: value });
      settings.set(path, value);
    }
  }
  
  settings.lastUpdated = new Date();
  settings.lastUpdatedBy = userId;
  await settings.save();
  
  // Log all changes
  const { logSettingChange } = await import('../routes/settingsHistory.js');
  for (const change of changes) {
    const category = change.path.split('.')[0];
    await logSettingChange(change.path, category, change.oldValue, change.newValue, userId, req);
  }
  
  return settings;
};

// Get setting by path
settingsSchema.statics.getSetting = async function(path) {
  const settings = await this.getSingleton();
  return settings.get(path);
};

// Get all settings as flat object
settingsSchema.statics.getAll = async function() {
  const settings = await this.getSingleton();
  return settings.toObject();
};

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
