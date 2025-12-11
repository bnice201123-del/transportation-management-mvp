import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import driverOnboardingService from '../services/driverOnboardingService.js';
import driverPerformanceService from '../services/driverPerformanceService.js';
import driverRatingService from '../services/driverRatingService.js';
import DriverOnboarding from '../models/DriverOnboarding.js';
import DriverPerformance from '../models/DriverPerformance.js';
import DriverRating from '../models/DriverRating.js';

const router = express.Router();

// ============================================================================
// DRIVER ONBOARDING ROUTES
// ============================================================================

/**
 * @route   POST /api/driver-management/onboarding/initialize
 * @desc    Initialize onboarding for a new driver
 * @access  Private (Admin, Manager)
 */
router.post('/onboarding/initialize', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const result = await driverOnboardingService.initializeOnboarding(req.body.driverId, req.body);
    
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.status(201).json({ success: true, data: result.onboarding });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/driver-management/onboarding/:driverId
 * @desc    Get driver onboarding status
 * @access  Private (Driver can view own, Admin/Manager can view all)
 */
router.get('/onboarding/:driverId', authenticateToken, async (req, res) => {
  try {
    // Authorization check
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user._id.toString() !== req.params.driverId) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this onboarding' });
    }

    const onboarding = await DriverOnboarding.findOne({ driver: req.params.driverId })
      .populate('driver', 'firstName lastName email phoneNumber profilePhoto');

    if (!onboarding) {
      return res.status(404).json({ success: false, message: 'Onboarding not found' });
    }

    res.json({ success: true, data: onboarding });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/driver-management/onboarding/tutorial/complete-step
 * @desc    Complete a tutorial step
 * @access  Private (Driver)
 */
router.put('/onboarding/tutorial/complete-step', authenticateToken, authorizeRoles('driver'), async (req, res) => {
  try {
    const onboarding = await driverOnboardingService.completeTutorialStep(req.user._id, req.body);
    res.json({ success: true, data: onboarding });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/driver-management/onboarding/training/:moduleId
 * @desc    Update training module progress
 * @access  Private (Driver)
 */
router.put('/onboarding/training/:moduleId', authenticateToken, authorizeRoles('driver'), async (req, res) => {
  try {
    const module = await driverOnboardingService.updateTrainingModule(
      req.user._id,
      req.params.moduleId,
      req.body
    );
    res.json({ success: true, data: module });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/driver-management/onboarding/certifications
 * @desc    Add certification
 * @access  Private (Driver, Admin, Manager)
 */
router.post('/onboarding/certifications', authenticateToken, async (req, res) => {
  try {
    const driverId = req.body.driverId || req.user._id;
    
    // Authorization check
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user._id.toString() !== driverId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const onboarding = await driverOnboardingService.addCertification(driverId, req.body);
    res.json({ success: true, data: onboarding });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/driver-management/onboarding/documents/upload
 * @desc    Upload document
 * @access  Private (Driver)
 */
router.post('/onboarding/documents/upload', authenticateToken, authorizeRoles('driver'), async (req, res) => {
  try {
    // Note: In production, integrate with file upload middleware (multer, etc.)
    const fileInfo = {
      filename: req.body.filename,
      path: req.body.fileUrl, // S3 URL or server path
      size: req.body.fileSize
    };

    const onboarding = await driverOnboardingService.uploadDocument(
      req.user._id,
      req.body,
      fileInfo
    );
    
    res.json({ success: true, data: onboarding });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/driver-management/onboarding/documents/:documentId/verify
 * @desc    Verify or reject document
 * @access  Private (Admin, Manager)
 */
router.put('/onboarding/documents/:documentId/verify', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const { driverId, approved, rejectionReason } = req.body;
    
    const onboarding = await driverOnboardingService.verifyDocument(
      driverId,
      req.params.documentId,
      req.user._id,
      approved,
      rejectionReason
    );
    
    res.json({ success: true, data: onboarding });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/driver-management/onboarding/background-check/initiate
 * @desc    Initiate background check
 * @access  Private (Admin, Manager)
 */
router.post('/onboarding/background-check/initiate', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const { driverId, provider } = req.body;
    
    const result = await driverOnboardingService.initiateBackgroundCheck(
      driverId,
      provider,
      req.user._id
    );
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/driver-management/onboarding/background-check/complete
 * @desc    Complete background check (webhook endpoint)
 * @access  Private (Admin, Manager, System)
 */
router.put('/onboarding/background-check/complete', authenticateToken, authorizeRoles('admin', 'manager', 'system'), async (req, res) => {
  try {
    const { driverId, result, reportUrl } = req.body;
    
    const onboarding = await driverOnboardingService.completeBackgroundCheck(
      driverId,
      result,
      reportUrl,
      req.user._id
    );
    
    res.json({ success: true, data: onboarding });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/driver-management/onboarding/emergency-contacts
 * @desc    Add emergency contact
 * @access  Private (Driver)
 */
router.post('/onboarding/emergency-contacts', authenticateToken, authorizeRoles('driver'), async (req, res) => {
  try {
    const onboarding = await driverOnboardingService.addEmergencyContact(req.user._id, req.body);
    res.json({ success: true, data: onboarding });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/driver-management/onboarding/handbook/acknowledge
 * @desc    Acknowledge driver handbook
 * @access  Private (Driver)
 */
router.put('/onboarding/handbook/acknowledge', authenticateToken, authorizeRoles('driver'), async (req, res) => {
  try {
    const { version, signature } = req.body;
    const ipAddress = req.ip;
    
    const onboarding = await driverOnboardingService.acknowledgeHandbook(
      req.user._id,
      version,
      ipAddress,
      signature
    );
    
    res.json({ success: true, data: onboarding });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/driver-management/onboarding/preferences
 * @desc    Set driver preferences (routes, areas, etc.)
 * @access  Private (Driver)
 */
router.put('/onboarding/preferences', authenticateToken, authorizeRoles('driver'), async (req, res) => {
  try {
    const onboarding = await driverOnboardingService.setPreferences(req.user._id, req.body);
    res.json({ success: true, data: onboarding });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/driver-management/onboarding/approve
 * @desc    Approve driver onboarding
 * @access  Private (Admin, Manager)
 */
router.put('/onboarding/approve', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const { driverId, notes } = req.body;
    
    const result = await driverOnboardingService.approveOnboarding(driverId, req.user._id, notes);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/driver-management/onboarding/certifications/expiring
 * @desc    Get drivers with expiring certifications
 * @access  Private (Admin, Manager)
 */
router.get('/onboarding/certifications/expiring', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const daysAhead = parseInt(req.query.days) || 30;
    const expiring = await driverOnboardingService.getExpiringCertifications(daysAhead);
    
    res.json({ success: true, data: expiring });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/driver-management/onboarding/statistics
 * @desc    Get onboarding statistics
 * @access  Private (Admin, Manager)
 */
router.get('/onboarding/statistics', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const stats = await driverOnboardingService.getOnboardingStatistics();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// DRIVER PERFORMANCE ROUTES
// ============================================================================

/**
 * @route   GET /api/driver-management/performance/:driverId
 * @desc    Get driver performance data
 * @access  Private (Driver can view own, Admin/Manager can view all)
 */
router.get('/performance/:driverId', authenticateToken, async (req, res) => {
  try {
    // Authorization check
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user._id.toString() !== req.params.driverId) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this performance data' });
    }

    const performance = await DriverPerformance.findOne({ 
      driver: req.params.driverId,
      period: 'all_time'
    }).populate('driver', 'firstName lastName email profilePhoto');

    if (!performance) {
      return res.status(404).json({ success: false, message: 'Performance data not found' });
    }

    res.json({ success: true, data: performance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/driver-management/performance/:driverId/dashboard
 * @desc    Get driver dashboard data
 * @access  Private (Driver)
 */
router.get('/performance/:driverId/dashboard', authenticateToken, async (req, res) => {
  try {
    // Authorization check
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user._id.toString() !== req.params.driverId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const dashboard = await driverPerformanceService.getDashboardData(req.params.driverId);
    res.json({ success: true, data: dashboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/driver-management/performance/alerts/:alertId/acknowledge
 * @desc    Acknowledge performance alert
 * @access  Private (Driver)
 */
router.put('/performance/alerts/:alertId/acknowledge', authenticateToken, authorizeRoles('driver'), async (req, res) => {
  try {
    const performance = await DriverPerformance.findOne({ 
      driver: req.user._id,
      period: 'all_time'
    });

    if (!performance) {
      return res.status(404).json({ success: false, message: 'Performance data not found' });
    }

    const alert = performance.alerts.id(req.params.alertId);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    alert.acknowledged = true;
    await performance.save();

    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/driver-management/performance/alerts/:alertId/resolve
 * @desc    Resolve performance alert
 * @access  Private (Driver, Admin, Manager)
 */
router.put('/performance/alerts/:alertId/resolve', authenticateToken, async (req, res) => {
  try {
    const driverId = req.body.driverId || req.user._id;

    const performance = await DriverPerformance.findOne({ 
      driver: driverId,
      period: 'all_time'
    });

    if (!performance) {
      return res.status(404).json({ success: false, message: 'Performance data not found' });
    }

    const alert = performance.alerts.id(req.params.alertId);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    alert.resolved = true;
    await performance.save();

    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/driver-management/performance/goals
 * @desc    Set performance goal
 * @access  Private (Driver, Admin, Manager)
 */
router.post('/performance/goals', authenticateToken, async (req, res) => {
  try {
    const driverId = req.body.driverId || req.user._id;
    
    // Authorization check
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user._id.toString() !== driverId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const performance = await driverPerformanceService.setGoal(driverId, req.body);
    res.json({ success: true, data: performance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/driver-management/performance/:driverId/compare-fleet
 * @desc    Compare driver performance with fleet average
 * @access  Private (Driver can view own, Admin/Manager can view all)
 */
router.get('/performance/:driverId/compare-fleet', authenticateToken, async (req, res) => {
  try {
    // Authorization check
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user._id.toString() !== req.params.driverId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const comparison = await driverPerformanceService.compareWithFleet(req.params.driverId);
    res.json({ success: true, data: comparison });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/driver-management/performance/:driverId/ranking
 * @desc    Calculate and update fleet ranking
 * @access  Private (Admin, Manager, System)
 */
router.put('/performance/:driverId/ranking', authenticateToken, authorizeRoles('admin', 'manager', 'system'), async (req, res) => {
  try {
    const ranking = await driverPerformanceService.calculateFleetRanking(req.params.driverId);
    res.json({ success: true, data: ranking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// DRIVER RATING ROUTES
// ============================================================================

/**
 * @route   POST /api/driver-management/ratings
 * @desc    Create a rating for a driver
 * @access  Private (Passenger)
 */
router.post('/ratings', authenticateToken, authorizeRoles('passenger'), async (req, res) => {
  try {
    const result = await driverRatingService.createRating(req.body, req.user._id);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/driver-management/ratings/:driverId
 * @desc    Get driver ratings and reviews
 * @access  Public (for approved ratings)
 */
router.get('/ratings/:driverId', async (req, res) => {
  try {
    const filters = {
      status: 'approved',
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      minRating: req.query.minRating ? parseFloat(req.query.minRating) : undefined,
      maxRating: req.query.maxRating ? parseFloat(req.query.maxRating) : undefined,
      hasReview: req.query.hasReview === 'true',
      tags: req.query.tags ? req.query.tags.split(',') : undefined
    };

    const result = await driverRatingService.getReviews(req.params.driverId, filters);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/driver-management/ratings/:driverId/summary
 * @desc    Get driver rating summary
 * @access  Public
 */
router.get('/ratings/:driverId/summary', async (req, res) => {
  try {
    const summary = await driverRatingService.getDriverRatingSummary(req.params.driverId);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/driver-management/ratings/:ratingId/respond
 * @desc    Driver responds to a review
 * @access  Private (Driver)
 */
router.put('/ratings/:ratingId/respond', authenticateToken, authorizeRoles('driver'), async (req, res) => {
  try {
    const result = await driverRatingService.respondToReview(
      req.params.ratingId,
      req.user._id,
      req.body.responseText
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/driver-management/ratings/:ratingId/helpful
 * @desc    Mark review as helpful
 * @access  Private
 */
router.put('/ratings/:ratingId/helpful', authenticateToken, async (req, res) => {
  try {
    const result = await driverRatingService.markHelpful(req.params.ratingId, req.user._id);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/driver-management/ratings/:ratingId/flag
 * @desc    Flag review for moderation
 * @access  Private
 */
router.put('/ratings/:ratingId/flag', authenticateToken, async (req, res) => {
  try {
    const rating = await driverRatingService.flagReview(
      req.params.ratingId,
      req.body.reason,
      req.user._id
    );
    
    res.json({ success: true, data: rating });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/driver-management/ratings/:ratingId/moderate
 * @desc    Moderate review (approve/reject)
 * @access  Private (Admin, Manager)
 */
router.put('/ratings/:ratingId/moderate', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const { approved, moderatorNotes } = req.body;
    
    const rating = await driverRatingService.moderateReview(
      req.params.ratingId,
      req.user._id,
      approved,
      moderatorNotes
    );
    
    res.json({ success: true, data: rating });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/driver-management/ratings/moderation/pending
 * @desc    Get pending reviews for moderation
 * @access  Private (Admin, Manager)
 */
router.get('/ratings/moderation/pending', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    
    const result = await driverRatingService.getPendingReviews(page, limit);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/driver-management/ratings/moderation/bulk-approve
 * @desc    Bulk approve reviews
 * @access  Private (Admin, Manager)
 */
router.post('/ratings/moderation/bulk-approve', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const { ratingIds } = req.body;
    
    const result = await driverRatingService.bulkApproveReviews(ratingIds, req.user._id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/driver-management/ratings/analytics/fleet
 * @desc    Get fleet-wide rating analytics
 * @access  Private (Admin, Manager)
 */
router.get('/ratings/analytics/fleet', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
  try {
    const analytics = await driverRatingService.getFleetRatingAnalytics();
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// COMBINED DRIVER PROFILE ROUTES
// ============================================================================

/**
 * @route   GET /api/driver-management/profile/:driverId
 * @desc    Get complete driver profile (onboarding, performance, ratings)
 * @access  Private
 */
router.get('/profile/:driverId', authenticateToken, async (req, res) => {
  try {
    // Authorization check
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user._id.toString() !== req.params.driverId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const [onboarding, performance, ratingSummary] = await Promise.all([
      DriverOnboarding.findOne({ driver: req.params.driverId })
        .populate('driver', 'firstName lastName email phoneNumber profilePhoto'),
      DriverPerformance.findOne({ driver: req.params.driverId, period: 'all_time' }),
      driverRatingService.getDriverRatingSummary(req.params.driverId)
    ]);

    const profile = {
      driver: onboarding?.driver,
      onboarding: {
        status: onboarding?.onboardingStatus,
        completionPercentage: onboarding?.completionPercentage,
        certificationsCount: onboarding?.certifications?.length || 0,
        documentsCount: onboarding?.documents?.length || 0
      },
      performance: {
        totalTrips: performance?.trips.completed || 0,
        rating: performance?.ratings.overall || 0,
        safeDrivingScore: performance?.safety.safeDrivingScore || 0,
        earnings: performance?.financial.totalEarnings || 0,
        ranking: performance?.ranking
      },
      ratings: ratingSummary
    };

    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/driver-management/leaderboard
 * @desc    Get driver leaderboard
 * @access  Private (Admin, Manager, Dispatcher)
 */
router.get('/leaderboard', authenticateToken, authorizeRoles('admin', 'manager', 'dispatcher'), async (req, res) => {
  try {
    const metric = req.query.metric || 'rating'; // rating, trips, earnings, safety
    const limit = parseInt(req.query.limit) || 10;

    let sortField = 'ratings.overall';
    switch (metric) {
      case 'trips':
        sortField = 'trips.completed';
        break;
      case 'earnings':
        sortField = 'financial.totalEarnings';
        break;
      case 'safety':
        sortField = 'safety.safeDrivingScore';
        break;
    }

    const leaders = await DriverPerformance.find({ period: 'all_time' })
      .populate('driver', 'firstName lastName profilePhoto')
      .sort({ [sortField]: -1 })
      .limit(limit);

    res.json({ success: true, data: leaders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

