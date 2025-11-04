import express from 'express';
import RecurringTrip from '../models/RecurringTrip.js';
import Trip from '../models/Trip.js';
import User from '../models/User.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Get all recurring trips
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      frequency,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    // Role-based filtering
    if (req.user.role === 'dispatcher') {
      // Dispatchers can see all recurring trips
    } else if (req.user.role === 'scheduler') {
      // Schedulers can see all recurring trips
    } else if (req.user.role === 'admin') {
      // Admins can see all recurring trips
    } else {
      // Other roles can only see their own
      filter.createdBy = req.user.id;
    }

    // Status filter
    if (status && status !== 'all') {
      if (status === 'active') {
        filter.isActive = true;
        filter.status = 'active';
      } else if (status === 'inactive') {
        filter.isActive = false;
      } else {
        filter.status = status;
      }
    }

    // Frequency filter
    if (frequency && frequency !== 'all') {
      filter.frequency = frequency;
    }

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { riderName: { $regex: search, $options: 'i' } },
        { 'pickupLocation.address': { $regex: search, $options: 'i' } },
        { 'dropoffLocation.address': { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const recurringTrips = await RecurringTrip.find(filter)
      .populate('createdBy', 'name email role')
      .populate('lastUpdatedBy', 'name email')
      .populate('assignedDriver', 'name email phone')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get total count for pagination
    const total = await RecurringTrip.countDocuments(filter);

    res.json({
      recurringTrips,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    });

  } catch (error) {
    console.error('Error fetching recurring trips:', error);
    res.status(500).json({ 
      message: 'Error fetching recurring trips', 
      error: error.message 
    });
  }
});

// Get single recurring trip
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const recurringTrip = await RecurringTrip.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('lastUpdatedBy', 'name email')
      .populate('assignedDriver', 'name email phone')
      .populate('generatedTrips.tripId', 'scheduledDate scheduledTime status');

    if (!recurringTrip) {
      return res.status(404).json({ message: 'Recurring trip not found' });
    }

    // Check permissions
    const canView = 
      req.user.role === 'admin' || 
      req.user.role === 'scheduler' || 
      req.user.role === 'dispatcher' ||
      recurringTrip.createdBy._id.toString() === req.user.id;

    if (!canView) {
      return res.status(403).json({ message: 'Not authorized to view this recurring trip' });
    }

    res.json(recurringTrip);
  } catch (error) {
    console.error('Error fetching recurring trip:', error);
    res.status(500).json({ 
      message: 'Error fetching recurring trip', 
      error: error.message 
    });
  }
});

// Create new recurring trip
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Check permissions
    if (!['admin', 'scheduler', 'dispatcher'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to create recurring trips' });
    }

    const recurringTripData = {
      ...req.body,
      createdBy: req.user.id,
      lastUpdatedBy: req.user.id
    };

    // Validate required fields
    const requiredFields = ['title', 'riderName', 'pickupLocation', 'dropoffLocation', 'frequency', 'startDate', 'startTime'];
    for (const field of requiredFields) {
      if (!recurringTripData[field]) {
        return res.status(400).json({ message: `Missing required field: ${field}` });
      }
    }

    // Validate location objects
    if (!recurringTripData.pickupLocation.address || !recurringTripData.pickupLocation.lat || !recurringTripData.pickupLocation.lng) {
      return res.status(400).json({ message: 'Invalid pickup location' });
    }

    if (!recurringTripData.dropoffLocation.address || !recurringTripData.dropoffLocation.lat || !recurringTripData.dropoffLocation.lng) {
      return res.status(400).json({ message: 'Invalid dropoff location' });
    }

    // Validate frequency-specific fields
    if (recurringTripData.frequency === 'weekly' && (!recurringTripData.daysOfWeek || recurringTripData.daysOfWeek.length === 0)) {
      return res.status(400).json({ message: 'Days of week are required for weekly frequency' });
    }

    if (recurringTripData.frequency === 'monthly' && !recurringTripData.dayOfMonth) {
      return res.status(400).json({ message: 'Day of month is required for monthly frequency' });
    }

    if (recurringTripData.frequency === 'custom') {
      if (!recurringTripData.customInterval || !recurringTripData.customUnit) {
        return res.status(400).json({ message: 'Custom interval and unit are required for custom frequency' });
      }
    }

    // Validate dates
    const startDate = new Date(recurringTripData.startDate);
    const endDate = recurringTripData.endDate ? new Date(recurringTripData.endDate) : null;

    if (endDate && endDate <= startDate) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const recurringTrip = new RecurringTrip(recurringTripData);
    await recurringTrip.save();

    // Populate the saved document before returning
    await recurringTrip.populate('createdBy', 'name email role');
    
    res.status(201).json(recurringTrip);
  } catch (error) {
    console.error('Error creating recurring trip:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors 
      });
    }
    
    res.status(500).json({ 
      message: 'Error creating recurring trip', 
      error: error.message 
    });
  }
});

// Update recurring trip
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const recurringTrip = await RecurringTrip.findById(req.params.id);

    if (!recurringTrip) {
      return res.status(404).json({ message: 'Recurring trip not found' });
    }

    // Check permissions
    const canEdit = 
      req.user.role === 'admin' || 
      req.user.role === 'scheduler' || 
      req.user.role === 'dispatcher' ||
      recurringTrip.createdBy.toString() === req.user.id;

    if (!canEdit) {
      return res.status(403).json({ message: 'Not authorized to update this recurring trip' });
    }

    // Update fields
    const updateData = {
      ...req.body,
      lastUpdatedBy: req.user.id
    };

    // Remove fields that shouldn't be updated
    delete updateData.createdBy;
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    // Validate dates if provided
    if (updateData.startDate && updateData.endDate) {
      const startDate = new Date(updateData.startDate);
      const endDate = new Date(updateData.endDate);

      if (endDate <= startDate) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }
    }

    const updatedRecurringTrip = await RecurringTrip.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'name email role')
    .populate('lastUpdatedBy', 'name email')
    .populate('assignedDriver', 'name email phone');

    res.json(updatedRecurringTrip);
  } catch (error) {
    console.error('Error updating recurring trip:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors 
      });
    }
    
    res.status(500).json({ 
      message: 'Error updating recurring trip', 
      error: error.message 
    });
  }
});

// Delete recurring trip
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const recurringTrip = await RecurringTrip.findById(req.params.id);

    if (!recurringTrip) {
      return res.status(404).json({ message: 'Recurring trip not found' });
    }

    // Check permissions
    const canDelete = 
      req.user.role === 'admin' || 
      req.user.role === 'scheduler' ||
      recurringTrip.createdBy.toString() === req.user.id;

    if (!canDelete) {
      return res.status(403).json({ message: 'Not authorized to delete this recurring trip' });
    }

    // Optional: Also delete all future generated trips
    if (req.query.deleteFutureTrips === 'true') {
      const futureTrips = recurringTrip.generatedTrips.filter(
        gt => gt.status === 'scheduled' && new Date(gt.scheduledDate) > new Date()
      );
      
      for (const generatedTrip of futureTrips) {
        await Trip.findByIdAndDelete(generatedTrip.tripId);
      }
    }

    await RecurringTrip.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Recurring trip deleted successfully' });
  } catch (error) {
    console.error('Error deleting recurring trip:', error);
    res.status(500).json({ 
      message: 'Error deleting recurring trip', 
      error: error.message 
    });
  }
});

// Generate preview of upcoming trips
router.get('/:id/preview', authenticateToken, async (req, res) => {
  try {
    const { days = 30, limit = 50 } = req.query;
    
    const recurringTrip = await RecurringTrip.findById(req.params.id);

    if (!recurringTrip) {
      return res.status(404).json({ message: 'Recurring trip not found' });
    }

    // Check permissions
    const canView = 
      req.user.role === 'admin' || 
      req.user.role === 'scheduler' || 
      req.user.role === 'dispatcher' ||
      recurringTrip.createdBy.toString() === req.user.id;

    if (!canView) {
      return res.status(403).json({ message: 'Not authorized to view this recurring trip' });
    }

    // Generate occurrences for preview
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(days));

    const occurrences = recurringTrip.generateOccurrences(startDate, endDate, parseInt(limit));

    res.json({
      recurringTrip: {
        title: recurringTrip.title,
        riderName: recurringTrip.riderName,
        frequency: recurringTrip.frequency,
        startDate: recurringTrip.startDate,
        endDate: recurringTrip.endDate
      },
      previewPeriod: {
        startDate,
        endDate,
        days: parseInt(days)
      },
      occurrences,
      totalOccurrences: occurrences.length
    });
  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(500).json({ 
      message: 'Error generating preview', 
      error: error.message 
    });
  }
});

// Generate actual trips from recurring pattern
router.post('/:id/generate', authenticateToken, async (req, res) => {
  try {
    const { days = 7, dryRun = false } = req.body;

    // Check permissions
    if (!['admin', 'scheduler'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to generate trips' });
    }

    const recurringTrip = await RecurringTrip.findById(req.params.id);

    if (!recurringTrip) {
      return res.status(404).json({ message: 'Recurring trip not found' });
    }

    if (!recurringTrip.isActive) {
      return res.status(400).json({ message: 'Cannot generate trips from inactive recurring pattern' });
    }

    // Generate occurrences
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(days));

    const occurrences = recurringTrip.generateOccurrences(startDate, endDate, 100);

    if (dryRun) {
      return res.json({
        message: 'Dry run completed',
        wouldGenerate: occurrences.length,
        occurrences: occurrences.slice(0, 10) // Show first 10 for preview
      });
    }

    // Create actual trips
    const createdTrips = [];
    const errors = [];

    for (const occurrence of occurrences) {
      try {
        // Check if trip already exists for this date
        const existingTrip = recurringTrip.generatedTrips.find(
          gt => gt.scheduledDate.toISOString().split('T')[0] === occurrence.scheduledDate
        );

        if (existingTrip) {
          continue; // Skip if already generated
        }

        const tripData = {
          riderName: recurringTrip.riderName,
          riderPhone: recurringTrip.riderPhone,
          riderEmail: recurringTrip.riderEmail,
          pickupLocation: recurringTrip.pickupLocation,
          dropoffLocation: recurringTrip.dropoffLocation,
          scheduledDate: occurrence.date,
          scheduledTime: recurringTrip.startTime,
          duration: recurringTrip.duration,
          assignedDriver: recurringTrip.assignedDriver,
          assignedVehicle: recurringTrip.assignedVehicle,
          fare: recurringTrip.fare,
          notes: `${recurringTrip.notes ? recurringTrip.notes + ' | ' : ''}Generated from recurring pattern: ${recurringTrip.title}`,
          status: 'scheduled',
          createdBy: req.user.id,
          recurringTripId: recurringTrip._id,
          isRecurring: true
        };

        const trip = new Trip(tripData);
        const savedTrip = await trip.save();

        // Add to recurring trip's generated trips tracking
        recurringTrip.generatedTrips.push({
          tripId: savedTrip._id,
          scheduledDate: occurrence.date,
          status: 'scheduled',
          generatedAt: new Date()
        });

        createdTrips.push(savedTrip);
      } catch (error) {
        errors.push({
          date: occurrence.scheduledDate,
          error: error.message
        });
      }
    }

    // Update recurring trip tracking
    if (createdTrips.length > 0) {
      await recurringTrip.updateGenerationTracking(createdTrips.length);
    }

    res.json({
      message: `Successfully generated ${createdTrips.length} trips`,
      generated: createdTrips.length,
      errors: errors.length,
      errorDetails: errors,
      trips: createdTrips.map(trip => ({
        id: trip._id,
        scheduledDate: trip.scheduledDate,
        scheduledTime: trip.scheduledTime,
        riderName: trip.riderName
      }))
    });

  } catch (error) {
    console.error('Error generating trips:', error);
    res.status(500).json({ 
      message: 'Error generating trips', 
      error: error.message 
    });
  }
});

// Get analytics for recurring trip
router.get('/:id/analytics', authenticateToken, async (req, res) => {
  try {
    const recurringTrip = await RecurringTrip.findById(req.params.id)
      .populate('generatedTrips.tripId', 'status scheduledDate completedAt');

    if (!recurringTrip) {
      return res.status(404).json({ message: 'Recurring trip not found' });
    }

    // Check permissions
    const canView = 
      req.user.role === 'admin' || 
      req.user.role === 'scheduler' || 
      req.user.role === 'dispatcher' ||
      recurringTrip.createdBy.toString() === req.user.id;

    if (!canView) {
      return res.status(403).json({ message: 'Not authorized to view analytics' });
    }

    // Calculate analytics
    const now = new Date();
    const generatedTrips = recurringTrip.generatedTrips.filter(gt => gt.tripId);
    
    const analytics = {
      totalGenerated: generatedTrips.length,
      completed: generatedTrips.filter(gt => gt.tripId.status === 'completed').length,
      scheduled: generatedTrips.filter(gt => gt.tripId.status === 'scheduled' && new Date(gt.scheduledDate) >= now).length,
      cancelled: generatedTrips.filter(gt => gt.tripId.status === 'cancelled').length,
      overdue: generatedTrips.filter(gt => gt.tripId.status === 'scheduled' && new Date(gt.scheduledDate) < now).length,
      
      // Rate calculations
      completionRate: generatedTrips.length > 0 ? 
        (generatedTrips.filter(gt => gt.tripId.status === 'completed').length / generatedTrips.length * 100).toFixed(2) : 0,
      cancellationRate: generatedTrips.length > 0 ? 
        (generatedTrips.filter(gt => gt.tripId.status === 'cancelled').length / generatedTrips.length * 100).toFixed(2) : 0,
      
      // Recent activity
      recentTrips: generatedTrips
        .filter(gt => gt.tripId)
        .sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate))
        .slice(0, 10)
        .map(gt => ({
          date: gt.scheduledDate,
          status: gt.tripId.status,
          completedAt: gt.tripId.completedAt
        })),
        
      // Next occurrences
      nextOccurrence: recurringTrip.nextOccurrence,
      computedStatus: recurringTrip.computedStatus,
      
      // Pattern info
      patternInfo: {
        frequency: recurringTrip.frequency,
        startDate: recurringTrip.startDate,
        endDate: recurringTrip.endDate,
        isActive: recurringTrip.isActive,
        maxOccurrences: recurringTrip.maxOccurrences,
        currentOccurrences: recurringTrip.currentOccurrences
      }
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ 
      message: 'Error fetching analytics', 
      error: error.message 
    });
  }
});

// Bulk operations
router.post('/bulk', authenticateToken, async (req, res) => {
  try {
    const { action, ids, data } = req.body;

    // Check permissions
    if (!['admin', 'scheduler'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized for bulk operations' });
    }

    if (!action || !ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: 'Invalid bulk operation request' });
    }

    let result = { success: 0, errors: [] };

    switch (action) {
      case 'activate':
        for (const id of ids) {
          try {
            await RecurringTrip.findByIdAndUpdate(id, { 
              isActive: true, 
              status: 'active',
              lastUpdatedBy: req.user.id 
            });
            result.success++;
          } catch (error) {
            result.errors.push({ id, error: error.message });
          }
        }
        break;

      case 'deactivate':
        for (const id of ids) {
          try {
            await RecurringTrip.findByIdAndUpdate(id, { 
              isActive: false, 
              status: 'inactive',
              lastUpdatedBy: req.user.id 
            });
            result.success++;
          } catch (error) {
            result.errors.push({ id, error: error.message });
          }
        }
        break;

      case 'delete':
        for (const id of ids) {
          try {
            await RecurringTrip.findByIdAndDelete(id);
            result.success++;
          } catch (error) {
            result.errors.push({ id, error: error.message });
          }
        }
        break;

      default:
        return res.status(400).json({ message: 'Invalid bulk action' });
    }

    res.json({
      message: `Bulk ${action} completed`,
      ...result
    });

  } catch (error) {
    console.error('Error in bulk operation:', error);
    res.status(500).json({ 
      message: 'Error in bulk operation', 
      error: error.message 
    });
  }
});

export default router;