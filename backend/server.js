import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database.js';
import passport from './config/passport.js';

// Import routes
import authRoutes from './routes/auth.js';
import tripRoutes from './routes/trips.js';
import userRoutes from './routes/users.js';
import analyticsRoutes from './routes/analytics.js';
import recurringTripsRoutes from './routes/recurringTrips.js';
import vehiclesRoutes from './routes/vehicles.js';
import vehicleManagementRoutes from './routes/vehicleManagement.js';
import locationRoutes from './routes/locations.js';
import activitiesRoutes from './routes/activities.js';
import ridersRoutes from './routes/riders.js';
import gpsTrackingRoutes from './routes/gpsTracking.js';
import notificationsRoutes from './routes/notifications.js';
import departureMonitoringRoutes from './routes/departureMonitoring.js';
import tripMonitoringRoutes from './routes/tripMonitoring.js';
import workScheduleRoutes from './routes/workSchedule.js';
import weeklyScheduleRoutes from './routes/weeklySchedule.js';
import adminRoutes from './routes/admin.js';
import holidaysRoutes from './routes/holidays.js';
import twoFactorRoutes from './routes/twoFactor.js';
import phoneVerificationRoutes from './routes/phoneVerification.js';
import oauthRoutes from './routes/oauth.js';
import auditRoutes from './routes/audit.js';
import gdprRoutes from './routes/gdpr.js';
import rateLimitRoutes from './routes/rateLimit.js';
import sessionsRoutes from './routes/sessions.js';
import encryptionRoutes from './routes/encryption.js';
import permissionsRoutes from './routes/permissions.js';
import securityRoutes from './routes/security.js';
import trustedDevicesRoutes from './routes/trustedDevices.js';
import loginAttemptsRoutes from './routes/loginAttempts.js';
import geoSecurityRoutes from './routes/geoSecurity.js';
import biometricRoutes from './routes/biometric.js';
import settingsHistoryRoutes from './routes/settingsHistory.js';
import settingsNotificationsRoutes from './routes/settingsNotifications.js';
import settingsVersionsRoutes from './routes/settingsVersions.js';
import schedulesRoutes from './routes/schedules.js';
import timeOffRoutes from './routes/timeOff.js';
import shiftSwapsRoutes from './routes/shiftSwaps.js';
import calendarRoutes from './routes/calendar.js';
import tripTemplatesRoutes from './routes/tripTemplates.js';
import trafficRoutes from './routes/traffic.js';
import mapsRoutes from './routes/maps.js';
import driverPreferencesRoutes from './routes/driverPreferences.js';
import fleetManagementRoutes from './routes/fleetManagement.js';
import driverManagementRoutes from './routes/driverManagement.js';
import { globalLimiter } from './middleware/rateLimiter.js';

// Import services
import departureMonitoringService from './services/departureMonitoringService.js';
import unassignedTripMonitoringService from './services/unassignedTripMonitoringService.js';
import driverProgressMonitoringService from './services/driverProgressMonitoringService.js';
import securityAlertingService from './services/securityAlertingService.js';
import cronJobService from './services/cronJobService.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174", 
      "http://localhost:5175",
      "http://localhost:5176",
      "http://localhost:5177",
      "http://localhost:5178",
      process.env.FRONTEND_URL
    ].filter(Boolean),
    methods: ["GET", "POST"]
  }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174", 
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
    "http://localhost:5178",
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Passport
app.use(passport.initialize());

// Apply global rate limiter to all routes
app.use(globalLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/recurring-trips', recurringTripsRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/vehicle-management', vehicleManagementRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/riders', ridersRoutes);
app.use('/api/gps', gpsTrackingRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/departure-monitoring', departureMonitoringRoutes);
app.use('/api/trip-monitoring', tripMonitoringRoutes);
app.use('/api/work-schedule', workScheduleRoutes);
app.use('/api/weekly-schedule', weeklyScheduleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/holidays', holidaysRoutes);
app.use('/api/2fa', twoFactorRoutes);
app.use('/api/phone-verification', phoneVerificationRoutes);
app.use('/api/auth', oauthRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/gdpr', gdprRoutes);
app.use('/api/rate-limit', rateLimitRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/encryption', encryptionRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/trusted-devices', trustedDevicesRoutes);
app.use('/api/login-attempts', loginAttemptsRoutes);
app.use('/api/geo-security', geoSecurityRoutes);
app.use('/api/biometric', biometricRoutes);
app.use('/api/settings', settingsHistoryRoutes);
app.use('/api/admin/settings/notifications', settingsNotificationsRoutes);
app.use('/api/admin/settings/versions', settingsVersionsRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/time-off', timeOffRoutes);
app.use('/api/shift-swaps', shiftSwapsRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/trip-templates', tripTemplatesRoutes);
app.use('/api/traffic', trafficRoutes);
app.use('/api/maps', mapsRoutes);
app.use('/api/driver-preferences', driverPreferencesRoutes);
app.use('/api/fleet-management', fleetManagementRoutes);
app.use('/api/driver-management', driverManagementRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Transportation API is running',
    timestamp: new Date().toISOString()
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room based on user role
  socket.on('join_room', (data) => {
    const { userRole, userId } = data;
    socket.join(`${userRole}_${userId}`);
    socket.join(userRole); // General role room
    console.log(`User ${userId} joined ${userRole} room`);
  });

  // Handle trip status updates
  socket.on('trip_status_update', (data) => {
    // Broadcast to dispatchers and schedulers
    io.to('dispatcher').emit('trip_updated', data);
    io.to('scheduler').emit('trip_updated', data);
  });

  // Handle driver location updates
  socket.on('driver_location_update', (data) => {
    // Broadcast to dispatchers
    io.to('dispatcher').emit('driver_location_updated', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 3001;

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  console.error('Shutting down server due to unhandled promise rejection');
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  console.error('Shutting down server due to uncaught exception');
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  
  // Start monitoring services
  try {
    departureMonitoringService.start();
    console.log('✓ Departure monitoring service started');
  } catch (error) {
    console.error('Failed to start departure monitoring service:', error);
  }
  
  try {
    unassignedTripMonitoringService.start();
    console.log('✓ Unassigned trip monitoring service started');
  } catch (error) {
    console.error('Failed to start unassigned trip monitoring service:', error);
  }
  
  try {
    driverProgressMonitoringService.start();
    console.log('✓ Driver progress monitoring service started');
  } catch (error) {
    console.error('Failed to start driver progress monitoring service:', error);
  }
  
  try {
    securityAlertingService.start();
    console.log('✓ Security alerting service started');
  } catch (error) {
    console.error('Failed to start security alerting service:', error);
  }
  
  // Start cron jobs
  try {
    cronJobService.init();
    console.log('✓ Cron job service started');
  } catch (error) {
    console.error('Failed to start cron job service:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  departureMonitoringService.stop();
  unassignedTripMonitoringService.stop();
  driverProgressMonitoringService.stop();
  securityAlertingService.stop();
  cronJobService.stopAll();
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  departureMonitoringService.stop();
  unassignedTripMonitoringService.stop();
  driverProgressMonitoringService.stop();
  cronJobService.stopAll();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export { io };