import express from 'express';
import TripTemplate from '../models/TripTemplate.js';
import Trip from '../models/Trip.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { logActivity } from '../utils/logger.js';

const router = express.Router();

// Get all templates (with filtering)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      isPublic,
      tags,
      search,
      sortBy = 'usageCount',
      sortOrder = 'desc',
      favoritesOnly = false
    } = req.query;

    const filter = { isActive: true };

    // User can see their own templates + public templates + templates shared with them
    const userRoles = req.user.roles?.length > 0 ? req.user.roles : [req.user.role];
    const isAdmin = userRoles.includes('admin') || userRoles.includes('scheduler');

    if (!isAdmin) {
      filter.$or = [
        { createdBy: req.user._id },
        { isPublic: true },
        { 'sharedWith.user': req.user._id }
      ];
    }

    if (category) filter.category = category;
    if (isPublic !== undefined) filter.isPublic = isPublic === 'true';
    if (tags) filter.tags = { $in: tags.split(',') };
    if (favoritesOnly === 'true') {
      filter.favoritedBy = req.user._id;
    }

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const templates = await TripTemplate.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await TripTemplate.countDocuments(filter);

    res.json({
      success: true,
      templates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching templates',
      error: error.message
    });
  }
});

// Get single template
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const template = await TripTemplate.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('sharedWith.user', 'firstName lastName email');

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check access permissions
    const userRoles = req.user.roles?.length > 0 ? req.user.roles : [req.user.role];
    const isAdmin = userRoles.includes('admin') || userRoles.includes('scheduler');
    const isOwner = template.createdBy._id.equals(req.user._id);
    const isSharedWith = template.sharedWith.some(share => share.user._id.equals(req.user._id));

    if (!isAdmin && !isOwner && !template.isPublic && !isSharedWith) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching template',
      error: error.message
    });
  }
});

// Create template
router.post('/', authenticateToken, authorizeRoles('scheduler', 'dispatcher', 'admin'), async (req, res) => {
  try {
    const templateData = {
      ...req.body,
      createdBy: req.user._id
    };

    const template = new TripTemplate(templateData);
    await template.save();

    await logActivity(
      req.user._id,
      'template_created',
      `Created trip template: ${template.name}`,
      { templateId: template._id }
    );

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      template
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating template',
      error: error.message
    });
  }
});

// Update template
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const template = await TripTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check permissions
    const userRoles = req.user.roles?.length > 0 ? req.user.roles : [req.user.role];
    const isAdmin = userRoles.includes('admin') || userRoles.includes('scheduler');
    const isOwner = template.createdBy.equals(req.user._id);
    const hasEditAccess = template.sharedWith.some(
      share => share.user.equals(req.user._id) && share.role === 'editor'
    );

    if (!isAdmin && !isOwner && !hasEditAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update fields
    const allowedUpdates = [
      'name', 'description', 'category', 'pickupLocation', 'dropoffLocation',
      'waypoints', 'defaultTripType', 'estimatedDuration', 'estimatedDistance',
      'estimatedCost', 'preferredTimeSlots', 'specialInstructions',
      'requiresWheelchair', 'requiresAssistance', 'maxPassengers',
      'isPublic', 'tags', 'routeOptimization', 'recurringPattern'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        template[field] = req.body[field];
      }
    });

    await template.save();

    await logActivity(
      req.user._id,
      'template_updated',
      `Updated trip template: ${template.name}`,
      { templateId: template._id }
    );

    res.json({
      success: true,
      message: 'Template updated successfully',
      template
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating template',
      error: error.message
    });
  }
});

// Delete template (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const template = await TripTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check permissions
    const userRoles = req.user.roles?.length > 0 ? req.user.roles : [req.user.role];
    const isAdmin = userRoles.includes('admin') || userRoles.includes('scheduler');
    const isOwner = template.createdBy.equals(req.user._id);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    template.isActive = false;
    await template.save();

    await logActivity(
      req.user._id,
      'template_deleted',
      `Deleted trip template: ${template.name}`,
      { templateId: template._id }
    );

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting template',
      error: error.message
    });
  }
});

// Create trip from template
router.post('/:id/create-trip', authenticateToken, async (req, res) => {
  try {
    const template = await TripTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    if (!template.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Template is not active'
      });
    }

    const {
      rider,
      riderName,
      riderPhone,
      riderEmail,
      scheduledDate,
      scheduledTime,
      timezone,
      overrides = {}
    } = req.body;

    // Required fields for trip creation
    if (!rider || !riderName || !scheduledDate || !scheduledTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: rider, riderName, scheduledDate, scheduledTime'
      });
    }

    // Build trip data from template
    const tripData = {
      rider,
      riderName,
      riderPhone: riderPhone || '',
      riderEmail: riderEmail || '',
      pickupLocation: template.pickupLocation,
      dropoffLocation: template.dropoffLocation,
      waypoints: template.waypoints,
      scheduledDate,
      scheduledTime,
      timezone: timezone || 'America/New_York',
      tripType: template.defaultTripType,
      estimatedDuration: template.estimatedDuration,
      estimatedDistance: template.estimatedDistance,
      estimatedCost: template.estimatedCost,
      specialInstructions: template.specialInstructions,
      createdBy: req.user._id,
      status: 'pending',
      metadata: {
        templateId: template._id,
        templateName: template.name,
        createdFromTemplate: true
      },
      // Apply any overrides
      ...overrides
    };

    const trip = new Trip(tripData);
    await trip.save();

    // Record template usage
    await template.recordUsage();

    await logActivity(
      req.user._id,
      'trip_created',
      `Created trip ${trip.tripId} from template: ${template.name}`,
      {
        tripId: trip.tripId,
        templateId: template._id,
        templateName: template.name
      },
      trip._id
    );

    res.status(201).json({
      success: true,
      message: 'Trip created from template successfully',
      trip
    });
  } catch (error) {
    console.error('Create trip from template error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating trip from template',
      error: error.message
    });
  }
});

// Add template to favorites
router.post('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const template = await TripTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    await template.addToFavorites(req.user._id);

    res.json({
      success: true,
      message: 'Template added to favorites'
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding template to favorites',
      error: error.message
    });
  }
});

// Remove template from favorites
router.delete('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const template = await TripTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    await template.removeFromFavorites(req.user._id);

    res.json({
      success: true,
      message: 'Template removed from favorites'
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing template from favorites',
      error: error.message
    });
  }
});

// Share template with users
router.post('/:id/share', authenticateToken, async (req, res) => {
  try {
    const { userIds, role = 'user' } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'userIds array is required'
      });
    }

    const template = await TripTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check permissions
    const userRoles = req.user.roles?.length > 0 ? req.user.roles : [req.user.role];
    const isAdmin = userRoles.includes('admin') || userRoles.includes('scheduler');
    const isOwner = template.createdBy.equals(req.user._id);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Add users to shared list
    userIds.forEach(userId => {
      const alreadyShared = template.sharedWith.some(
        share => share.user.equals(userId)
      );
      if (!alreadyShared) {
        template.sharedWith.push({ user: userId, role });
      }
    });

    await template.save();

    await logActivity(
      req.user._id,
      'template_shared',
      `Shared template "${template.name}" with ${userIds.length} user(s)`,
      { templateId: template._id, userIds }
    );

    res.json({
      success: true,
      message: 'Template shared successfully',
      template
    });
  } catch (error) {
    console.error('Share template error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sharing template',
      error: error.message
    });
  }
});

// Get template analytics
router.get('/:id/analytics', authenticateToken, authorizeRoles('scheduler', 'dispatcher', 'admin'), async (req, res) => {
  try {
    const template = await TripTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Get trips created from this template
    const trips = await Trip.find({
      'metadata.templateId': template._id
    }).select('status rating scheduledDate actualPickupTime actualDropoffTime');

    const completedTrips = trips.filter(t => t.status === 'completed');
    const cancelledTrips = trips.filter(t => t.status === 'cancelled');
    
    const completionRate = trips.length > 0
      ? (completedTrips.length / trips.length) * 100
      : 0;

    const avgRating = completedTrips.filter(t => t.rating).length > 0
      ? completedTrips.reduce((sum, t) => sum + (t.rating || 0), 0) / completedTrips.filter(t => t.rating).length
      : 0;

    const analytics = {
      totalTrips: trips.length,
      completedTrips: completedTrips.length,
      cancelledTrips: cancelledTrips.length,
      completionRate: parseFloat(completionRate.toFixed(2)),
      averageRating: parseFloat(avgRating.toFixed(2)),
      usageCount: template.usageCount,
      lastUsed: template.lastUsedAt,
      favoritedBy: template.favoritedBy.length
    };

    // Update template analytics
    template.analytics.totalTripsCreated = trips.length;
    template.analytics.completionRate = completionRate;
    template.analytics.averageRating = avgRating;
    await template.save();

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Get template analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching template analytics',
      error: error.message
    });
  }
});

export default router;
