# Transportation Management System - Backend API

A Node.js/Express REST API for managing transportation operations with MongoDB database, real-time updates via Socket.io, and integration with Google Maps and Firebase services.

## Features

- **Authentication**: JWT-based authentication with bcrypt password hashing
- **User Management**: Role-based access control (admin, scheduler, dispatcher, driver)
- **Trip Management**: CRUD operations for trips with status tracking
- **Real-time Updates**: Socket.io for live trip and driver status updates
- **Location Services**: Google Maps integration for routes and geocoding
- **Push Notifications**: Firebase Cloud Messaging for mobile notifications
- **Analytics**: Comprehensive reporting and analytics endpoints
- **Activity Logging**: Audit trail for all system activities

## Technology Stack

- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **MongoDB**: Database with Mongoose ODM
- **Socket.io**: Real-time communication
- **JWT**: Authentication tokens
- **bcryptjs**: Password hashing
- **Google Maps API**: Geocoding and routing
- **Firebase Admin**: Push notifications

## Prerequisites

- Node.js 18 or higher
- MongoDB 4.4 or higher
- Google Maps API key
- Firebase project with admin credentials

## Connecting to MongoDB Atlas

If you want to use MongoDB Atlas (managed cloud DB) instead of a local MongoDB instance, follow these steps:

1. Create a free cluster at https://cloud.mongodb.com/ and create a database user with a password.
2. In the Atlas UI go to "Connect" for your cluster and choose "Connect your application". Copy the provided connection string.
3. Replace the placeholders in the connection string with your database user and password and set the default database name to `transportation-mvp`.
  Example:

  MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/transportation-mvp?retryWrites=true&w=majority

4. Paste this URI into the backend `.env` file as the value for `MONGODB_URI`.

Notes:
- Make sure you add your IP address (or 0.0.0.0/0 for development) to the Atlas IP whitelist so your server can connect.
- Never commit the `.env` file with real credentials into version control.

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` file with your configuration

4. Start MongoDB service

5. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `PORT` | Server port | No (default: 3001) |
| `NODE_ENV` | Environment (development/production) | No |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key | Yes |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `FIREBASE_PRIVATE_KEY` | Firebase private key | Yes |
| `FIREBASE_CLIENT_EMAIL` | Firebase client email | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | No |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/fcm-token` - Update FCM token

### Users
- `GET /api/users` - Get all users (admin/dispatcher only)
- `GET /api/users/drivers/available` - Get available drivers
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `PATCH /api/users/:id/availability` - Update driver availability
- `PATCH /api/users/:id/location` - Update driver location

### Trips
- `GET /api/trips` - Get trips (filtered by user role)
- `GET /api/trips/:id` - Get trip by ID
- `POST /api/trips` - Create new trip (scheduler/admin)
- `PUT /api/trips/:id` - Update trip
- `DELETE /api/trips/:id` - Cancel trip (scheduler/admin)
- `POST /api/trips/:id/assign` - Assign driver to trip
- `PATCH /api/trips/:id/status` - Update trip status

### Analytics
- `GET /api/analytics/dashboard` - Dashboard analytics
- `GET /api/analytics/trips` - Trip statistics
- `GET /api/analytics/drivers` - Driver performance metrics
- `GET /api/analytics/revenue` - Revenue analytics (admin only)

## Database Models

### User
- Basic information (name, email, phone)
- Role-based permissions
- Driver-specific fields (license, vehicle info)
- Location tracking
- Availability status

### Trip
- Trip details (pickup/dropoff locations, times)
- Status tracking (pending → assigned → in_progress → completed)
- Driver assignment
- Route information
- Cost and rating data

### ActivityLog
- Audit trail for all system activities
- User actions and system events
- Metadata for debugging and analytics

## Real-time Features

### Socket.io Events

**Client to Server:**
- `join_room` - Join room based on user role
- `trip_status_update` - Update trip status
- `driver_location_update` - Update driver location

**Server to Client:**
- `trip_updated` - Trip status/details changed
- `driver_location_updated` - Driver location changed

## Authentication & Authorization

### JWT Token Structure
```json
{
  "userId": "user_id",
  "role": "user_role",
  "iat": "issued_at",
  "exp": "expires_at"
}
```

### Role Permissions
- **Admin**: Full system access
- **Scheduler**: Create/edit trips, assign drivers
- **Dispatcher**: Monitor trips, reassign drivers
- **Driver**: View assigned trips, update status/location

## Error Handling

The API uses standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

Error responses include:
```json
{
  "message": "Error description",
  "error": "Additional error details (development only)"
}
```

## Development

### Running Tests
```bash
npm test
```

### Code Linting
```bash
npm run lint
```

### Database Seeding
```bash
npm run seed
```

## Deployment

### Production Checklist
1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Configure MongoDB with authentication
4. Set up SSL/TLS certificates
5. Configure firewall rules
6. Set up monitoring and logging
7. Configure backup strategies

### Docker Support
```bash
docker build -t transportation-api .
docker run -p 3001:3001 transportation-api
```

## Monitoring & Logging

- All API requests are logged
- User activities are tracked in ActivityLog
- Error handling with stack traces in development
- Health check endpoint at `/api/health`

## Contributing

1. Follow Node.js best practices
2. Use ES6+ features consistently
3. Write comprehensive tests
4. Update API documentation
5. Follow semantic versioning

## License

MIT