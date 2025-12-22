import crypto from 'crypto';
import User from '../models/User.js';
import VehicleTracker from '../models/VehicleTracker.js';
import Vehicle from '../models/Vehicle.js';
import jwt from 'jsonwebtoken';

/**
 * Service for managing dual login (driver section and vehicle tracking)
 */
class DualLoginService {
  /**
   * Generate a unique driver ID in format DRV-XXXX-YYYY
   * where XXXX is random alphanumeric and YYYY is timestamp-based
   */
  static generateDriverId() {
    // Generate random alphanumeric portion (4 characters)
    const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase().slice(0, 4);
    
    // Generate timestamp-based portion (4 digits)
    const timestampPart = Math.floor(Date.now() / 1000) % 10000;
    const timestampStr = timestampPart.toString().padStart(4, '0');
    
    return `DRV-${randomPart}-${timestampStr}`;
  }
  
  /**
   * Validate driver ID format
   */
  static validateDriverId(driverId) {
    const driverIdRegex = /^DRV-[A-F0-9]{4}-\d{4}$/;
    return driverIdRegex.test(driverId);
  }
  
  /**
   * Assign a driver ID to a user
   */
  static async assignDriverId(userId, expiryDays = 365) {
    try {
      let driverId;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;
      
      // Generate unique driver ID
      while (!isUnique && attempts < maxAttempts) {
        driverId = this.generateDriverId();
        const existing = await User.findOne({ driverId });
        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }
      
      if (!isUnique) {
        throw new Error('Failed to generate unique driver ID after maximum attempts');
      }
      
      const user = await User.findByIdAndUpdate(
        userId,
        {
          driverId,
          driverIdGeneratedAt: new Date(),
          driverIdExpiryDate: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000),
          dualLoginEnabled: true,
          dualLoginEnabledAt: new Date()
        },
        { new: true }
      );
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return {
        success: true,
        driverId: user.driverId,
        expiryDate: user.driverIdExpiryDate,
        message: 'Driver ID assigned successfully'
      };
    } catch (error) {
      throw new Error(`Failed to assign driver ID: ${error.message}`);
    }
  }
  
  /**
   * Regenerate an expired driver ID
   */
  static async regenerateDriverId(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Revoke old ID
      const oldDriverId = user.driverId;
      
      // Generate new ID
      let driverId;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (!isUnique && attempts < maxAttempts) {
        driverId = this.generateDriverId();
        const existing = await User.findOne({ driverId });
        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }
      
      if (!isUnique) {
        throw new Error('Failed to generate unique driver ID');
      }
      
      user.driverId = driverId;
      user.driverIdGeneratedAt = new Date();
      user.driverIdExpiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      
      await user.save();
      
      return {
        success: true,
        oldDriverId,
        newDriverId: driverId,
        expiryDate: user.driverIdExpiryDate,
        message: 'Driver ID regenerated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to regenerate driver ID: ${error.message}`);
    }
  }
  
  /**
   * Setup vehicle tracker for a vehicle
   */
  static async setupVehicleTracker(vehicleId, phoneNumber, setupData = {}, setupBy) {
    try {
      // Check if vehicle exists
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }
      
      // Check if tracker already exists
      const existingTracker = await VehicleTracker.findOne({ vehicleId });
      if (existingTracker && existingTracker.status !== 'archived') {
        throw new Error('Vehicle already has an active tracker');
      }
      
      // Check if phone number is unique
      const phoneInUse = await VehicleTracker.findOne({
        phoneNumber,
        status: { $ne: 'archived' }
      });
      if (phoneInUse) {
        throw new Error('Phone number already in use by another tracker');
      }
      
      // Create new tracker
      const tracker = new VehicleTracker({
        vehicleId,
        phoneNumber,
        status: 'inactive', // Will be activated after device setup
        linkedAt: new Date(),
        setupBy,
        trackingSettings: {
          frequency: setupData.trackingFrequency || 30,
          gpsEnabled: setupData.gpsEnabled !== false,
          cellularEnabled: setupData.cellularEnabled !== false,
          wifiEnabled: setupData.wifiEnabled !== false
        },
        alertSettings: {
          lowBatteryThreshold: setupData.lowBatteryThreshold || 20,
          lowBatteryAlert: setupData.lowBatteryAlert !== false
        },
        notes: setupData.notes
      });
      
      // Add activity log
      tracker.activityLog.push({
        action: 'activated', // Will be actual "activated" when device confirms
        performedBy: setupBy,
        details: {
          setupData: {
            trackingFrequency: setupData.trackingFrequency,
            alertSettings: setupData.alertSettings
          }
        },
        performedAt: new Date()
      });
      
      await tracker.save();
      
      return {
        success: true,
        trackerId: tracker._id,
        vehicleId: tracker.vehicleId,
        phoneNumber: tracker.phoneNumber,
        status: tracker.status,
        message: 'Vehicle tracker setup initiated. Awaiting device confirmation.'
      };
    } catch (error) {
      throw new Error(`Failed to setup vehicle tracker: ${error.message}`);
    }
  }
  
  /**
   * Authenticate driver using driver number
   */
  static async authenticateDriver(driverId, pin = null) {
    try {
      // Validate driver ID format
      if (!this.validateDriverId(driverId)) {
        throw new Error('Invalid driver ID format');
      }
      
      // Find user by driver ID
      const user = await User.findOne({
        driverId,
        dualLoginEnabled: true
      }).select('+password');
      
      if (!user) {
        throw new Error('Driver ID not found or dual login not enabled');
      }
      
      // Check if driver ID is expired
      if (user.driverIdExpiryDate && user.driverIdExpiryDate < new Date()) {
        throw new Error('Driver ID has expired. Please regenerate a new ID.');
      }
      
      // Generate JWT token for driver section
      const driverToken = jwt.sign(
        {
          userId: user._id,
          driverId: user.driverId,
          loginType: 'driver_number',
          section: 'driver'
        },
        process.env.JWT_SECRET || 'default-jwt-secret',
        { expiresIn: '12h' }
      );
      
      return {
        success: true,
        token: driverToken,
        driverId: user.driverId,
        userId: user._id,
        userName: user.name,
        message: 'Authentication successful'
      };
    } catch (error) {
      throw new Error(`Driver authentication failed: ${error.message}`);
    }
  }
  
  /**
   * Authenticate vehicle tracker (autonomous tracking account)
   */
  static async authenticateVehicleTracker(phoneNumber, imei = null) {
    try {
      // Find tracker by phone number
      const tracker = await VehicleTracker.findOne({
        phoneNumber,
        status: 'active'
      }).populate('vehicleId');
      
      if (!tracker) {
        throw new Error('Vehicle tracker not found or not active');
      }
      
      // Verify IMEI if provided
      if (imei && tracker.deviceImei && tracker.deviceImei !== imei) {
        throw new Error('Device IMEI does not match registered tracker');
      }
      
      // Generate autonomous tracking token (longer validity)
      const trackerToken = jwt.sign(
        {
          trackerId: tracker._id,
          vehicleId: tracker.vehicleId._id,
          phoneNumber: tracker.phoneNumber,
          loginType: 'vehicle_phone',
          section: 'tracker',
          autonomous: true // This token doesn't require session
        },
        process.env.JWT_SECRET || 'default-jwt-secret',
        { expiresIn: '30d' } // Longer expiry for autonomous tracking
      );
      
      // Update last activity
      tracker.lastTrackedAt = new Date();
      tracker.activityLog.push({
        action: 'activated',
        details: { authenticatedVia: 'phone_number' },
        performedAt: new Date()
      });
      await tracker.save();
      
      return {
        success: true,
        token: trackerToken,
        trackerId: tracker._id,
        vehicleId: tracker.vehicleId._id,
        vehicleName: tracker.vehicleId.name,
        phoneNumber: tracker.phoneNumber,
        autonomous: true,
        message: 'Vehicle tracker authenticated successfully'
      };
    } catch (error) {
      throw new Error(`Vehicle tracker authentication failed: ${error.message}`);
    }
  }
  
  /**
   * Check if user is eligible for dual login
   */
  static async checkDualLoginEligibility(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      const eligibility = {
        userId: user._id,
        canEnableDualLogin: true,
        reasons: [],
        currentStatus: {
          dualLoginEnabled: user.dualLoginEnabled,
          driverId: user.driverId,
          loginType: user.loginType,
          accountType: user.accountType
        }
      };
      
      // Check role eligibility
      const driverRoles = ['driver', 'dispatch_driver', 'contractor'];
      if (!user.roles || !user.roles.some(role => driverRoles.includes(role))) {
        eligibility.canEnableDualLogin = false;
        eligibility.reasons.push('User does not have driver role');
      }
      
      // Check if already enabled
      if (user.dualLoginEnabled) {
        eligibility.reasons.push('Dual login already enabled');
      }
      
      // Check for account restrictions
      if (user.accountStatus === 'suspended' || user.accountStatus === 'disabled') {
        eligibility.canEnableDualLogin = false;
        eligibility.reasons.push(`Account is ${user.accountStatus}`);
      }
      
      return eligibility;
    } catch (error) {
      throw new Error(`Failed to check eligibility: ${error.message}`);
    }
  }
  
  /**
   * Enable dual login for a user
   */
  static async enableDualLogin(userId, loginType = 'driver_number') {
    try {
      // Check eligibility first
      const eligibility = await this.checkDualLoginEligibility(userId);
      
      if (!eligibility.canEnableDualLogin && eligibility.currentStatus.dualLoginEnabled) {
        return {
          success: true,
          message: 'Dual login already enabled',
          driverId: eligibility.currentStatus.driverId
        };
      }
      
      if (!eligibility.canEnableDualLogin) {
        throw new Error(`Cannot enable dual login: ${eligibility.reasons.join(', ')}`);
      }
      
      // Assign driver ID if not exists
      const user = await User.findById(userId);
      if (!user.driverId) {
        const result = await this.assignDriverId(userId);
        return {
          success: true,
          driverId: result.driverId,
          expiryDate: result.expiryDate,
          loginType,
          message: 'Dual login enabled and driver ID assigned'
        };
      }
      
      return {
        success: true,
        driverId: user.driverId,
        expiryDate: user.driverIdExpiryDate,
        loginType,
        message: 'Dual login already enabled'
      };
    } catch (error) {
      throw new Error(`Failed to enable dual login: ${error.message}`);
    }
  }
  
  /**
   * Disable dual login for a user
   */
  static async disableDualLogin(userId, disabledBy = null) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        {
          dualLoginEnabled: false,
          driverId: null,
          driverIdGeneratedAt: null,
          driverIdExpiryDate: null,
          loginType: 'standard'
        },
        { new: true }
      );
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return {
        success: true,
        message: 'Dual login disabled successfully'
      };
    } catch (error) {
      throw new Error(`Failed to disable dual login: ${error.message}`);
    }
  }
  
  /**
   * Get driver section dashboard data
   */
  static async getDriverDashboardData(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user || !user.dualLoginEnabled) {
        throw new Error('Dual login not enabled for this user');
      }
      
      // Get associated trackers (if user manages vehicle trackers)
      const trackers = await VehicleTracker.find({ linkedUserId: userId })
        .populate('vehicleId')
        .select('-credentials')
        .lean();
      
      const trackerStatus = {
        active: trackers.filter(t => t.status === 'active').length,
        inactive: trackers.filter(t => t.status === 'inactive').length,
        suspended: trackers.filter(t => t.status === 'suspended').length,
        archived: trackers.filter(t => t.status === 'archived').length
      };
      
      return {
        userId: user._id,
        driverId: user.driverId,
        driverIdExpiry: user.driverIdExpiryDate,
        accountType: user.accountType,
        loginType: user.loginType,
        trackerStats: trackerStatus,
        trackerCount: trackers.length,
        recentTrackers: trackers.slice(0, 5)
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard data: ${error.message}`);
    }
  }
}

export default DualLoginService;
