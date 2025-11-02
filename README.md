# Transportation Management MVP

A comprehensive transportation management system built with React, Node.js, Express, and MongoDB. Features a responsive admin dashboard with role-based authentication and real-time data visualization.

## Project Structure

```
transportation-mvp/
├── frontend/          # React + Vite + Chakra UI web application
├── backend/           # Node.js + Express API server
└── README.md          # Project documentation
```

## 🚀 Features

### ✅ **Responsive Design**
- Mobile-first approach with Chakra UI
- Breakpoints: 320px (mobile) → 768px (tablet) → 1024px (desktop) → 1536px+ (large screens)
- Adaptive navigation and layouts

### 🛡️ **Authentication & Authorization**
- Role-based access control (Admin, Scheduler, Dispatcher, Driver)
- Protected routes with JWT tokens
- Secure login/logout functionality

### 📊 **Admin Dashboard**
- **Overview**: System metrics, user analytics, health monitoring
- **Analytics**: KPIs, trend analysis, performance monitoring, data export
- **Reports**: Generation, scheduling, templates, history tracking
- Real-time data updates and interactive charts

### 🎨 **Modern UI/UX**
- Chakra UI component library
- Dark/light theme support
- Smooth animations with Framer Motion
- Comprehensive error boundaries

### 🔧 **Error Handling**
- React Error Boundaries for crash prevention
- Graceful fallbacks and user-friendly error messages
- Safe data operations with null checks
- API failure recovery

## Technology Stack

### Frontend
- React 18
- Vite (build tool)
- Chakra UI (component library)
- React Router (routing)
- Axios (HTTP client)

### Backend
- Node.js
- Express.js
- MongoDB (database)
- JWT (authentication)
- Socket.io (real-time updates)

### External Services
- Google Maps API
- Firebase Cloud Messaging (FCM)

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or cloud instance)
- Google Maps API key
- Firebase project (for push notifications)

### Installation

1. **Clone and navigate to the project:**
```bash
cd transportation-mvp
```

2. **Setup backend:**
```bash
cd backend
npm install
cp .env.example .env
```
Edit `.env` file with your configuration:
- MongoDB connection string
- JWT secret key
- Google Maps API key
- Firebase credentials

```bash
npm run dev
```

3. **Setup frontend (in a new terminal):**
```bash
cd frontend
npm install
cp .env.example .env
```
Edit `.env` file with your configuration:
- Backend API URL
- Google Maps API key
- Firebase configuration

```bash
npm run dev
```

4. **Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Health Check: http://localhost:3001/api/health

### Default Login Credentials
After running the application, you can register new users with different roles:
- **Admin**: Full system access
- **Scheduler**: Create and manage trips
- **Dispatcher**: Monitor and assign trips
- **Driver**: View and complete assigned trips

## Environment Variables

See individual README files in `frontend/` and `backend/` directories for detailed configuration.

## 📊 **Admin Dashboard Sections**

### Overview
- System health monitoring  
- User role distribution
- Recent activity feed
- Quick action buttons
- Real-time metrics

### Analytics
- KPI cards with progress indicators
- Multi-tab data visualization  
- Time-range filtering
- Export functionality
- Performance monitoring

### Reports
- Report generation engine
- Scheduling system
- Template management
- History tracking
- Bulk operations

## 🔄 **API Endpoints**

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Health & Monitoring
- `GET /api/health` - Server health check
- `GET /api/analytics/dashboard` - Dashboard analytics

### User Management
- `GET /users` - Get all users
- `POST /users` - Create new user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

## 🎯 **Key Features Implementation**

### Error Boundaries
```jsx
// Wraps all admin routes for crash prevention
<ErrorBoundary>
  <AdminComponent />
</ErrorBoundary>
```

### Responsive Design
```jsx
// Chakra UI responsive props
<Grid templateColumns={{ base: "1fr", md: "240px 1fr", lg: "280px 1fr" }}>
  <GridItem>Sidebar</GridItem>
  <GridItem>Content</GridItem>
</Grid>
```

### Safe Data Operations
```jsx
// Null checks and fallbacks throughout
const users = Array.isArray(usersRes?.data) ? usersRes.data : [];
const totalUsers = users.length || 0;
```

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 **License**

This project is licensed under the MIT License.

## 🆘 **Support**

For support, open an issue on GitHub.

---

**Built with ❤️ using React, Node.js, and MongoDB**