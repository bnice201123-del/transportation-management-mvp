import express from 'express';
import Trip from '../models/Trip.js';
import User from '../models/User.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { logActivity } from '../utils/logger.js';
import RecurringTripService from '../services/recurringTripService.js';

const router = express.Router();

// Get all trips with filtering and pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      assignedDriver, 
      date,
      startDate,
      endDate,
      riderName,
      tripType,
      pickupLocation,
      dropoffLocation,
      vehicleId,
      sortBy = 'scheduledDate',
      sortOrder = 'desc',
      search 
    } = req.query;

    // Build filter object based on user role
    let filter = {};
    
    if (req.user.role === 'driver') {
      filter.assignedDriver = req.user._id;
    } else if (req.user.role === 'scheduler') {
      filter.createdBy = req.user._id;
    }
    // Dispatchers and admins can see all trips

    // Add additional filters
    if (status) filter.status = status;
    if (assignedDriver) filter.assignedDriver = assignedDriver;
    if (riderName) filter.riderName = { $regex: riderName, $options: 'i' };
    if (tripType) filter.tripType = tripType;
    if (pickupLocation) filter.pickupLocation = { $regex: pickupLocation, $options: 'i' };
    if (dropoffLocation) filter.dropoffLocation = { $regex: dropoffLocation, $options: 'i' };
    
    // Create array to hold complex conditions
    const andConditions = [];
    
    // Vehicle filtering - can match vehicleId or vehicle info in assignedDriver
    if (vehicleId) {
      andConditions.push({
        $or: [
          { vehicleId: vehicleId },
          { 'assignedDriver.vehicleInfo.vehicleId': vehicleId },
          { 'assignedDriver.vehicleInfo.licensePlate': vehicleId }
        ]
      });
    }

    // Date filtering - support both single date and date range
    if (date) {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setDate(endOfDay.getDate() + 1);
      andConditions.push({
        $or: [
          { scheduledDate: { $gte: startOfDay, $lt: endOfDay } },
          { createdAt: { $gte: startOfDay, $lt: endOfDay } }
        ]
      });
    } else if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) {
        // Set to end of day for endDate
        const endOfEndDate = new Date(endDate);
        endOfEndDate.setHours(23, 59, 59, 999);
        dateFilter.$lte = endOfEndDate;
      }
      andConditions.push({
        $or: [
          { scheduledDate: dateFilter },
          { createdAt: dateFilter }
        ]
      });
    }

    // Add search functionality
    if (search) {
      andConditions.push({
        $or: [
          { riderName: { $regex: search, $options: 'i' } },
          { tripId: { $regex: search, $options: 'i' } },
          { 'pickupLocation.address': { $regex: search, $options: 'i' } },
          { 'dropoffLocation.address': { $regex: search, $options: 'i' } }
        ]
      });
    }

    // Add AND conditions to filter if any exist
    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }

    const skip = (page - 1) * limit;
    
    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
    // Add secondary sort for consistency
    if (sortBy !== 'createdAt') sortObj.createdAt = -1;
    
    const trips = await Trip.find(filter)
      .populate('assignedDriver', 'firstName lastName email phone vehicleInfo')
      .populate('createdBy', 'firstName lastName email')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Trip.countDocuments(filter);

    res.json({
      success: true,
      data: {
        trips,
        total,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({ message: 'Server error fetching trips' });
  }
});

// Advanced search endpoint for trips and ride history
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const {
      dateFrom,
      dateTo,
      riderName,
      driverName,
      tripId,
      vehicleType,
      vehicleId,
      userId,
      status,
      pickupLocation,
      dropoffLocation,
      isRecurring,
      page = 1,
      limit = 50
    } = req.query;

    // Build comprehensive filter object
    let filter = {};
    let populate = [
      { path: 'assignedDriver', select: 'firstName lastName name phone _id' },
      { path: 'assignedVehicle', select: 'make model licensePlate vehicleType _id' },
      { path: 'createdBy', select: 'firstName lastName name' }
    ];

    // Role-based filtering
    if (req.user.role === 'driver') {
      filter.assignedDriver = req.user._id;
    } else if (req.user.role === 'scheduler') {
      // Schedulers can see trips they created or all if admin
      if (req.user.role !== 'admin') {
        filter.createdBy = req.user._id;
      }
    }
    // Dispatchers and admins can see all trips

    // Date range filter
    if (dateFrom || dateTo) {
      filter.scheduledDateTime = {};
      if (dateFrom) {
        filter.scheduledDateTime.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999); // End of day
        filter.scheduledDateTime.$lte = endDate;
      }
    }

    // Text-based filters
    if (riderName) {
      filter.riderName = { $regex: riderName, $options: 'i' };
    }

    if (tripId) {
      filter._id = { $regex: tripId, $options: 'i' };
    }

    if (userId) {
      // Search in both rider and driver user IDs
      filter.$or = [
        { riderId: userId },
        { assignedDriver: userId }
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (isRecurring !== undefined && isRecurring !== '') {
      filter.isRecurring = isRecurring === 'true';
    }

    // Location filters
    if (pickupLocation) {
      filter['pickupLocation.address'] = { $regex: pickupLocation, $options: 'i' };
    }

    if (dropoffLocation) {
      filter['dropoffLocation.address'] = { $regex: dropoffLocation, $options: 'i' };
    }

    // Vehicle-related filters
    if (vehicleId) {
      filter.assignedVehicle = vehicleId;
    }

    // Execute query with population
    let query = Trip.find(filter);
    populate.forEach(pop => query = query.populate(pop));

    const skip = (page - 1) * limit;
    const trips = await query
      .sort({ scheduledDateTime: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    // Post-process filtering for populated fields
    let filteredTrips = trips;

    if (driverName) {
      filteredTrips = filteredTrips.filter(trip => {
        const driver = trip.assignedDriver;
        if (!driver) return false;
        const fullName = `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || driver.name || '';
        return fullName.toLowerCase().includes(driverName.toLowerCase());
      });
    }

    if (vehicleType) {
      filteredTrips = filteredTrips.filter(trip => {
        return trip.assignedVehicle?.vehicleType === vehicleType;
      });
    }

    // Get total count for pagination
    const total = await Trip.countDocuments(filter);

    // Add user IDs to the response for tracking
    const enrichedTrips = filteredTrips.map(trip => ({
      ...trip.toObject(),
      riderId: trip.riderId || 'N/A',
      userId: trip.riderId || trip.assignedDriver?._id || 'N/A'
    }));

    await logActivity(req.user._id, 'search', 'trip', null, {
      searchCriteria: req.query,
      resultsFound: enrichedTrips.length
    });

    res.json(enrichedTrips);

  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({ 
      message: 'Server error during search',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Recurring Trips Routes - Must come before /:id route

// Create recurring trip
router.post('/recurring', authenticateToken, authorizeRoles(['scheduler', 'dispatcher', 'admin']), async (req, res) => {
  try {
    const result = await RecurringTripService.createRecurringTrip(req.body, req.user._id);
    
    await logActivity(
      req.user._id,
      'recurring_trip_created',
      `Created recurring trip ${result.parentTrip.tripId} with ${result.childTripsCount} occurrences`,
      { tripId: result.parentTrip.tripId },
      result.parentTrip._id
    );

    res.status(201).json(result);
  } catch (error) {
    console.error('Create recurring trip error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get recurring trips
router.get('/recurring', authenticateToken, async (req, res) => {
  try {
    let filter = { isRecurring: true };
    
    if (req.user.role === 'scheduler') {
      filter.createdBy = req.user._id;
    }

    const recurringTrips = await Trip.find(filter)
      .populate('assignedDriver', 'firstName lastName email phone')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Add pattern descriptions
    const tripsWithDescriptions = recurringTrips.map(trip => ({
      ...trip.toObject(),
      patternDescription: RecurringTripService.getRecurringPatternDescription(trip.recurringPattern)
    }));

    res.json({
      trips: tripsWithDescriptions,
      count: tripsWithDescriptions.length
    });
  } catch (error) {
    console.error('Get recurring trips error:', error);
    res.status(500).json({ message: 'Server error fetching recurring trips' });
  }
});

// Update recurring trip
router.put('/recurring/:id', authenticateToken, authorizeRoles(['scheduler', 'dispatcher', 'admin']), async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Recurring trip not found' });
    }

    // Check ownership for schedulers
    if (req.user.role === 'scheduler' && trip.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedTrip = await RecurringTripService.updateRecurringTrip(req.params.id, req.body);

    await logActivity(
      req.user._id,
      'recurring_trip_updated',
      `Updated recurring trip ${updatedTrip.tripId}`,
      { tripId: updatedTrip.tripId },
      updatedTrip._id
    );

    res.json({
      trip: updatedTrip,
      message: 'Recurring trip updated successfully'
    });
  } catch (error) {
    console.error('Update recurring trip error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Cancel recurring trip
router.delete('/recurring/:id', authenticateToken, authorizeRoles(['scheduler', 'dispatcher', 'admin']), async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Recurring trip not found' });
    }

    // Check ownership for schedulers
    if (req.user.role === 'scheduler' && trip.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { cancelFutureTrips = true } = req.body;
    const cancelledTrip = await RecurringTripService.cancelRecurringTrip(req.params.id, cancelFutureTrips);

    await logActivity(
      req.user._id,
      'recurring_trip_cancelled',
      `Cancelled recurring trip ${cancelledTrip.tripId}`,
      { 
        tripId: cancelledTrip.tripId,
        cancelFutureTrips 
      },
      cancelledTrip._id
    );

    res.json({
      message: 'Recurring trip cancelled successfully',
      cancelledFutureTrips: cancelFutureTrips
    });
  } catch (error) {
    console.error('Cancel recurring trip error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get pattern description helper
router.get('/recurring/pattern-description', authenticateToken, async (req, res) => {
  try {
    const { pattern } = req.query;
    if (!pattern) {
      return res.status(400).json({ message: 'Pattern is required' });
    }

    const parsedPattern = JSON.parse(pattern);
    const description = RecurringTripService.getRecurringPatternDescription(parsedPattern);
    
    res.json({ description });
  } catch (error) {
    console.error('Pattern description error:', error);
    res.status(400).json({ message: 'Invalid pattern format' });
  }
});

// Get single trip by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('assignedDriver', 'firstName lastName phone vehicleInfo currentLocation')
      .populate('createdBy', 'firstName lastName');

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check authorization
    if (req.user.role === 'driver' && trip.assignedDriver?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.user.role === 'scheduler' && trip.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(trip);
  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({ message: 'Server error fetching trip' });
  }
});

// Create new trip
router.post('/', authenticateToken, authorizeRoles('scheduler', 'dispatcher', 'admin'), async (req, res) => {
  try {
    const tripData = {
      ...req.body,
      createdBy: req.user._id
    };

    const trip = new Trip(tripData);
    await trip.save();

    // Log activity
    await logActivity(
      req.user._id, 
      'trip_created', 
      `Created trip ${trip.tripId} for ${trip.riderName}`,
      { tripId: trip._id },
      trip._id
    );

    const populatedTrip = await Trip.findById(trip._id)
      .populate('assignedDriver', 'firstName lastName phone vehicleInfo')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({
      message: 'Trip created successfully',
      trip: populatedTrip
    });
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({ message: 'Server error creating trip' });
  }
});

// Update trip
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check authorization
    if (req.user.role === 'scheduler' && trip.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.user.role === 'driver' && trip.assignedDriver?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update trip
    Object.assign(trip, req.body);
    await trip.save();

    // Log activity
    await logActivity(
      req.user._id,
      'trip_updated',
      `Updated trip ${trip.tripId}`,
      { changes: req.body },
      trip._id
    );

    const updatedTrip = await Trip.findById(trip._id)
      .populate('assignedDriver', 'firstName lastName phone vehicleInfo')
      .populate('createdBy', 'firstName lastName');

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('trip_updated', updatedTrip);
    }

    res.json({
      message: 'Trip updated successfully',
      trip: updatedTrip
    });
  } catch (error) {
    console.error('Update trip error:', error);
    res.status(500).json({ message: 'Server error updating trip' });
  }
});

// Assign driver to trip
router.post('/:id/assign', authenticateToken, authorizeRoles('scheduler', 'dispatcher', 'admin'), async (req, res) => {
  try {
    const { driverId } = req.body;
    
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const driver = await User.findById(driverId);
    if (!driver || driver.role !== 'driver') {
      return res.status(400).json({ message: 'Invalid driver' });
    }

    trip.assignedDriver = driverId;
    trip.status = 'assigned';
    await trip.save();

    // Log activity
    await logActivity(
      req.user._id,
      'trip_assigned',
      `Assigned trip ${trip.tripId} to driver ${driver.firstName} ${driver.lastName}`,
      { driverId, driverName: `${driver.firstName} ${driver.lastName}` },
      trip._id
    );

    const updatedTrip = await Trip.findById(trip._id)
      .populate('assignedDriver', 'firstName lastName phone vehicleInfo')
      .populate('createdBy', 'firstName lastName');

    res.json({
      message: 'Driver assigned successfully',
      trip: updatedTrip
    });
  } catch (error) {
    console.error('Assign driver error:', error);
    res.status(500).json({ message: 'Server error assigning driver' });
  }
});

// Update trip status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, location } = req.body;
    
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check authorization for status changes
    if (req.user.role === 'driver' && trip.assignedDriver?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const oldStatus = trip.status;
    trip.status = status;

    // Update timestamps based on status
    if (status === 'in_progress' && !trip.actualPickupTime) {
      trip.actualPickupTime = new Date();
    }
    if (status === 'completed' && !trip.actualDropoffTime) {
      trip.actualDropoffTime = new Date();
    }

    // Update driver location if provided
    if (location && req.user.role === 'driver') {
      trip.driverLocation = {
        ...location,
        lastUpdated: new Date()
      };
    }

    await trip.save();

    // Log activity
    await logActivity(
      req.user._id,
      'status_updated',
      `Changed trip ${trip.tripId} status from ${oldStatus} to ${status}`,
      { oldStatus, newStatus: status, location },
      trip._id
    );

    const updatedTrip = await Trip.findById(trip._id)
      .populate('assignedDriver', 'firstName lastName phone vehicleInfo')
      .populate('createdBy', 'firstName lastName');

    res.json({
      message: 'Trip status updated successfully',
      trip: updatedTrip
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Server error updating trip status' });
  }
});

// Delete trip
router.delete('/:id', authenticateToken, authorizeRoles('scheduler', 'dispatcher', 'admin'), async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check authorization
    if (req.user.role === 'scheduler' && trip.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Soft delete - mark as cancelled instead of deleting
    trip.status = 'cancelled';
    trip.cancelledBy = req.user._id;
    trip.cancelledAt = new Date();
    trip.cancellationReason = req.body.reason || 'Trip deleted';
    await trip.save();

    // Log activity
    await logActivity(
      req.user._id,
      'trip_cancelled',
      `Cancelled trip ${trip.tripId}`,
      { reason: trip.cancellationReason },
      trip._id
    );

    res.json({ message: 'Trip cancelled successfully' });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({ message: 'Server error deleting trip' });
  }
});

// Bulk update trips status
router.put('/bulk-update', authenticateToken, authorizeRoles('admin', 'scheduler', 'dispatcher'), async (req, res) => {
  try {
    const { ids, status, assignedDriver } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Trip IDs are required' });
    }

    if (!status && !assignedDriver) {
      return res.status(400).json({ message: 'Status or assigned driver is required' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (assignedDriver) updateData.assignedDriver = assignedDriver;
    updateData.updatedAt = new Date();

    const result = await Trip.updateMany(
      { _id: { $in: ids } },
      { $set: updateData }
    );

    // Log the bulk operation
    await logActivity(
      req.user._id,
      'bulk_update_trips',
      `Bulk updated ${result.modifiedCount} trips`,
      { tripIds: ids, updateData },
      null
    );

    res.json({
      message: `Successfully updated ${result.modifiedCount} trips`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk update trips error:', error);
    res.status(500).json({ message: 'Server error updating trips' });
  }
});

// Bulk delete trips
router.delete('/bulk-delete', authenticateToken, authorizeRoles('admin', 'scheduler', 'dispatcher'), async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Trip IDs are required' });
    }

    // Update trips to cancelled status instead of actually deleting
    const result = await Trip.updateMany(
      { _id: { $in: ids } },
      { 
        $set: { 
          status: 'cancelled',
          cancellationReason: 'Bulk cancelled by admin',
          updatedAt: new Date()
        }
      }
    );

    // Log the bulk operation
    await logActivity(
      req.user._id,
      'bulk_cancel_trips',
      `Bulk cancelled ${result.modifiedCount} trips`,
      { tripIds: ids },
      null
    );

    res.json({
      message: `Successfully cancelled ${result.modifiedCount} trips`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk delete trips error:', error);
    res.status(500).json({ message: 'Server error deleting trips' });
  }
});

export default router;