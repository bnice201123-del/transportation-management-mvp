import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Update driver location
router.put('/:id/location', authenticateToken, authorizeRoles('driver', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, accuracy, timestamp, heading, speed } = req.body;

    // Verify the driver is updating their own location or admin is updating
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({ message: 'Can only update your own location' });
    }

    // Validate required fields
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    // Create location object
    const locationData = {
      coordinates: [longitude, latitude], // GeoJSON format [lng, lat]
      accuracy: accuracy || null,
      heading: heading || null,
      speed: speed || null,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      lastSeen: new Date()
    };

    // Update user location
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        currentLocation: locationData,
        isLocationTracking: true,
        lastLocationUpdate: new Date()
      },
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    console.log(`Location updated for driver ${updatedUser.firstName} ${updatedUser.lastName}:`, {
      lat: latitude,
      lng: longitude,
      accuracy: accuracy
    });

    res.json({
      success: true,
      message: 'Location updated successfully',
      location: {
        latitude,
        longitude,
        accuracy,
        timestamp: locationData.timestamp
      }
    });

  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Server error updating location' });
  }
});

// Mark driver as offline/stop tracking
router.put('/:id/location/offline', authenticateToken, authorizeRoles('driver', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Verify the driver is updating their own status or admin is updating
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json({ message: 'Can only update your own status' });
    }

    await User.findByIdAndUpdate(id, {
      isLocationTracking: false,
      lastLocationUpdate: new Date()
    });

    res.json({
      success: true,
      message: 'Driver marked as offline'
    });

  } catch (error) {
    console.error('Mark offline error:', error);
    res.status(500).json({ message: 'Server error marking driver offline' });
  }
});

// Get driver location history (for admin/dispatcher)
router.get('/:id/location/history', authenticateToken, authorizeRoles('admin', 'dispatcher'), async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, limit = 50 } = req.query;

    // In a real app, you'd have a separate LocationHistory collection
    // For now, we'll return the current location only
    const driver = await User.findById(id).select('currentLocation lastLocationUpdate firstName lastName');
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const history = driver.currentLocation ? [{
      timestamp: driver.lastLocationUpdate || new Date(),
      location: driver.currentLocation,
      driverName: `${driver.firstName} ${driver.lastName}`
    }] : [];

    res.json({
      success: true,
      data: {
        history,
        total: history.length
      }
    });

  } catch (error) {
    console.error('Get location history error:', error);
    res.status(500).json({ message: 'Server error fetching location history' });
  }
});

// Get all active driver locations (for live tracking dashboard)
router.get('/active', authenticateToken, authorizeRoles('admin', 'dispatcher', 'scheduler'), async (req, res) => {
  try {
    const drivers = await User.find({
      role: 'driver',
      isLocationTracking: true,
      currentLocation: { $exists: true }
    }).select('firstName lastName email phone currentLocation lastLocationUpdate vehicleInfo');

    const activeLocations = drivers.map(driver => ({
      driverId: driver._id,
      name: `${driver.firstName} ${driver.lastName}`,
      email: driver.email,
      phone: driver.phone,
      location: {
        lat: driver.currentLocation.coordinates[1], // Convert from GeoJSON
        lng: driver.currentLocation.coordinates[0],
        accuracy: driver.currentLocation.accuracy,
        lastUpdate: driver.lastLocationUpdate
      },
      vehicle: driver.vehicleInfo,
      isActive: driver.isLocationTracking
    }));

    res.json({
      success: true,
      data: {
        locations: activeLocations,
        count: activeLocations.length
      }
    });

  } catch (error) {
    console.error('Get active locations error:', error);
    res.status(500).json({ message: 'Server error fetching active locations' });
  }
});

export default router;