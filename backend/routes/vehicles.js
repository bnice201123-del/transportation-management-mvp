import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';

const router = express.Router();

// Get all vehicles
router.get('/', authenticateToken, authorizeRoles('admin', 'scheduler', 'dispatcher', 'driver'), async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 50, search, make, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build query
    let query = { isActive: true };

    if (status !== 'all') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { licensePlate: { $regex: search, $options: 'i' } },
        { vin: { $regex: search, $options: 'i' } }
      ];
    }

    if (make && make !== 'all') {
      query.make = make;
    }

    // Build sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (page - 1) * limit;

    const vehicles = await Vehicle.find(query)
      .populate('currentDriver', 'firstName lastName email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Vehicle.countDocuments(query);

    res.json({
      success: true,
      data: {
        vehicles,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      },
      vehicles, // For backward compatibility
      vehicleCount: vehicles.length
    });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ message: 'Server error fetching vehicles', error: error.message });
  }
});

// Get driver's assigned vehicle
router.get('/driver/assigned', authenticateToken, async (req, res) => {
  try {
    // Check if user has driver role
    const hasDriverRole = req.user.role === 'driver' || (req.user.roles && req.user.roles.includes('driver'));
    if (!hasDriverRole) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Driver role required.' 
      });
    }

    const driverId = req.user._id || req.user.userId;
    
    const vehicle = await Vehicle.findOne({ 
      currentDriver: driverId,
      isActive: true 
    }).populate('currentDriver', 'firstName lastName email phone');

    if (!vehicle) {
      return res.json({ 
        success: true,
        vehicle: null,
        message: 'No vehicle assigned to this driver' 
      });
    }

    res.json({
      success: true,
      vehicle
    });
  } catch (error) {
    console.error('Get driver assigned vehicle error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching assigned vehicle', 
      error: error.message 
    });
  }
});

// Get vehicle by ID
router.get('/:id', authenticateToken, authorizeRoles('admin', 'scheduler', 'dispatcher', 'driver'), async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findById(id)
      .populate('currentDriver', 'firstName lastName email phone')
      .populate('trips', 'pickupTime dropoffTime status')
      .populate('createdBy', 'firstName lastName');

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    res.json(vehicle);
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ message: 'Server error fetching vehicle', error: error.message });
  }
});

// Create new vehicle
router.post('/', authenticateToken, authorizeRoles('admin', 'scheduler'), async (req, res) => {
  try {
    // Check for duplicate license plate
    if (req.body.licensePlate) {
      const existingPlate = await Vehicle.findOne({ 
        licensePlate: req.body.licensePlate,
        isActive: true 
      });
      if (existingPlate) {
        return res.status(400).json({ 
          success: false,
          message: 'A vehicle with this license plate already exists' 
        });
      }
    }

    // Check for duplicate VIN
    if (req.body.vin) {
      const existingVin = await Vehicle.findOne({ 
        vin: req.body.vin,
        isActive: true 
      });
      if (existingVin) {
        return res.status(400).json({ 
          success: false,
          message: 'A vehicle with this VIN already exists' 
        });
      }
    }

    const vehicleData = {
      ...req.body,
      createdBy: req.user.id
    };

    const vehicle = new Vehicle(vehicleData);
    await vehicle.save();

    await vehicle.populate('currentDriver', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      vehicle
    });
  } catch (error) {
    console.error('Create vehicle error:', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false,
        message: `A vehicle with this ${field} already exists` 
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Server error creating vehicle', 
      error: error.message 
    });
  }
});

// Update vehicle
router.put('/:id', authenticateToken, authorizeRoles('admin', 'scheduler'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check for duplicate license plate (excluding current vehicle)
    if (updates.licensePlate) {
      const existingPlate = await Vehicle.findOne({ 
        licensePlate: updates.licensePlate,
        _id: { $ne: id },
        isActive: true 
      });
      if (existingPlate) {
        return res.status(400).json({ 
          success: false,
          message: 'A vehicle with this license plate already exists' 
        });
      }
    }

    // Check for duplicate VIN (excluding current vehicle)
    if (updates.vin) {
      const existingVin = await Vehicle.findOne({ 
        vin: updates.vin,
        _id: { $ne: id },
        isActive: true 
      });
      if (existingVin) {
        return res.status(400).json({ 
          success: false,
          message: 'A vehicle with this VIN already exists' 
        });
      }
    }

    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.createdAt;
    delete updates.createdBy;

    const vehicle = await Vehicle.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('currentDriver', 'firstName lastName email');

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      vehicle
    });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({ message: 'Server error updating vehicle', error: error.message });
  }
});

// Delete vehicle (soft delete)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findByIdAndUpdate(
      id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({ message: 'Server error deleting vehicle', error: error.message });
  }
});

// Assign driver to vehicle
router.post('/:id/assign-driver', authenticateToken, authorizeRoles('admin', 'scheduler', 'dispatcher'), async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId } = req.body;

    if (!driverId) {
      return res.status(400).json({ 
        success: false,
        message: 'Driver ID is required' 
      });
    }

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({ 
        success: false,
        message: 'Vehicle not found' 
      });
    }

    // Verify driver exists and has driver role
    const driver = await User.findById(driverId);
    if (!driver) {
      return res.status(404).json({ 
        success: false,
        message: 'Driver not found' 
      });
    }

    // Check if user has driver role (either as primary role or in roles array)
    const hasDriverRole = driver.role === 'driver' || (driver.roles && driver.roles.includes('driver'));
    if (!hasDriverRole) {
      return res.status(400).json({ 
        success: false,
        message: 'Selected user is not a driver' 
      });
    }

    await vehicle.assignDriver(driverId);
    await vehicle.populate('currentDriver', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Driver assigned successfully',
      vehicle
    });
  } catch (error) {
    console.error('Assign driver error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error assigning driver', 
      error: error.message 
    });
  }
});

// Unassign driver from vehicle
router.post('/:id/unassign-driver', authenticateToken, authorizeRoles('admin', 'scheduler', 'dispatcher'), async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    await vehicle.unassignDriver();

    res.json({
      success: true,
      message: 'Driver unassigned successfully',
      vehicle
    });
  } catch (error) {
    console.error('Unassign driver error:', error);
    res.status(500).json({ message: 'Server error unassigning driver', error: error.message });
  }
});

// Update vehicle location
router.post('/:id/location', authenticateToken, authorizeRoles('admin', 'scheduler', 'dispatcher', 'driver'), async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng, address } = req.body;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    await vehicle.updateLocation(lat, lng, address);

    res.json({
      success: true,
      message: 'Location updated successfully',
      vehicle
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Server error updating location', error: error.message });
  }
});

// Add maintenance record
router.post('/:id/maintenance', authenticateToken, authorizeRoles('admin', 'scheduler'), async (req, res) => {
  try {
    const { id } = req.params;
    const maintenanceData = req.body;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    vehicle.maintenanceHistory.push({
      ...maintenanceData,
      date: new Date()
    });

    await vehicle.save();
    await vehicle.populate('currentDriver', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Maintenance record added successfully',
      vehicle
    });
  } catch (error) {
    console.error('Add maintenance error:', error);
    res.status(500).json({ message: 'Server error adding maintenance record', error: error.message });
  }
});

// Get vehicle statistics
router.get('/stats/overview', authenticateToken, authorizeRoles('admin', 'scheduler', 'dispatcher'), async (req, res) => {
  try {
    const stats = await Vehicle.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalVehicles: { $sum: 1 },
          activeVehicles: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          idleVehicles: {
            $sum: { $cond: [{ $eq: ['$status', 'idle'] }, 1, 0] }
          },
          maintenanceVehicles: {
            $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] }
          },
          assignedVehicles: {
            $sum: { $cond: [{ $ne: ['$currentDriver', null] }, 1, 0] }
          },
          avgFuelLevel: { $avg: '$fuelLevel' },
          avgMileage: { $avg: '$mileage' },
          wheelchairAccessible: {
            $sum: { $cond: ['$isWheelchairAccessible', 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalVehicles: 0,
      activeVehicles: 0,
      idleVehicles: 0,
      maintenanceVehicles: 0,
      assignedVehicles: 0,
      avgFuelLevel: 0,
      avgMileage: 0,
      wheelchairAccessible: 0
    };

    res.json({
      success: true,
      stats: result
    });
  } catch (error) {
    console.error('Get vehicle stats error:', error);
    res.status(500).json({ message: 'Server error fetching vehicle statistics', error: error.message });
  }
});

// Add maintenance record to vehicle
router.post('/:id/maintenance', authenticateToken, authorizeRoles('admin', 'scheduler', 'dispatcher'), async (req, res) => {
  try {
    const { id } = req.params;
    const maintenanceData = req.body;

    // Validate required fields
    if (!maintenanceData.type || !maintenanceData.description) {
      return res.status(400).json({
        success: false,
        message: 'Type and description are required'
      });
    }

    // Find the vehicle
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Create maintenance record
    const maintenanceRecord = {
      _id: require('mongoose').Types.ObjectId(),
      type: maintenanceData.type,
      description: maintenanceData.description,
      date: maintenanceData.date || new Date(),
      mileage: maintenanceData.mileage,
      cost: maintenanceData.cost,
      performedBy: maintenanceData.performedBy,
      notes: maintenanceData.notes,
      createdAt: new Date(),
      createdBy: req.user.id
    };

    // Add to vehicle's maintenance history
    if (!vehicle.maintenanceHistory) {
      vehicle.maintenanceHistory = [];
    }
    vehicle.maintenanceHistory.push(maintenanceRecord);

    // Update lastMaintenance date if this is a service or repair
    if (maintenanceData.type === 'service' || maintenanceData.type === 'repair') {
      vehicle.lastMaintenance = maintenanceData.date || new Date();
    }

    // Update mileage if provided
    if (maintenanceData.mileage) {
      vehicle.mileage = maintenanceData.mileage;
    }

    await vehicle.save();

    res.json({
      success: true,
      message: 'Maintenance record added successfully',
      data: maintenanceRecord
    });
  } catch (error) {
    console.error('Add maintenance record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding maintenance record',
      error: error.message
    });
  }
});

export default router;