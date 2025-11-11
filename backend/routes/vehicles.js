import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Get all vehicles (mock data for now)
router.get('/', authenticateToken, authorizeRoles('admin', 'scheduler', 'dispatcher'), async (req, res) => {
  try {
    const { status = 'active', page = 1, limit = 50 } = req.query;

    // Mock vehicle data - in a real app this would come from a Vehicle model
    const mockVehicles = [
      {
        _id: '64a1b2c3d4e5f6789012345a',
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        licensePlate: 'ABC-1234',
        color: 'Blue',
        capacity: 4,
        vehicleType: 'sedan',
        isWheelchairAccessible: false,
        status: 'active',
        currentLocation: { lat: 40.7580, lng: -73.9855, address: '123 Main St, New York, NY' },
        driver: { name: 'John Smith', phone: '555-0123', email: 'john.smith@company.com' },
        currentTrip: { tripId: 'TRP001', destination: 'Brooklyn, NY' },
        lastUpdated: new Date()
      },
      {
        _id: '64a1b2c3d4e5f6789012345b',
        make: 'Honda',
        model: 'Accord',
        year: 2021,
        licensePlate: 'DEF-5678',
        color: 'Silver',
        capacity: 4,
        vehicleType: 'sedan',
        isWheelchairAccessible: false,
        status: 'idle',
        currentLocation: { lat: 40.7505, lng: -73.9934, address: '456 Oak Ave, New York, NY' },
        driver: { name: 'Sarah Johnson', phone: '555-0456', email: 'sarah.j@company.com' },
        currentTrip: null,
        lastUpdated: new Date()
      },
      {
        _id: '64a1b2c3d4e5f6789012345c',
        make: 'Ford',
        model: 'Transit',
        year: 2023,
        licensePlate: 'GHI-9012',
        color: 'White',
        capacity: 12,
        vehicleType: 'van',
        isWheelchairAccessible: true,
        status: 'active',
        currentLocation: { lat: 40.7614, lng: -73.9776, address: '789 Pine St, New York, NY' },
        driver: { name: 'Mike Davis', phone: '555-0789', email: 'mike.d@company.com' },
        currentTrip: { tripId: 'TRP002', destination: 'Queens, NY' },
        lastUpdated: new Date()
      },
      {
        _id: '64a1b2c3d4e5f6789012345d',
        make: 'Chevrolet',
        model: 'Suburban',
        year: 2022,
        licensePlate: 'JKL-3456',
        color: 'Black',
        capacity: 8,
        vehicleType: 'suv',
        isWheelchairAccessible: false,
        status: 'offline',
        currentLocation: { lat: 40.7690, lng: -73.9781, address: '321 Elm Dr, New York, NY' },
        driver: null,
        currentTrip: null,
        lastUpdated: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      },
      {
        _id: '64a1b2c3d4e5f6789012345e',
        make: 'Nissan',
        model: 'NV200',
        year: 2021,
        licensePlate: 'MNO-7890',
        color: 'Yellow',
        capacity: 5,
        vehicleType: 'van',
        isWheelchairAccessible: true,
        status: 'idle',
        currentLocation: { lat: 40.7829, lng: -73.9654, address: '654 Cedar St, New York, NY' },
        driver: { name: 'Lisa Wilson', phone: '555-0321', email: 'lisa.w@company.com' },
        currentTrip: null,
        lastUpdated: new Date()
      },
      {
        _id: '64a1b2c3d4e5f6789012345f',
        make: 'BMW',
        model: 'X5',
        year: 2023,
        licensePlate: 'PQR-2468',
        color: 'Gray',
        capacity: 5,
        vehicleType: 'suv',
        isWheelchairAccessible: false,
        status: 'active',
        currentLocation: { lat: 40.7484, lng: -73.9857, address: '987 Maple Ave, New York, NY' },
        driver: { name: 'Carlos Rodriguez', phone: '555-0654', email: 'carlos.r@company.com' },
        currentTrip: { tripId: 'TRP003', destination: 'Manhattan, NY' },
        lastUpdated: new Date()
      },
      {
        _id: '64a1b2c3d4e5f6789012345g',
        make: 'Mercedes',
        model: 'Sprinter',
        year: 2022,
        licensePlate: 'STU-1357',
        color: 'White',
        capacity: 15,
        vehicleType: 'van',
        isWheelchairAccessible: true,
        status: 'maintenance',
        currentLocation: { lat: 40.7831, lng: -73.9712, address: 'Maintenance Depot, Bronx, NY' },
        driver: null,
        currentTrip: null,
        lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        _id: '64a1b2c3d4e5f6789012345h',
        make: 'Tesla',
        model: 'Model S',
        year: 2023,
        licensePlate: 'VWX-9753',
        color: 'Red',
        capacity: 4,
        vehicleType: 'sedan',
        isWheelchairAccessible: false,
        status: 'idle',
        currentLocation: { lat: 40.7411, lng: -74.0040, address: '159 Broadway, New York, NY' },
        driver: { name: 'Emma Thompson', phone: '555-0987', email: 'emma.t@company.com' },
        currentTrip: null,
        lastUpdated: new Date()
      }
    ];

    // Filter by status if specified
    let filteredVehicles = mockVehicles;
    if (status !== 'all') {
      filteredVehicles = mockVehicles.filter(vehicle => vehicle.status === status);
    }

    // Pagination
    const skip = (page - 1) * limit;
    const paginatedVehicles = filteredVehicles.slice(skip, skip + parseInt(limit));
    const total = filteredVehicles.length;

    console.log('Vehicles API response:', {
      vehicles: paginatedVehicles,
      vehicleCount: paginatedVehicles.length,
      total: total
    });
    
    res.json({
      success: true,
      data: {
        vehicles: paginatedVehicles
      },
      vehicles: paginatedVehicles, // Also include direct access
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({ message: 'Server error fetching vehicles' });
  }
});

// Get vehicle by ID
router.get('/:id', authenticateToken, authorizeRoles('admin', 'scheduler', 'dispatcher', 'driver'), async (req, res) => {
  try {
    const { id } = req.params;

    // Mock vehicle lookup - in a real app this would query the Vehicle model
    const mockVehicle = {
      _id: id,
      make: 'Toyota',
      model: 'Camry',
      year: 2022,
      licensePlate: 'ABC-1234',
      color: 'Blue',
      capacity: 4,
      vehicleType: 'sedan',
      isWheelchairAccessible: false,
      status: 'active',
      driver: null,
      features: ['Air Conditioning', 'GPS Navigation', 'Bluetooth'],
      fuelType: 'gasoline',
      mileage: 25000,
      lastMaintenance: new Date('2023-10-15'),
      nextMaintenanceDue: new Date('2024-01-15')
    };

    res.json(mockVehicle);
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({ message: 'Server error fetching vehicle' });
  }
});

export default router;