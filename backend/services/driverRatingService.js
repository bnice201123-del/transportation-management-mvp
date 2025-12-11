import DriverRating from '../models/DriverRating.js';
import DriverPerformance from '../models/DriverPerformance.js';
import Trip from '../models/Trip.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';

/**
 * DriverRatingService
 * Manages driver ratings, reviews, moderation, and analytics
 */

class DriverRatingService {
  /**
   * Create a new rating for a driver
   */
  async createRating(ratingData, passengerId) {
    try {
      // Verify trip exists and is completed
      const trip = await Trip.findById(ratingData.trip);
      if (!trip) {
        throw new Error('Trip not found');
      }

      if (trip.status !== 'completed') {
        return { success: false, message: 'Can only rate completed trips' };
      }

      // Verify passenger is the one who took the trip
      if (trip.passenger.toString() !== passengerId.toString()) {
        return { success: false, message: 'Unauthorized - not your trip' };
      }

      // Check if rating already exists for this trip
      const existingRating = await DriverRating.findOne({ trip: ratingData.trip });
      if (existingRating) {
        return { success: false, message: 'Trip already rated' };
      }

      // Create rating
      const rating = new DriverRating({
        driver: trip.driver,
        trip: ratingData.trip,
        passenger: passengerId,
        ratings: ratingData.ratings,
        review: ratingData.review,
        verified: true,
        verificationMethod: 'trip_completed',
        status: 'pending' // Will be moderated
      });

      await rating.save();

      // Update driver performance
      const DriverPerformanceService = (await import('./driverPerformanceService.js')).default;
      await DriverPerformanceService.updateAfterRating(rating._id);

      await ActivityLog.create({
        user: passengerId,
        action: 'driver_rated',
        target: 'DriverRating',
        targetId: rating._id,
        details: `Rated driver with ${rating.ratings.overall} stars`,
        metadata: { 
          driverId: trip.driver,
          tripId: ratingData.trip,
          overallRating: rating.ratings.overall
        }
      });

      return { success: true, rating };
    } catch (error) {
      throw new Error(`Failed to create rating: ${error.message}`);
    }
  }

  /**
   * Driver responds to a review
   */
  async respondToReview(ratingId, driverId, responseText) {
    try {
      const rating = await DriverRating.findById(ratingId);
      if (!rating) {
        throw new Error('Rating not found');
      }

      // Verify driver owns this rating
      if (rating.driver.toString() !== driverId.toString()) {
        return { success: false, message: 'Unauthorized - not your rating' };
      }

      // Check if already responded
      if (rating.response?.text) {
        return { success: false, message: 'Already responded to this review' };
      }

      rating.response = {
        text: responseText,
        respondedAt: new Date(),
        respondedBy: driverId
      };

      await rating.save();

      await ActivityLog.create({
        user: driverId,
        action: 'driver_responded_to_review',
        target: 'DriverRating',
        targetId: rating._id,
        details: 'Driver responded to review'
      });

      return { success: true, rating };
    } catch (error) {
      throw new Error(`Failed to respond to review: ${error.message}`);
    }
  }

  /**
   * Mark review as helpful
   */
  async markHelpful(ratingId, userId) {
    try {
      const rating = await DriverRating.findById(ratingId);
      if (!rating) {
        throw new Error('Rating not found');
      }

      // Check if user already voted
      const alreadyVoted = rating.helpfulVotes.some(
        vote => vote.user.toString() === userId.toString()
      );

      if (alreadyVoted) {
        return { success: false, message: 'Already marked as helpful' };
      }

      rating.helpfulVotes.push({
        user: userId,
        votedAt: new Date()
      });

      rating.helpfulCount = rating.helpfulVotes.length;

      await rating.save();

      return { success: true, rating };
    } catch (error) {
      throw new Error(`Failed to mark helpful: ${error.message}`);
    }
  }

  /**
   * Flag review for moderation
   */
  async flagReview(ratingId, reason, userId) {
    try {
      const rating = await DriverRating.findById(ratingId);
      if (!rating) {
        throw new Error('Rating not found');
      }

      rating.status = 'flagged';
      rating.moderationStatus = {
        flagReason: reason,
        reviewedBy: userId,
        reviewedAt: new Date()
      };

      await rating.save();

      await ActivityLog.create({
        user: userId,
        action: 'review_flagged',
        target: 'DriverRating',
        targetId: rating._id,
        details: `Review flagged for: ${reason}`,
        metadata: { reason }
      });

      return rating;
    } catch (error) {
      throw new Error(`Failed to flag review: ${error.message}`);
    }
  }

  /**
   * Moderate review (approve/reject)
   */
  async moderateReview(ratingId, moderatorId, approved, moderatorNotes = '') {
    try {
      const rating = await DriverRating.findById(ratingId);
      if (!rating) {
        throw new Error('Rating not found');
      }

      rating.status = approved ? 'approved' : 'rejected';
      rating.moderationStatus = {
        ...rating.moderationStatus,
        reviewedBy: moderatorId,
        reviewedAt: new Date(),
        moderatorNotes
      };

      await rating.save();

      await ActivityLog.create({
        user: moderatorId,
        action: approved ? 'review_approved' : 'review_rejected',
        target: 'DriverRating',
        targetId: rating._id,
        details: `Review ${approved ? 'approved' : 'rejected'} by moderator`,
        metadata: { moderatorNotes }
      });

      return rating;
    } catch (error) {
      throw new Error(`Failed to moderate review: ${error.message}`);
    }
  }

  /**
   * Detect spam or fake reviews
   */
  async detectSpam(ratingId) {
    try {
      const rating = await DriverRating.findById(ratingId).populate('passenger');
      if (!rating) {
        throw new Error('Rating not found');
      }

      let isSpam = false;
      const reasons = [];

      // Check 1: Very short review with extreme rating
      if (rating.review?.text) {
        const wordCount = rating.review.text.trim().split(/\s+/).length;
        if (wordCount < 5 && (rating.ratings.overall === 1 || rating.ratings.overall === 5)) {
          isSpam = true;
          reasons.push('Short review with extreme rating');
        }

        // Check 2: All caps
        if (rating.review.text === rating.review.text.toUpperCase() && rating.review.text.length > 20) {
          isSpam = true;
          reasons.push('All caps review');
        }

        // Check 3: Repeated characters
        if (/(.)\1{4,}/.test(rating.review.text)) {
          isSpam = true;
          reasons.push('Repeated characters');
        }

        // Check 4: Common spam keywords
        const spamKeywords = ['click here', 'visit website', 'buy now', 'discount code', 'promo'];
        if (spamKeywords.some(keyword => rating.review.text.toLowerCase().includes(keyword))) {
          isSpam = true;
          reasons.push('Spam keywords detected');
        }
      }

      // Check 5: Passenger has submitted many reviews in short time
      const recentReviews = await DriverRating.find({
        passenger: rating.passenger,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      });

      if (recentReviews.length > 10) {
        isSpam = true;
        reasons.push('Excessive reviews in short period');
      }

      if (isSpam) {
        rating.isSpam = true;
        rating.status = 'flagged';
        rating.moderationStatus = {
          ...rating.moderationStatus,
          flagReason: 'spam',
          moderatorNotes: reasons.join('; ')
        };
        await rating.save();

        await ActivityLog.create({
          user: rating.passenger,
          action: 'review_marked_spam',
          target: 'DriverRating',
          targetId: rating._id,
          details: 'Review automatically marked as spam',
          metadata: { reasons }
        });
      }

      return { isSpam, reasons };
    } catch (error) {
      throw new Error(`Failed to detect spam: ${error.message}`);
    }
  }

  /**
   * Get driver rating summary
   */
  async getDriverRatingSummary(driverId) {
    try {
      const ratings = await DriverRating.find({ 
        driver: driverId,
        status: 'approved'
      }).sort({ createdAt: -1 });

      if (ratings.length === 0) {
        return {
          totalRatings: 0,
          averageRating: 0,
          distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          categoryAverages: {},
          recentRatings: [],
          trends: {}
        };
      }

      // Calculate distribution
      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      ratings.forEach(r => {
        const stars = Math.round(r.ratings.overall);
        distribution[stars]++;
      });

      // Calculate category averages
      const categoryAverages = {
        overall: 0,
        communication: 0,
        professionalism: 0,
        safety: 0,
        vehicleCondition: 0,
        navigation: 0,
        punctuality: 0
      };

      let validCounts = {
        overall: 0,
        communication: 0,
        professionalism: 0,
        safety: 0,
        vehicleCondition: 0,
        navigation: 0,
        punctuality: 0
      };

      ratings.forEach(r => {
        Object.keys(categoryAverages).forEach(category => {
          if (r.ratings[category]) {
            categoryAverages[category] += r.ratings[category];
            validCounts[category]++;
          }
        });
      });

      Object.keys(categoryAverages).forEach(category => {
        if (validCounts[category] > 0) {
          categoryAverages[category] /= validCounts[category];
          categoryAverages[category] = Math.round(categoryAverages[category] * 10) / 10;
        }
      });

      // Recent ratings (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentRatings = ratings.filter(r => r.createdAt >= thirtyDaysAgo);

      // Calculate trends (compare last 30 days to previous 30 days)
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      
      const previousRatings = ratings.filter(
        r => r.createdAt >= sixtyDaysAgo && r.createdAt < thirtyDaysAgo
      );

      const recentAvg = recentRatings.length > 0
        ? recentRatings.reduce((sum, r) => sum + r.ratings.overall, 0) / recentRatings.length
        : 0;
      
      const previousAvg = previousRatings.length > 0
        ? previousRatings.reduce((sum, r) => sum + r.ratings.overall, 0) / previousRatings.length
        : 0;

      const trends = {
        direction: recentAvg > previousAvg ? 'improving' : recentAvg < previousAvg ? 'declining' : 'stable',
        change: recentAvg - previousAvg,
        recentAverage: Math.round(recentAvg * 10) / 10,
        previousAverage: Math.round(previousAvg * 10) / 10
      };

      return {
        totalRatings: ratings.length,
        averageRating: categoryAverages.overall,
        distribution,
        categoryAverages,
        recentRatings: recentRatings.slice(0, 10).map(r => ({
          ratingId: r.ratingId,
          overall: r.ratings.overall,
          review: r.review?.text,
          tags: r.review?.tags,
          createdAt: r.createdAt,
          hasResponse: !!r.response?.text
        })),
        trends,
        responseRate: (ratings.filter(r => r.response?.text).length / ratings.length) * 100,
        verifiedPercentage: (ratings.filter(r => r.verified).length / ratings.length) * 100
      };
    } catch (error) {
      throw new Error(`Failed to get rating summary: ${error.message}`);
    }
  }

  /**
   * Get reviews with filters
   */
  async getReviews(driverId, filters = {}) {
    try {
      const query = { driver: driverId };

      // Apply filters
      if (filters.status) {
        query.status = filters.status;
      } else {
        query.status = 'approved'; // Default to approved only
      }

      if (filters.minRating) {
        query['ratings.overall'] = { $gte: filters.minRating };
      }

      if (filters.maxRating) {
        query['ratings.overall'] = { 
          ...query['ratings.overall'],
          $lte: filters.maxRating 
        };
      }

      if (filters.hasReview) {
        query['review.text'] = { $exists: true, $ne: '' };
      }

      if (filters.hasResponse) {
        query['response.text'] = { $exists: true, $ne: '' };
      }

      if (filters.verified !== undefined) {
        query.verified = filters.verified;
      }

      if (filters.tags && filters.tags.length > 0) {
        query['review.tags'] = { $in: filters.tags };
      }

      // Date range
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) {
          query.createdAt.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.createdAt.$lte = new Date(filters.endDate);
        }
      }

      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        DriverRating.find(query)
          .populate('passenger', 'firstName lastName profilePhoto')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        DriverRating.countDocuments(query)
      ]);

      return {
        reviews,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get reviews: ${error.message}`);
    }
  }

  /**
   * Get pending reviews for moderation
   */
  async getPendingReviews(page = 1, limit = 50) {
    try {
      const skip = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        DriverRating.find({ status: { $in: ['pending', 'flagged'] } })
          .populate('driver', 'firstName lastName')
          .populate('passenger', 'firstName lastName')
          .populate('trip', 'pickupLocation dropoffLocation scheduledPickupTime')
          .sort({ createdAt: 1 }) // Oldest first
          .skip(skip)
          .limit(limit),
        DriverRating.countDocuments({ status: { $in: ['pending', 'flagged'] } })
      ]);

      return {
        reviews,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get pending reviews: ${error.message}`);
    }
  }

  /**
   * Get analytics for all drivers
   */
  async getFleetRatingAnalytics() {
    try {
      const ratings = await DriverRating.find({ status: 'approved' });

      const analytics = {
        totalRatings: ratings.length,
        averageRating: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        categoryAverages: {
          communication: 0,
          professionalism: 0,
          safety: 0,
          vehicleCondition: 0,
          navigation: 0,
          punctuality: 0
        },
        topDrivers: [],
        bottomDrivers: [],
        trends: {
          last7Days: 0,
          last30Days: 0,
          last90Days: 0
        }
      };

      if (ratings.length === 0) {
        return analytics;
      }

      // Calculate overall metrics
      let totalOverall = 0;
      let categorySums = {
        communication: 0,
        professionalism: 0,
        safety: 0,
        vehicleCondition: 0,
        navigation: 0,
        punctuality: 0
      };
      let categoryCounts = {
        communication: 0,
        professionalism: 0,
        safety: 0,
        vehicleCondition: 0,
        navigation: 0,
        punctuality: 0
      };

      ratings.forEach(r => {
        totalOverall += r.ratings.overall;
        const stars = Math.round(r.ratings.overall);
        analytics.distribution[stars]++;

        Object.keys(categorySums).forEach(category => {
          if (r.ratings[category]) {
            categorySums[category] += r.ratings[category];
            categoryCounts[category]++;
          }
        });
      });

      analytics.averageRating = Math.round((totalOverall / ratings.length) * 10) / 10;

      Object.keys(categorySums).forEach(category => {
        if (categoryCounts[category] > 0) {
          analytics.categoryAverages[category] = 
            Math.round((categorySums[category] / categoryCounts[category]) * 10) / 10;
        }
      });

      // Calculate trends
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      analytics.trends.last7Days = ratings.filter(r => r.createdAt >= sevenDaysAgo).length;
      analytics.trends.last30Days = ratings.filter(r => r.createdAt >= thirtyDaysAgo).length;
      analytics.trends.last90Days = ratings.filter(r => r.createdAt >= ninetyDaysAgo).length;

      // Get top and bottom drivers
      const driverRatings = new Map();

      ratings.forEach(r => {
        const driverId = r.driver.toString();
        if (!driverRatings.has(driverId)) {
          driverRatings.set(driverId, { total: 0, count: 0 });
        }
        const data = driverRatings.get(driverId);
        data.total += r.ratings.overall;
        data.count++;
      });

      const driverAverages = Array.from(driverRatings.entries())
        .map(([driverId, data]) => ({
          driverId,
          average: data.total / data.count,
          count: data.count
        }))
        .filter(d => d.count >= 5); // At least 5 ratings

      driverAverages.sort((a, b) => b.average - a.average);

      analytics.topDrivers = driverAverages.slice(0, 10);
      analytics.bottomDrivers = driverAverages.slice(-10).reverse();

      return analytics;
    } catch (error) {
      throw new Error(`Failed to get fleet rating analytics: ${error.message}`);
    }
  }

  /**
   * Bulk approve reviews
   */
  async bulkApproveReviews(ratingIds, moderatorId) {
    try {
      const result = await DriverRating.updateMany(
        { _id: { $in: ratingIds }, status: 'pending' },
        { 
          status: 'approved',
          'moderationStatus.reviewedBy': moderatorId,
          'moderationStatus.reviewedAt': new Date()
        }
      );

      await ActivityLog.create({
        user: moderatorId,
        action: 'reviews_bulk_approved',
        target: 'DriverRating',
        details: `Bulk approved ${result.modifiedCount} reviews`,
        metadata: { count: result.modifiedCount }
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to bulk approve reviews: ${error.message}`);
    }
  }

  /**
   * Auto-approve verified reviews with high ratings
   */
  async autoApproveHighRatings() {
    try {
      const result = await DriverRating.updateMany(
        {
          status: 'pending',
          verified: true,
          'ratings.overall': { $gte: 4 },
          isSpam: false,
          isFake: false
        },
        {
          status: 'approved',
          'moderationStatus.moderatorNotes': 'Auto-approved (verified, high rating)',
          'moderationStatus.reviewedAt': new Date()
        }
      );

      return result;
    } catch (error) {
      throw new Error(`Failed to auto-approve high ratings: ${error.message}`);
    }
  }
}

export default new DriverRatingService();
