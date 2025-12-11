import DriverPerformance from '../models/DriverPerformance.js';
import DriverRating from '../models/DriverRating.js';
import Trip from '../models/Trip.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';

/**
 * DriverPerformanceService
 * Manages driver performance metrics, analytics, and insights
 */

class DriverPerformanceService {
  /**
   * Initialize performance tracking for a new driver
   */
  async initializePerformance(driverId) {
    try {
      // Check if performance already exists
      let performance = await DriverPerformance.findOne({ driver: driverId });
      
      if (performance) {
        return { success: false, message: 'Performance tracking already exists for this driver' };
      }

      performance = new DriverPerformance({
        driver: driverId,
        period: 'all_time',
        lastUpdated: new Date()
      });

      await performance.save();

      await ActivityLog.create({
        user: driverId,
        action: 'driver_performance_initialized',
        target: 'DriverPerformance',
        targetId: performance._id,
        details: 'Driver performance tracking initialized'
      });

      return { success: true, performance };
    } catch (error) {
      throw new Error(`Failed to initialize performance: ${error.message}`);
    }
  }

  /**
   * Update performance after trip completion
   */
  async updateAfterTrip(tripId) {
    try {
      const trip = await Trip.findById(tripId).populate('driver');
      if (!trip) {
        throw new Error('Trip not found');
      }

      let performance = await DriverPerformance.findOne({ 
        driver: trip.driver._id,
        period: 'all_time'
      });

      if (!performance) {
        const result = await this.initializePerformance(trip.driver._id);
        performance = result.performance;
      }

      // Update trip metrics
      performance.trips.total += 1;
      
      if (trip.status === 'completed') {
        performance.trips.completed += 1;
        
        // Calculate trip duration
        const duration = (new Date(trip.dropoffTime) - new Date(trip.pickupTime)) / (1000 * 60);
        performance.trips.averageDuration = 
          ((performance.trips.averageDuration * (performance.trips.completed - 1)) + duration) / performance.trips.completed;
        
        // Update longest/shortest trips
        if (!performance.trips.longestTrip || duration > performance.trips.longestTrip) {
          performance.trips.longestTrip = duration;
        }
        if (!performance.trips.shortestTrip || duration < performance.trips.shortestTrip) {
          performance.trips.shortestTrip = duration;
        }

        // Check if on-time
        const scheduledPickup = new Date(trip.scheduledPickupTime);
        const actualPickup = new Date(trip.pickupTime);
        const onTimeThreshold = 5 * 60 * 1000; // 5 minutes
        
        if (Math.abs(actualPickup - scheduledPickup) <= onTimeThreshold) {
          const previousOnTime = (performance.trips.onTimePercentage / 100) * (performance.trips.completed - 1);
          performance.trips.onTimePercentage = ((previousOnTime + 1) / performance.trips.completed) * 100;
        } else {
          const previousOnTime = (performance.trips.onTimePercentage / 100) * (performance.trips.completed - 1);
          performance.trips.onTimePercentage = (previousOnTime / performance.trips.completed) * 100;
        }
      } else if (trip.status === 'cancelled') {
        performance.trips.cancelled += 1;
        
        if (trip.cancellationReason?.includes('driver')) {
          performance.trips.cancelledByDriver += 1;
        } else if (trip.cancellationReason?.includes('passenger')) {
          performance.trips.cancelledByPassenger += 1;
        }
      } else if (trip.status === 'no_show') {
        performance.trips.noShow += 1;
      }

      // Update efficiency metrics
      performance.efficiency.acceptanceRate = 
        (performance.trips.completed / performance.trips.total) * 100;
      performance.efficiency.completionRate = 
        (performance.trips.completed / (performance.trips.total - performance.trips.cancelledByPassenger)) * 100;

      // Update financial metrics (if trip has earnings data)
      if (trip.fare) {
        performance.financial.totalEarnings += trip.fare.total || 0;
        performance.financial.tips += trip.fare.tip || 0;
        
        performance.financial.averageEarningsPerTrip = 
          performance.financial.totalEarnings / performance.trips.completed;
      }

      performance.lastUpdated = new Date();
      await performance.save();

      // Update daily trend
      await this.updateDailyTrend(trip.driver._id, trip);

      return performance;
    } catch (error) {
      throw new Error(`Failed to update performance after trip: ${error.message}`);
    }
  }

  /**
   * Update performance after rating received
   */
  async updateAfterRating(ratingId) {
    try {
      const rating = await DriverRating.findById(ratingId).populate('driver');
      if (!rating) {
        throw new Error('Rating not found');
      }

      let performance = await DriverPerformance.findOne({ 
        driver: rating.driver._id,
        period: 'all_time'
      });

      if (!performance) {
        const result = await this.initializePerformance(rating.driver._id);
        performance = result.performance;
      }

      // Update rating metrics
      const prevTotal = performance.ratings.totalRatings;
      const prevAvg = performance.ratings.overall;
      
      performance.ratings.totalRatings += 1;
      performance.ratings.overall = 
        ((prevAvg * prevTotal) + rating.ratings.overall) / performance.ratings.totalRatings;

      // Update category ratings
      if (rating.ratings.communication) {
        performance.ratings.communication = 
          ((performance.ratings.communication * prevTotal) + rating.ratings.communication) / performance.ratings.totalRatings;
      }
      if (rating.ratings.professionalism) {
        performance.ratings.professionalism = 
          ((performance.ratings.professionalism * prevTotal) + rating.ratings.professionalism) / performance.ratings.totalRatings;
      }
      if (rating.ratings.safety) {
        performance.ratings.safety = 
          ((performance.ratings.safety * prevTotal) + rating.ratings.safety) / performance.ratings.totalRatings;
      }
      if (rating.ratings.navigation) {
        performance.ratings.navigation = 
          ((performance.ratings.navigation * prevTotal) + rating.ratings.navigation) / performance.ratings.totalRatings;
      }
      if (rating.ratings.vehicleCondition) {
        performance.ratings.vehicleCondition = 
          ((performance.ratings.vehicleCondition * prevTotal) + rating.ratings.vehicleCondition) / performance.ratings.totalRatings;
      }

      // Update star distribution
      const stars = Math.round(rating.ratings.overall);
      if (stars === 5) performance.ratings.fiveStarCount += 1;
      else if (stars === 4) performance.ratings.fourStarCount += 1;
      else if (stars === 3) performance.ratings.threeStarCount += 1;
      else if (stars === 2) performance.ratings.twoStarCount += 1;
      else if (stars === 1) performance.ratings.oneStarCount += 1;

      // Update customer satisfaction
      if (rating.ratings.overall >= 4) {
        const prevPositive = (performance.customerSatisfaction.positiveFeedbackPercentage / 100) * prevTotal;
        performance.customerSatisfaction.positiveFeedbackPercentage = 
          ((prevPositive + 1) / performance.ratings.totalRatings) * 100;
      }

      if (rating.review?.text) {
        // Check for complaint keywords
        const complaintKeywords = ['complaint', 'issue', 'problem', 'unprofessional', 'rude', 'late'];
        const isComplaint = complaintKeywords.some(keyword => 
          rating.review.text.toLowerCase().includes(keyword)
        );
        
        if (isComplaint) {
          performance.customerSatisfaction.complaintCount += 1;
        }

        // Check for compliment keywords
        const complimentKeywords = ['excellent', 'great', 'amazing', 'professional', 'friendly', 'helpful'];
        const isCompliment = complimentKeywords.some(keyword => 
          rating.review.text.toLowerCase().includes(keyword)
        );
        
        if (isCompliment) {
          performance.customerSatisfaction.complimentCount += 1;
        }
      }

      performance.lastUpdated = new Date();
      await performance.save();

      // Check if performance alerts should be triggered
      await this.checkPerformanceAlerts(rating.driver._id);

      return performance;
    } catch (error) {
      throw new Error(`Failed to update performance after rating: ${error.message}`);
    }
  }

  /**
   * Update daily trend
   */
  async updateDailyTrend(driverId, trip) {
    try {
      const performance = await DriverPerformance.findOne({ 
        driver: driverId,
        period: 'all_time'
      });

      if (!performance) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find or create today's trend entry
      let todayTrend = performance.trends.daily.find(
        t => t.date.toDateString() === today.toDateString()
      );

      if (!todayTrend) {
        todayTrend = {
          date: today,
          trips: 0,
          earnings: 0,
          rating: 0,
          onTimeRate: 0
        };
        performance.trends.daily.push(todayTrend);
      }

      // Update today's metrics
      todayTrend.trips += 1;
      if (trip.fare) {
        todayTrend.earnings += trip.fare.total || 0;
      }
      todayTrend.rating = performance.ratings.overall;
      todayTrend.onTimeRate = performance.trips.onTimePercentage;

      // Keep only last 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      performance.trends.daily = performance.trends.daily.filter(
        t => t.date >= ninetyDaysAgo
      );

      await performance.save();

      // Update weekly and monthly trends
      await this.aggregateWeeklyTrends(driverId);
      await this.aggregateMonthlyTrends(driverId);
    } catch (error) {
      throw new Error(`Failed to update daily trend: ${error.message}`);
    }
  }

  /**
   * Aggregate weekly trends from daily data
   */
  async aggregateWeeklyTrends(driverId) {
    try {
      const performance = await DriverPerformance.findOne({ 
        driver: driverId,
        period: 'all_time'
      });

      if (!performance || performance.trends.daily.length === 0) return;

      // Group daily data into weeks
      const weeklyData = new Map();

      performance.trends.daily.forEach(day => {
        const weekStart = new Date(day.date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
        weekStart.setHours(0, 0, 0, 0);
        const weekKey = weekStart.toISOString();

        if (!weeklyData.has(weekKey)) {
          weeklyData.set(weekKey, {
            weekStart,
            trips: 0,
            earnings: 0,
            ratings: [],
            onTimeRates: []
          });
        }

        const week = weeklyData.get(weekKey);
        week.trips += day.trips;
        week.earnings += day.earnings;
        if (day.rating) week.ratings.push(day.rating);
        if (day.onTimeRate) week.onTimeRates.push(day.onTimeRate);
      });

      // Convert to array and calculate averages
      performance.trends.weekly = Array.from(weeklyData.values()).map(week => ({
        weekStart: week.weekStart,
        trips: week.trips,
        earnings: week.earnings,
        rating: week.ratings.length > 0 
          ? week.ratings.reduce((a, b) => a + b, 0) / week.ratings.length 
          : 0,
        onTimeRate: week.onTimeRates.length > 0 
          ? week.onTimeRates.reduce((a, b) => a + b, 0) / week.onTimeRates.length 
          : 0
      }));

      // Keep only last 12 weeks
      performance.trends.weekly = performance.trends.weekly.slice(-12);

      await performance.save();
    } catch (error) {
      throw new Error(`Failed to aggregate weekly trends: ${error.message}`);
    }
  }

  /**
   * Aggregate monthly trends from daily data
   */
  async aggregateMonthlyTrends(driverId) {
    try {
      const performance = await DriverPerformance.findOne({ 
        driver: driverId,
        period: 'all_time'
      });

      if (!performance || performance.trends.daily.length === 0) return;

      // Group daily data into months
      const monthlyData = new Map();

      performance.trends.daily.forEach(day => {
        const monthStart = new Date(day.date.getFullYear(), day.date.getMonth(), 1);
        const monthKey = monthStart.toISOString();

        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, {
            monthStart,
            trips: 0,
            earnings: 0,
            ratings: [],
            onTimeRates: []
          });
        }

        const month = monthlyData.get(monthKey);
        month.trips += day.trips;
        month.earnings += day.earnings;
        if (day.rating) month.ratings.push(day.rating);
        if (day.onTimeRate) month.onTimeRates.push(day.onTimeRate);
      });

      // Convert to array and calculate averages
      performance.trends.monthly = Array.from(monthlyData.values()).map(month => ({
        monthStart: month.monthStart,
        trips: month.trips,
        earnings: month.earnings,
        rating: month.ratings.length > 0 
          ? month.ratings.reduce((a, b) => a + b, 0) / month.ratings.length 
          : 0,
        onTimeRate: month.onTimeRates.length > 0 
          ? month.onTimeRates.reduce((a, b) => a + b, 0) / month.onTimeRates.length 
          : 0
      }));

      // Keep only last 12 months
      performance.trends.monthly = performance.trends.monthly.slice(-12);

      await performance.save();
    } catch (error) {
      throw new Error(`Failed to aggregate monthly trends: ${error.message}`);
    }
  }

  /**
   * Check and create performance alerts
   */
  async checkPerformanceAlerts(driverId) {
    try {
      const performance = await DriverPerformance.findOne({ 
        driver: driverId,
        period: 'all_time'
      });

      if (!performance) return;

      const alerts = [];

      // Low rating alert
      if (performance.ratings.overall < 3.5 && performance.ratings.totalRatings >= 10) {
        alerts.push({
          type: 'low_rating',
          severity: performance.ratings.overall < 3.0 ? 'critical' : 'warning',
          message: `Your average rating (${performance.ratings.overall.toFixed(2)}) is below the recommended threshold. Please review customer feedback and focus on improvement areas.`,
          createdAt: new Date(),
          acknowledged: false,
          resolved: false
        });
      }

      // High cancellation alert
      const cancellationRate = (performance.trips.cancelledByDriver / performance.trips.total) * 100;
      if (cancellationRate > 10 && performance.trips.total >= 20) {
        alerts.push({
          type: 'high_cancellation',
          severity: cancellationRate > 20 ? 'critical' : 'warning',
          message: `Your cancellation rate (${cancellationRate.toFixed(1)}%) is higher than recommended. Frequent cancellations may affect your standing.`,
          createdAt: new Date(),
          acknowledged: false,
          resolved: false
        });
      }

      // Safety concern alert
      if (performance.safety.safeDrivingScore < 70 && performance.trips.completed >= 50) {
        alerts.push({
          type: 'safety_concern',
          severity: performance.safety.safeDrivingScore < 50 ? 'critical' : 'warning',
          message: `Your safe driving score (${performance.safety.safeDrivingScore}) needs improvement. Please review safety guidelines and reduce harsh braking/speeding incidents.`,
          createdAt: new Date(),
          acknowledged: false,
          resolved: false
        });
      }

      // Low efficiency alert
      if (performance.efficiency.completionRate < 80 && performance.trips.total >= 30) {
        alerts.push({
          type: 'efficiency_drop',
          severity: performance.efficiency.completionRate < 70 ? 'warning' : 'info',
          message: `Your trip completion rate (${performance.efficiency.completionRate.toFixed(1)}%) could be improved. Focus on accepting trips you can reliably complete.`,
          createdAt: new Date(),
          acknowledged: false,
          resolved: false
        });
      }

      // Add new alerts (avoid duplicates)
      alerts.forEach(newAlert => {
        const existingAlert = performance.alerts.find(
          a => a.type === newAlert.type && !a.resolved
        );
        
        if (!existingAlert) {
          performance.alerts.push(newAlert);
        }
      });

      if (alerts.length > 0) {
        await performance.save();

        // Log alert creation
        await ActivityLog.create({
          user: driverId,
          action: 'driver_performance_alert',
          target: 'DriverPerformance',
          targetId: performance._id,
          details: `${alerts.length} performance alert(s) created`,
          metadata: { alertTypes: alerts.map(a => a.type) }
        });
      }

      return alerts;
    } catch (error) {
      throw new Error(`Failed to check performance alerts: ${error.message}`);
    }
  }

  /**
   * Add achievement
   */
  async addAchievement(driverId, achievementType) {
    try {
      const performance = await DriverPerformance.findOne({ 
        driver: driverId,
        period: 'all_time'
      });

      if (!performance) {
        throw new Error('Performance not found');
      }

      // Check if achievement already exists
      const existing = performance.achievements.find(a => a.type === achievementType);
      if (existing) {
        return { success: false, message: 'Achievement already unlocked' };
      }

      const achievementDefinitions = {
        '100_trips': {
          type: '100_trips',
          description: 'Completed 100 trips',
          icon: '🎯',
          displayOnProfile: true
        },
        '500_trips': {
          type: '500_trips',
          description: 'Completed 500 trips',
          icon: '🏆',
          displayOnProfile: true
        },
        '1000_trips': {
          type: '1000_trips',
          description: 'Completed 1,000 trips',
          icon: '👑',
          displayOnProfile: true
        },
        '5_star_month': {
          type: '5_star_month',
          description: 'Maintained 5-star rating for a full month',
          icon: '⭐',
          displayOnProfile: true
        },
        'safety_champion': {
          type: 'safety_champion',
          description: 'Perfect safety record for 6 months',
          icon: '🛡️',
          displayOnProfile: true
        },
        'top_rated': {
          type: 'top_rated',
          description: 'Achieved top 10% rating in fleet',
          icon: '🌟',
          displayOnProfile: true
        }
      };

      const achievement = achievementDefinitions[achievementType];
      if (!achievement) {
        throw new Error('Unknown achievement type');
      }

      performance.achievements.push({
        ...achievement,
        unlockedAt: new Date()
      });

      await performance.save();

      await ActivityLog.create({
        user: driverId,
        action: 'driver_achievement_unlocked',
        target: 'DriverPerformance',
        targetId: performance._id,
        details: `Achievement unlocked: ${achievement.description}`,
        metadata: { achievementType }
      });

      return { success: true, achievement };
    } catch (error) {
      throw new Error(`Failed to add achievement: ${error.message}`);
    }
  }

  /**
   * Set goal for driver
   */
  async setGoal(driverId, goalData) {
    try {
      const performance = await DriverPerformance.findOne({ 
        driver: driverId,
        period: 'all_time'
      });

      if (!performance) {
        throw new Error('Performance not found');
      }

      performance.goals.push({
        metric: goalData.metric,
        target: goalData.target,
        deadline: goalData.deadline,
        reward: goalData.reward,
        achieved: false
      });

      await performance.save();

      return performance;
    } catch (error) {
      throw new Error(`Failed to set goal: ${error.message}`);
    }
  }

  /**
   * Check goal progress and update achievements
   */
  async checkGoalProgress(driverId) {
    try {
      const performance = await DriverPerformance.findOne({ 
        driver: driverId,
        period: 'all_time'
      });

      if (!performance) return;

      performance.goals.forEach(goal => {
        if (goal.achieved) return;

        let currentValue = 0;

        switch (goal.metric) {
          case 'trips':
            currentValue = performance.trips.completed;
            break;
          case 'rating':
            currentValue = performance.ratings.overall;
            break;
          case 'earnings':
            currentValue = performance.financial.totalEarnings;
            break;
          case 'safety_score':
            currentValue = performance.safety.safeDrivingScore;
            break;
          case 'on_time_rate':
            currentValue = performance.trips.onTimePercentage;
            break;
        }

        if (currentValue >= goal.target) {
          goal.achieved = true;
          goal.achievedAt = new Date();
        }
      });

      await performance.save();

      // Check for achievement unlocks
      if (performance.trips.completed === 100) {
        await this.addAchievement(driverId, '100_trips');
      }
      if (performance.trips.completed === 500) {
        await this.addAchievement(driverId, '500_trips');
      }
      if (performance.trips.completed === 1000) {
        await this.addAchievement(driverId, '1000_trips');
      }
    } catch (error) {
      throw new Error(`Failed to check goal progress: ${error.message}`);
    }
  }

  /**
   * Calculate fleet ranking
   */
  async calculateFleetRanking(driverId) {
    try {
      const performance = await DriverPerformance.findOne({ 
        driver: driverId,
        period: 'all_time'
      });

      if (!performance) return;

      // Get all driver performances
      const allPerformances = await DriverPerformance.find({ period: 'all_time' })
        .sort({ 'ratings.overall': -1 });

      const totalDrivers = allPerformances.length;
      const driverRank = allPerformances.findIndex(p => p.driver.toString() === driverId.toString()) + 1;
      const percentile = Math.round((1 - (driverRank / totalDrivers)) * 100);

      // Determine category
      let category = 'bronze';
      if (percentile >= 90) category = 'platinum';
      else if (percentile >= 75) category = 'gold';
      else if (percentile >= 50) category = 'silver';

      performance.ranking = {
        overallRank: driverRank,
        totalDrivers,
        percentile,
        category
      };

      await performance.save();

      return performance.ranking;
    } catch (error) {
      throw new Error(`Failed to calculate fleet ranking: ${error.message}`);
    }
  }

  /**
   * Get driver dashboard data
   */
  async getDashboardData(driverId) {
    try {
      const performance = await DriverPerformance.findOne({ 
        driver: driverId,
        period: 'all_time'
      }).populate('driver', 'firstName lastName email profilePhoto');

      if (!performance) {
        throw new Error('Performance data not found');
      }

      // Calculate trends
      const last7Days = performance.trends.daily.slice(-7);
      const last30Days = performance.trends.daily.slice(-30);

      const trends = {
        trips: {
          last7Days: last7Days.reduce((sum, d) => sum + d.trips, 0),
          last30Days: last30Days.reduce((sum, d) => sum + d.trips, 0)
        },
        earnings: {
          last7Days: last7Days.reduce((sum, d) => sum + d.earnings, 0),
          last30Days: last30Days.reduce((sum, d) => sum + d.earnings, 0)
        }
      };

      return {
        driver: performance.driver,
        summary: {
          totalTrips: performance.trips.completed,
          rating: performance.ratings.overall,
          earnings: performance.financial.totalEarnings,
          safeDrivingScore: performance.safety.safeDrivingScore
        },
        trends,
        recentAchievements: performance.achievements.slice(-5),
        activeGoals: performance.goals.filter(g => !g.achieved),
        alerts: performance.alerts.filter(a => !a.acknowledged),
        ranking: performance.ranking
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard data: ${error.message}`);
    }
  }

  /**
   * Get performance comparison with fleet average
   */
  async compareWithFleet(driverId) {
    try {
      const performance = await DriverPerformance.findOne({ 
        driver: driverId,
        period: 'all_time'
      });

      if (!performance) {
        throw new Error('Performance data not found');
      }

      // Calculate fleet averages
      const allPerformances = await DriverPerformance.find({ period: 'all_time' });
      
      const fleetAvg = {
        rating: 0,
        completionRate: 0,
        onTimePercentage: 0,
        safeDrivingScore: 0,
        earningsPerTrip: 0
      };

      allPerformances.forEach(p => {
        fleetAvg.rating += p.ratings.overall;
        fleetAvg.completionRate += p.efficiency.completionRate;
        fleetAvg.onTimePercentage += p.trips.onTimePercentage;
        fleetAvg.safeDrivingScore += p.safety.safeDrivingScore;
        fleetAvg.earningsPerTrip += p.financial.averageEarningsPerTrip;
      });

      const count = allPerformances.length;
      Object.keys(fleetAvg).forEach(key => {
        fleetAvg[key] /= count;
      });

      return {
        driver: {
          rating: performance.ratings.overall,
          completionRate: performance.efficiency.completionRate,
          onTimePercentage: performance.trips.onTimePercentage,
          safeDrivingScore: performance.safety.safeDrivingScore,
          earningsPerTrip: performance.financial.averageEarningsPerTrip
        },
        fleetAverage: fleetAvg,
        comparison: {
          rating: performance.ratings.overall - fleetAvg.rating,
          completionRate: performance.efficiency.completionRate - fleetAvg.completionRate,
          onTimePercentage: performance.trips.onTimePercentage - fleetAvg.onTimePercentage,
          safeDrivingScore: performance.safety.safeDrivingScore - fleetAvg.safeDrivingScore,
          earningsPerTrip: performance.financial.averageEarningsPerTrip - fleetAvg.earningsPerTrip
        }
      };
    } catch (error) {
      throw new Error(`Failed to compare with fleet: ${error.message}`);
    }
  }
}

export default new DriverPerformanceService();
