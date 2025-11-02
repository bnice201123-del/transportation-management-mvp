import express from 'express';
import Trip from '../models/Trip.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard analytics
router.get('/dashboard', authenticateToken, authorizeRoles('admin', 'dispatcher'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Trip statistics
    const [
      totalTrips,
      todayTrips,
      completedTrips,
      pendingTrips,
      inProgressTrips,
      cancelledTrips
    ] = await Promise.all([
      Trip.countDocuments(),
      Trip.countDocuments({ 
        scheduledDate: { $gte: today, $lt: tomorrow }
      }),
      Trip.countDocuments({ status: 'completed' }),
      Trip.countDocuments({ status: 'pending' }),
      Trip.countDocuments({ status: 'in_progress' }),
      Trip.countDocuments({ status: 'cancelled' })
    ]);

    // Driver statistics
    const [
      totalDrivers,
      activeDrivers,
      availableDrivers
    ] = await Promise.all([
      User.countDocuments({ role: 'driver' }),
      User.countDocuments({ role: 'driver', isActive: true }),
      User.countDocuments({ role: 'driver', isActive: true, isAvailable: true })
    ]);

    // Recent activity
    const recentActivity = await ActivityLog.find()
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10);

    // Weekly trip stats (last 7 days)
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklyStats = await Trip.aggregate([
      {
        $match: {
          scheduledDate: { $gte: weekAgo, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$scheduledDate" }
          },
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      tripStats: {
        total: totalTrips,
        today: todayTrips,
        completed: completedTrips,
        pending: pendingTrips,
        inProgress: inProgressTrips,
        cancelled: cancelledTrips
      },
      driverStats: {
        total: totalDrivers,
        active: activeDrivers,
        available: availableDrivers
      },
      recentActivity,
      weeklyStats
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
});

// Get trip statistics by date range
router.get('/trips', authenticateToken, authorizeRoles('admin', 'dispatcher', 'scheduler'), async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    let dateFormat;
    switch (groupBy) {
      case 'month':
        dateFormat = "%Y-%m";
        break;
      case 'week':
        dateFormat = "%Y-%U";
        break;
      default:
        dateFormat = "%Y-%m-%d";
    }

    const stats = await Trip.aggregate([
      {
        $match: {
          scheduledDate: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: dateFormat, date: "$scheduledDate" } },
            status: "$status"
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          statuses: {
            $push: {
              status: "$_id.status",
              count: "$count"
            }
          },
          total: { $sum: "$count" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(stats);
  } catch (error) {
    console.error('Trip statistics error:', error);
    res.status(500).json({ message: 'Server error fetching trip statistics' });
  }
});

// Get driver performance metrics
router.get('/drivers', authenticateToken, authorizeRoles('admin', 'dispatcher'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const driverStats = await Trip.aggregate([
      {
        $match: {
          assignedDriver: { $exists: true },
          scheduledDate: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: "$assignedDriver",
          totalTrips: { $sum: 1 },
          completedTrips: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          },
          cancelledTrips: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] }
          },
          averageRating: { $avg: "$rating" },
          totalDistance: { $sum: "$estimatedDistance" }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'driver',
          pipeline: [
            { $project: { firstName: 1, lastName: 1, phone: 1, vehicleInfo: 1 } }
          ]
        }
      },
      {
        $unwind: "$driver"
      },
      {
        $project: {
          _id: 1,
          driver: 1,
          totalTrips: 1,
          completedTrips: 1,
          cancelledTrips: 1,
          completionRate: {
            $multiply: [
              { $divide: ["$completedTrips", "$totalTrips"] },
              100
            ]
          },
          averageRating: { $round: ["$averageRating", 2] },
          totalDistance: 1
        }
      },
      { $sort: { totalTrips: -1 } }
    ]);

    res.json(driverStats);
  } catch (error) {
    console.error('Driver analytics error:', error);
    res.status(500).json({ message: 'Server error fetching driver analytics' });
  }
});

// Get revenue analytics (if cost tracking is implemented)
router.get('/revenue', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const revenue = await Trip.aggregate([
      {
        $match: {
          status: 'completed',
          scheduledDate: { $gte: start, $lte: end },
          actualCost: { $exists: true, $gt: 0 }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$scheduledDate" }
          },
          totalRevenue: { $sum: "$actualCost" },
          tripCount: { $sum: 1 },
          averageRevenue: { $avg: "$actualCost" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totalRevenue = revenue.reduce((sum, day) => sum + day.totalRevenue, 0);
    const totalTrips = revenue.reduce((sum, day) => sum + day.tripCount, 0);

    res.json({
      dailyRevenue: revenue,
      summary: {
        totalRevenue,
        totalTrips,
        averageRevenuePerTrip: totalTrips > 0 ? totalRevenue / totalTrips : 0
      }
    });
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({ message: 'Server error fetching revenue analytics' });
  }
});

export default router;