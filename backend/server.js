import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import tripRoutes from './routes/trips.js';
import userRoutes from './routes/users.js';
import analyticsRoutes from './routes/analytics.js';
import recurringTripsRoutes from './routes/recurringTrips.js';
import vehiclesRoutes from './routes/vehicles.js';
import locationRoutes from './routes/locations.js';
import activitiesRoutes from './routes/activities.js';
import ridersRoutes from './routes/riders.js';

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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/recurring-trips', recurringTripsRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/riders', ridersRoutes);

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
});

export { io };