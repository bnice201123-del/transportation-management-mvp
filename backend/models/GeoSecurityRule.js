/**
 * GeoSecurityRule Model
 * Location-based access control rules
 */

import mongoose from 'mongoose';

const geoSecurityRuleSchema = new mongoose.Schema({
  // Rule Information
  name: {
    type: String,
    required: true
  },
  description: String,
  
  // Rule Type
  ruleType: {
    type: String,
    enum: ['allow', 'deny', 'require_2fa', 'alert', 'challenge'],
    required: true,
    default: 'allow'
  },
  
  // Target Scope
  scope: {
    type: String,
    enum: ['global', 'role', 'user'],
    required: true,
    default: 'global'
  },
  targetRoles: [{
    type: String,
    enum: ['admin', 'dispatcher', 'scheduler', 'driver', 'rider']
  }],
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Geographic Conditions
  conditions: {
    // Countries (ISO 3166-1 alpha-2 codes)
    countries: [{
      code: String,
      name: String
    }],
    
    // Regions/States
    regions: [{
      country: String,
      region: String
    }],
    
    // Cities
    cities: [{
      country: String,
      region: String,
      city: String
    }],
    
    // Coordinates with radius (for geofencing)
    coordinates: [{
      latitude: Number,
      longitude: Number,
      radiusKm: Number,
      name: String
    }],
    
    // IP ranges (CIDR notation)
    ipRanges: [{
      cidr: String,
      description: String
    }],
    
    // Specific IPs
    specificIPs: [String],
    
    // Timezone restrictions
    timezones: [String]
  },
  
  // Time-based Conditions
  timeRestrictions: {
    // Days of week (0 = Sunday, 6 = Saturday)
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6
    }],
    
    // Time ranges (24-hour format)
    timeRanges: [{
      startTime: String, // HH:MM
      endTime: String,   // HH:MM
      timezone: String
    }],
    
    // Date ranges
    dateRanges: [{
      startDate: Date,
      endDate: Date
    }]
  },
  
  // Action Settings
  actionSettings: {
    // For 'require_2fa' type
    require2FA: Boolean,
    
    // For 'alert' type
    alertAdmins: Boolean,
    alertEmails: [String],
    alertWebhookUrl: String,
    
    // For 'challenge' type
    challengeType: {
      type: String,
      enum: ['captcha', 'security_questions', 'email_verification', 'sms_verification']
    },
    
    // For 'deny' type
    denyMessage: String,
    denyDuration: Number, // minutes
    
    // Custom message
    customMessage: String
  },
  
  // Priority (higher number = higher priority)
  priority: {
    type: Number,
    default: 0
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Statistics
  stats: {
    totalTriggered: {
      type: Number,
      default: 0
    },
    lastTriggered: Date,
    successCount: {
      type: Number,
      default: 0
    },
    deniedCount: {
      type: Number,
      default: 0
    }
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  notes: String
}, {
  timestamps: true
});

// Indexes
geoSecurityRuleSchema.index({ isActive: 1, priority: -1 });
geoSecurityRuleSchema.index({ scope: 1, isActive: 1 });
geoSecurityRuleSchema.index({ targetRoles: 1, isActive: 1 });
geoSecurityRuleSchema.index({ targetUsers: 1, isActive: 1 });

// Instance Methods

/**
 * Check if location matches this rule
 */
geoSecurityRuleSchema.methods.matchesLocation = function(location) {
  const conditions = this.conditions;
  let matches = false;

  // Check countries
  if (conditions.countries && conditions.countries.length > 0) {
    matches = conditions.countries.some(c => c.code === location.country);
    if (matches) return true;
  }

  // Check regions
  if (conditions.regions && conditions.regions.length > 0) {
    matches = conditions.regions.some(r => 
      r.country === location.country && r.region === location.region
    );
    if (matches) return true;
  }

  // Check cities
  if (conditions.cities && conditions.cities.length > 0) {
    matches = conditions.cities.some(c => 
      c.country === location.country && 
      c.region === location.region && 
      c.city === location.city
    );
    if (matches) return true;
  }

  // Check coordinates (geofencing)
  if (conditions.coordinates && conditions.coordinates.length > 0 && location.latitude && location.longitude) {
    matches = conditions.coordinates.some(coord => {
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        coord.latitude,
        coord.longitude
      );
      return distance <= coord.radiusKm;
    });
    if (matches) return true;
  }

  // Check specific IPs
  if (conditions.specificIPs && conditions.specificIPs.length > 0) {
    matches = conditions.specificIPs.includes(location.ip);
    if (matches) return true;
  }

  // Check IP ranges (simplified - just exact match for now)
  if (conditions.ipRanges && conditions.ipRanges.length > 0) {
    // TODO: Implement CIDR matching
    matches = conditions.ipRanges.some(range => location.ip.startsWith(range.cidr.split('/')[0]));
    if (matches) return true;
  }

  // Check timezones
  if (conditions.timezones && conditions.timezones.length > 0) {
    matches = conditions.timezones.includes(location.timezone);
    if (matches) return true;
  }

  return matches;
};

/**
 * Check if current time matches time restrictions
 */
geoSecurityRuleSchema.methods.matchesTimeRestrictions = function() {
  if (!this.timeRestrictions) return true;

  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  // Check days of week
  if (this.timeRestrictions.daysOfWeek && this.timeRestrictions.daysOfWeek.length > 0) {
    if (!this.timeRestrictions.daysOfWeek.includes(dayOfWeek)) {
      return false;
    }
  }

  // Check time ranges
  if (this.timeRestrictions.timeRanges && this.timeRestrictions.timeRanges.length > 0) {
    const inTimeRange = this.timeRestrictions.timeRanges.some(range => {
      return currentTime >= range.startTime && currentTime <= range.endTime;
    });
    if (!inTimeRange) {
      return false;
    }
  }

  // Check date ranges
  if (this.timeRestrictions.dateRanges && this.timeRestrictions.dateRanges.length > 0) {
    const inDateRange = this.timeRestrictions.dateRanges.some(range => {
      return now >= range.startDate && now <= range.endDate;
    });
    if (!inDateRange) {
      return false;
    }
  }

  return true;
};

/**
 * Check if rule applies to user
 */
geoSecurityRuleSchema.methods.appliesToUser = function(userId, userRole) {
  // Global scope applies to everyone
  if (this.scope === 'global') return true;

  // Role-based scope
  if (this.scope === 'role') {
    return this.targetRoles.includes(userRole);
  }

  // User-specific scope
  if (this.scope === 'user') {
    return this.targetUsers.some(id => id.toString() === userId.toString());
  }

  return false;
};

/**
 * Record rule trigger
 */
geoSecurityRuleSchema.methods.recordTrigger = async function(allowed = true) {
  this.stats.totalTriggered += 1;
  this.stats.lastTriggered = new Date();
  
  if (allowed) {
    this.stats.successCount += 1;
  } else {
    this.stats.deniedCount += 1;
  }
  
  return this.save();
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
geoSecurityRuleSchema.methods.calculateDistance = function(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = this.toRadians(lat2 - lat1);
  const dLon = this.toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

/**
 * Convert degrees to radians
 */
geoSecurityRuleSchema.methods.toRadians = function(degrees) {
  return degrees * (Math.PI / 180);
};

// Static Methods

/**
 * Evaluate location against all active rules
 */
geoSecurityRuleSchema.statics.evaluateLocation = async function(userId, userRole, location) {
  const rules = await this.find({ isActive: true })
    .sort({ priority: -1 }) // Higher priority first
    .lean();

  const results = {
    allowed: true,
    requires2FA: false,
    shouldAlert: false,
    shouldChallenge: false,
    matchedRules: [],
    denyReason: null,
    customMessage: null
  };

  for (const rule of rules) {
    // Convert to model instance for method access
    const ruleInstance = new this(rule);
    
    // Check if rule applies to this user
    if (!ruleInstance.appliesToUser(userId, userRole)) {
      continue;
    }

    // Check if location matches
    if (!ruleInstance.matchesLocation(location)) {
      continue;
    }

    // Check time restrictions
    if (!ruleInstance.matchesTimeRestrictions()) {
      continue;
    }

    // Rule matched!
    results.matchedRules.push({
      id: rule._id,
      name: rule.name,
      type: rule.ruleType,
      priority: rule.priority
    });

    // Apply rule action
    switch (rule.ruleType) {
      case 'deny':
        results.allowed = false;
        results.denyReason = rule.actionSettings?.denyMessage || 'Access denied from this location';
        // Record trigger and return immediately (deny is final)
        await this.findByIdAndUpdate(rule._id, {
          $inc: {
            'stats.totalTriggered': 1,
            'stats.deniedCount': 1
          },
          $set: { 'stats.lastTriggered': new Date() }
        });
        return results;

      case 'require_2fa':
        results.requires2FA = true;
        results.customMessage = rule.actionSettings?.customMessage;
        break;

      case 'alert':
        results.shouldAlert = true;
        results.customMessage = rule.actionSettings?.customMessage;
        break;

      case 'challenge':
        results.shouldChallenge = true;
        results.challengeType = rule.actionSettings?.challengeType;
        results.customMessage = rule.actionSettings?.customMessage;
        break;

      case 'allow':
        // Explicit allow
        results.customMessage = rule.actionSettings?.customMessage;
        break;
    }

    // Record trigger
    await this.findByIdAndUpdate(rule._id, {
      $inc: {
        'stats.totalTriggered': 1,
        'stats.successCount': 1
      },
      $set: { 'stats.lastTriggered': new Date() }
    });
  }

  return results;
};

/**
 * Get all active rules for admin UI
 */
geoSecurityRuleSchema.statics.getActiveRules = async function(options = {}) {
  const query = { isActive: true };
  
  if (options.scope) {
    query.scope = options.scope;
  }
  
  if (options.ruleType) {
    query.ruleType = options.ruleType;
  }

  return this.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email')
    .populate('targetUsers', 'name email role');
};

/**
 * Get rule statistics
 */
geoSecurityRuleSchema.statics.getRuleStatistics = async function() {
  const [total, active, byType, byScope] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ isActive: true }),
    this.aggregate([
      {
        $group: {
          _id: '$ruleType',
          count: { $sum: 1 }
        }
      }
    ]),
    this.aggregate([
      {
        $group: {
          _id: '$scope',
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  // Get most triggered rules
  const mostTriggered = await this.find()
    .sort({ 'stats.totalTriggered': -1 })
    .limit(10)
    .select('name ruleType stats')
    .lean();

  return {
    total,
    active,
    inactive: total - active,
    byType: byType.map(t => ({ type: t._id, count: t.count })),
    byScope: byScope.map(s => ({ scope: s._id, count: s.count })),
    mostTriggered
  };
};

const GeoSecurityRule = mongoose.model('GeoSecurityRule', geoSecurityRuleSchema);

export default GeoSecurityRule;
