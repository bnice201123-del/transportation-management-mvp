import express from 'express';
import Trip from '../models/Trip.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { logActivity } from '../utils/logger.js';
import RecurringTripService from '../services/recurringTripService.js';
import {
  handleTripAssigned,
  handleTripCompleted,
  handleTripCancelled,
  handleTripStarted,
  handleDriverLocationUpdate
} from '../utils/tripLifecycleHooks.js';

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
    
    // Support both single role (legacy) and multiple roles array
    const userRoles = req.user.roles && req.user.roles.length > 0 
      ? req.user.roles 
      : [req.user.role];
    
    // If user ONLY has driver role (not admin/dispatcher/scheduler), filter to their trips
    const isDriverOnly = userRoles.includes('driver') && 
                        !userRoles.includes('admin') && 
                        !userRoles.includes('dispatcher') && 
                        !userRoles.includes('scheduler');
    
    if (isDriverOnly) {
      filter.assignedDriver = req.user._id;
    }
    // Schedulers, dispatchers and admins can see all trips

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
      .populate('rider', 'firstName lastName email phone')
      .populate('assignedDriver', 'firstName lastName email phone vehicleInfo')
      .populate('vehicle', 'make model year licensePlate vin status')
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

// Get recent trips
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const trips = await Trip.find()
      .populate('rider', 'firstName lastName email phone')
      .populate('assignedDriver', 'firstName lastName')
      .populate('vehicleId', 'make model licensePlate')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(trips);
  } catch (error) {
    console.error('Get recent trips error:', error);
    res.status(500).json({ message: 'Server error fetching recent trips' });
  }
});

// Advanced search endpoint for trips and ride history
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const {
      keyword, // New: Full-system keyword search
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
      limit = 100 // Increased default limit for comprehensive search
    } = req.query;

    // Build comprehensive filter object
    let filter = {};
    let populate = [
      { path: 'assignedDriver', select: 'firstName lastName name phone email _id' },
      { path: 'vehicle', select: 'make model licensePlate vehicleType _id' },
      { path: 'createdBy', select: 'firstName lastName name' }
    ];

    // Role-based filtering - more permissive for search
    if (req.user.role === 'driver') {
      // Drivers can search all trips but see limited details on others
      // Don't restrict by assignedDriver to allow seeing full schedule
    } else if (req.user.role === 'scheduler') {
      // Schedulers can see all trips for better coordination
      // No restrictions
    }
    // Dispatchers and admins can see all trips

    // Keyword search - search across all fields
    if (keyword && keyword.trim() !== '') {
      const keywordRegex = { $regex: keyword, $options: 'i' };
      filter.$or = [
        { tripId: keywordRegex },
        { riderName: keywordRegex },
        { riderPhone: keywordRegex },
        { riderEmail: keywordRegex },
        { 'pickupLocation.address': keywordRegex },
        { 'dropoffLocation.address': keywordRegex },
        { driverNotes: keywordRegex },
        { specialInstructions: keywordRegex },
        { status: keywordRegex },
        { tripType: keywordRegex }
      ];
      
      // Note: Driver name and vehicle searches require populated data,
      // so we'll filter those after the query in post-processing
    }

    // Date range filter - if no dates provided, search ALL history
    if (dateFrom || dateTo) {
      filter.scheduledDate = {};
      if (dateFrom) {
        filter.scheduledDate.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999); // End of day
        filter.scheduledDate.$lte = endDate;
      }
    }
    // If no date range specified, search across ALL dates (past, present, future)

    // Text-based filters (only apply if keyword is not used)
    if (!keyword) {
      if (riderName) {
        filter.riderName = { $regex: riderName, $options: 'i' };
      }

      if (tripId) {
        // Search by the tripId field (string like "T-2025-001234"), not _id
        filter.tripId = { $regex: tripId, $options: 'i' };
      }

      if (userId) {
        // Search in both rider and driver user IDs
        filter.$or = [
          { rider: userId },
          { assignedDriver: userId }
        ];
      }

      // Location filters
      if (pickupLocation) {
        filter['pickupLocation.address'] = { $regex: pickupLocation, $options: 'i' };
      }

      if (dropoffLocation) {
        filter['dropoffLocation.address'] = { $regex: dropoffLocation, $options: 'i' };
      }
    }

    // Status filter - if not specified, search ALL statuses
    if (status) {
      filter.status = status;
    }
    // If no status specified, include all: scheduled, in-progress, completed, cancelled

    if (isRecurring !== undefined && isRecurring !== '') {
      filter.isRecurring = isRecurring === 'true';
    }

    // Vehicle-related filters
    if (vehicleId) {
      filter.vehicle = vehicleId;
    }

    // Execute query with population
    let query = Trip.find(filter);
    populate.forEach(pop => query = query.populate(pop));

    const skip = (page - 1) * limit;
    const trips = await query
      .sort({ scheduledDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    // Post-process filtering for populated fields
    let filteredTrips = trips;

    // Keyword search post-processing for driver name and vehicle
    if (keyword && keyword.trim() !== '') {
      const keywordLower = keyword.toLowerCase();
      filteredTrips = filteredTrips.filter(trip => {
        // Check driver name
        const driver = trip.assignedDriver;
        if (driver) {
          const fullName = `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || driver.name || '';
          if (fullName.toLowerCase().includes(keywordLower)) return true;
        }
        
        // Check vehicle information
        const vehicle = trip.vehicle;
        if (vehicle) {
          const vehicleInfo = `${vehicle.make || ''} ${vehicle.model || ''} ${vehicle.licensePlate || ''} ${vehicle.vehicleType || ''}`;
          if (vehicleInfo.toLowerCase().includes(keywordLower)) return true;
        }
        
        // If already matched in database query, keep it
        return true;
      });
    }

    // Regular filter processing (when not using keyword search)
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
        return trip.vehicle?.vehicleType === vehicleType;
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
      resultsFound: enrichedTrips.length,
      totalInDatabase: total
    });

    // Return results with metadata
    res.json({
      trips: enrichedTrips,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
        hasMore: total > (page * limit)
      },
      searchInfo: {
        searchedAllHistory: !dateFrom && !dateTo,
        searchedAllStatuses: !status,
        dateRange: dateFrom || dateTo ? { from: dateFrom, to: dateTo } : 'all',
        statusFilter: status || 'all',
        resultsCount: enrichedTrips.length
      }
    });

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
      .populate('rider', 'firstName lastName email phone')
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

    // Schedulers, dispatchers and admins can update any recurring trip

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

    // Schedulers, dispatchers and admins can cancel any recurring trip

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
      .populate('rider', 'firstName lastName email phone')
      .populate('assignedDriver', 'firstName lastName phone vehicleInfo currentLocation')
      .populate('createdBy', 'firstName lastName');

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check authorization
    if (req.user.role === 'driver' && trip.assignedDriver?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    // Schedulers, dispatchers and admins can view any trip

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

    // Validate rider exists in the system
    if (!tripData.rider) {
      return res.status(400).json({ 
        message: 'Rider ID is required',
        error: 'RIDER_ID_REQUIRED'
      });
    }

    const rider = await User.findOne({ 
      _id: tripData.rider, 
      $or: [{ role: 'rider' }, { roles: 'rider' }],
      isActive: true 
    });

    if (!rider) {
      return res.status(404).json({ 
        message: 'Rider not found. The rider must be registered in the system before creating a trip.',
        error: 'RIDER_NOT_FOUND',
        riderId: tripData.rider
      });
    }

    // Populate rider information from the registered user
    tripData.riderName = `${rider.firstName} ${rider.lastName}`;
    tripData.riderPhone = rider.phone || tripData.riderPhone;
    tripData.riderEmail = rider.email;

    // Sanitize ObjectId fields - convert empty strings to null
    if (tripData.assignedDriver === '' || tripData.assignedDriver === 'null' || tripData.assignedDriver === 'undefined') {
      tripData.assignedDriver = null;
    }

    // If a driver is assigned, automatically assign their vehicle
    if (tripData.assignedDriver) {
      const assignedVehicle = await Vehicle.findOne({ 
        currentDriver: tripData.assignedDriver,
        isActive: true 
      });
      if (assignedVehicle) {
        tripData.vehicle = assignedVehicle._id;
      }
    }

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
      .populate('rider', 'firstName lastName phone email')
      .populate('assignedDriver', 'firstName lastName phone vehicleInfo')
      .populate('vehicle', 'make model year licensePlate vin')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({
      message: 'Trip created successfully',
      trip: populatedTrip
    });
  } catch (error) {
    console.error('Create trip error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
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
    if (req.user.role === 'driver' && trip.assignedDriver?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    // Schedulers, dispatchers and admins can update any trip

    // Sanitize ObjectId fields - convert empty strings to null
    const updateData = { ...req.body };
    if (updateData.assignedDriver === '' || updateData.assignedDriver === 'null' || updateData.assignedDriver === 'undefined') {
      updateData.assignedDriver = null;
      updateData.vehicle = null; // Clear vehicle if driver is unassigned
    }

    // If driver is being assigned or changed, auto-assign their vehicle
    if (updateData.assignedDriver && updateData.assignedDriver !== trip.assignedDriver?.toString()) {
      const assignedVehicle = await Vehicle.findOne({ 
        currentDriver: updateData.assignedDriver,
        isActive: true 
      });
      if (assignedVehicle) {
        updateData.vehicle = assignedVehicle._id;
      }
    }

    // Update trip
    Object.assign(trip, updateData);
    await trip.save();

    // Trigger lifecycle hook if driver was assigned
    if (updateData.assignedDriver && updateData.assignedDriver !== trip.assignedDriver?.toString()) {
      await handleTripAssigned(trip._id, updateData.assignedDriver, req.user.userId);
    }

    // Log activity
    await logActivity(
      req.user._id,
      'trip_updated',
      `Updated trip ${trip.tripId}`,
      { changes: req.body },
      trip._id
    );

    const updatedTrip = await Trip.findById(trip._id)
      .populate('rider', 'firstName lastName email phone')
      .populate('assignedDriver', 'firstName lastName phone vehicleInfo')
      .populate('vehicle', 'make model year licensePlate vin status')
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
    if (!driver) {
      return res.status(400).json({ message: 'Driver not found' });
    }

    // Check if user has driver role in their roles array
    const hasDriverRole = driver.roles && driver.roles.includes('driver');
    if (!hasDriverRole) {
      return res.status(400).json({ message: 'User does not have driver role' });
    }

    trip.assignedDriver = driverId;
    trip.status = 'assigned';
    await trip.save();

    // Trigger lifecycle hook for trip assignment
    await handleTripAssigned(trip._id, driverId, req.user.userId);

    // Log activity
    await logActivity(
      req.user._id,
      'trip_assigned',
      `Assigned trip ${trip.tripId} to driver ${driver.firstName} ${driver.lastName}`,
      { driverId, driverName: `${driver.firstName} ${driver.lastName}` },
      trip._id
    );

    const updatedTrip = await Trip.findById(trip._id)
      .populate('rider', 'firstName lastName email phone')
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
    const { status, location, tripMetrics } = req.body;
    
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check authorization for status changes
    if (req.user.role === 'driver' && trip.assignedDriver?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const oldStatus = trip.status;
    
    // Add to status history before changing
    if (!trip.statusHistory) {
      trip.statusHistory = [];
    }
    
    trip.statusHistory.push({
      status: oldStatus,
      changedBy: req.user._id,
      changedAt: new Date(),
      reason: tripMetrics?.cancellationReason || req.body.reason,
      metadata: { 
        fromEndpoint: 'status_update',
        location,
        tripMetrics 
      }
    });
    
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

    // Store trip metrics if provided (from Drive Mode)
    if (tripMetrics) {
      trip.tripMetrics = {
        completionTime: tripMetrics.completionTime ? new Date(tripMetrics.completionTime) : undefined,
        startTime: tripMetrics.startTime ? new Date(tripMetrics.startTime) : undefined,
        durationMinutes: tripMetrics.durationMinutes,
        distanceTraveled: tripMetrics.distanceTraveled,
        averageSpeed: tripMetrics.averageSpeed,
        finalLocation: tripMetrics.finalLocation,
        finalHeading: tripMetrics.finalHeading,
        cancellationReason: tripMetrics.cancellationReason
      };
    }

    await trip.save();

    // Trigger lifecycle hooks based on status changes
    if (status === 'in_progress' && oldStatus !== 'in_progress' && trip.assignedDriver) {
      await handleTripStarted(trip._id, trip.assignedDriver);
    }
    
    if (status === 'completed' && oldStatus !== 'completed') {
      await handleTripCompleted(trip._id, req.user.userId);
    }
    
    if (status === 'cancelled' && oldStatus !== 'cancelled') {
      const reason = tripMetrics?.cancellationReason || req.body.reason;
      await handleTripCancelled(trip._id, reason, req.user.userId);
    }
    
    // Update driver location if provided
    if (location && req.user.role === 'driver' && trip.assignedDriver) {
      await handleDriverLocationUpdate(
        trip._id,
        trip.assignedDriver,
        location.coordinates?.latitude || location.lat,
        location.coordinates?.longitude || location.lng,
        location.speed,
        location.accuracy
      );
    }

    // Log activity with metrics info
    const activityDetails = { oldStatus, newStatus: status, location };
    if (tripMetrics) {
      activityDetails.metrics = {
        duration: tripMetrics.durationMinutes,
        distance: tripMetrics.distanceTraveled
      };
    }

    await logActivity(
      req.user._id,
      'status_updated',
      `Changed trip ${trip.tripId} status from ${oldStatus} to ${status}`,
      activityDetails,
      trip._id
    );

    const updatedTrip = await Trip.findById(trip._id)
      .populate('rider', 'firstName lastName email phone')
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

// Revert trip status (un-complete or un-cancel)
router.post('/:id/revert-status', authenticateToken, authorizeRoles('dispatcher', 'scheduler', 'admin'), async (req, res) => {
  try {
    const { reason } = req.body;
    
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const currentStatus = trip.status;
    
    // Only allow reverting completed or cancelled trips
    if (currentStatus !== 'completed' && currentStatus !== 'cancelled') {
      return res.status(400).json({ 
        message: `Cannot revert trip with status: ${currentStatus}. Only completed or cancelled trips can be reverted.` 
      });
    }

    // Determine the appropriate prior state based on business rules
    let newStatus;
    let revertReason = reason || 'Status reverted by authorized user';
    
    if (currentStatus === 'completed') {
      // If trip was completed, check if it has actualPickupTime
      // If yes, revert to in_progress. If no, revert to assigned
      if (trip.actualPickupTime) {
        newStatus = 'in_progress';
        revertReason = reason || 'Un-completed trip - returning to in-progress';
        // Clear actualDropoffTime since trip is no longer completed
        trip.actualDropoffTime = null;
      } else if (trip.assignedDriver) {
        newStatus = 'assigned';
        revertReason = reason || 'Un-completed trip - returning to assigned';
      } else {
        newStatus = 'pending';
        revertReason = reason || 'Un-completed trip - returning to pending';
      }
    } else if (currentStatus === 'cancelled') {
      // For cancelled trips, check the last non-cancelled status from history
      if (trip.statusHistory && trip.statusHistory.length > 0) {
        // Find the most recent non-cancelled status
        const priorStatuses = trip.statusHistory
          .filter(h => h.status !== 'cancelled')
          .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));
        
        if (priorStatuses.length > 0) {
          newStatus = priorStatuses[0].status;
          revertReason = reason || `Un-cancelled trip - returning to ${newStatus}`;
        } else {
          // If no prior non-cancelled status, default based on assignment
          newStatus = trip.assignedDriver ? 'assigned' : 'pending';
          revertReason = reason || `Un-cancelled trip - returning to ${newStatus}`;
        }
      } else {
        // No history available, use assignment to determine
        newStatus = trip.assignedDriver ? 'assigned' : 'pending';
        revertReason = reason || `Un-cancelled trip - returning to ${newStatus}`;
      }
      
      // Clear cancellation data
      trip.cancellationReason = null;
      trip.cancelledBy = null;
      trip.cancelledAt = null;
      
      // Clear trip metrics cancellation reason if present
      if (trip.tripMetrics && trip.tripMetrics.cancellationReason) {
        trip.tripMetrics.cancellationReason = null;
      }
    }

    // Add to status history
    if (!trip.statusHistory) {
      trip.statusHistory = [];
    }
    
    trip.statusHistory.push({
      status: currentStatus,
      changedBy: req.user._id,
      changedAt: new Date(),
      reason: revertReason,
      metadata: { 
        action: 'revert',
        fromStatus: currentStatus,
        toStatus: newStatus,
        revertedBy: req.user._id
      }
    });

    // Update status
    trip.status = newStatus;
    
    await trip.save();

    // Log the reversion activity
    await logActivity(
      req.user._id,
      'trip_status_reverted',
      `Reverted trip ${trip.tripId} status from ${currentStatus} to ${newStatus}`,
      {
        oldStatus: currentStatus,
        newStatus: newStatus,
        reason: revertReason,
        revertedBy: `${req.user.firstName} ${req.user.lastName}`,
        timestamp: new Date()
      },
      trip._id
    );

    const updatedTrip = await Trip.findById(trip._id)
      .populate('rider', 'firstName lastName email phone')
      .populate('assignedDriver', 'firstName lastName phone vehicleInfo')
      .populate('createdBy', 'firstName lastName')
      .populate('statusHistory.changedBy', 'firstName lastName');

    res.json({
      message: `Trip status reverted successfully from ${currentStatus} to ${newStatus}`,
      trip: updatedTrip,
      reversion: {
        fromStatus: currentStatus,
        toStatus: newStatus,
        reason: revertReason,
        revertedAt: new Date(),
        revertedBy: {
          id: req.user._id,
          name: `${req.user.firstName} ${req.user.lastName}`
        }
      }
    });
  } catch (error) {
    console.error('Revert status error:', error);
    res.status(500).json({ message: 'Server error reverting trip status', error: error.message });
  }
});

// Delete trip
router.delete('/:id', authenticateToken, authorizeRoles('scheduler', 'dispatcher', 'admin'), async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Schedulers, dispatchers and admins can cancel any trip

    // Soft delete - mark as cancelled instead of deleting
    trip.status = 'cancelled';
    trip.cancelledBy = req.user._id;
    trip.cancelledAt = new Date();
    trip.cancellationReason = req.body.reason || 'Trip deleted';
    await trip.save();

    // Trigger lifecycle hook for trip cancellation
    await handleTripCancelled(trip._id, trip.cancellationReason, req.user.userId);

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