import mongoose from 'mongoose';
import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const seedVehicles = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/transportation-mvp');

    console.log('Connected to MongoDB');

    // Get an admin user to set as createdBy
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found. Please create an admin user first.');
      return;
    }

    // Clear existing vehicles
    await Vehicle.deleteMany({});
    console.log('Cleared existing vehicles');

    // Sample vehicle data
    const vehicles = [
      {
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        licensePlate: 'ABC-1234',
        vin: '1N4AL3AP0FC123456',
        color: 'Blue',
        capacity: 4,
        vehicleType: 'sedan',
        fuelType: 'gasoline',
        isWheelchairAccessible: false,
        status: 'active',
        mileage: 25000,
        fuelLevel: 85,
        lastServiceDate: new Date('2024-10-15'),
        nextServiceDate: new Date('2025-01-15'),
        features: ['Air Conditioning', 'GPS Navigation', 'Bluetooth'],
        notes: 'Good condition, regular maintenance',
        createdBy: adminUser._id
      },
      {
        make: 'Honda',
        model: 'Accord',
        year: 2021,
        licensePlate: 'DEF-5678',
        vin: '1HGCR2F50FA123456',
        color: 'Silver',
        capacity: 4,
        vehicleType: 'sedan',
        fuelType: 'gasoline',
        isWheelchairAccessible: false,
        status: 'idle',
        mileage: 32000,
        fuelLevel: 92,
        lastServiceDate: new Date('2024-09-20'),
        nextServiceDate: new Date('2024-12-20'),
        features: ['Air Conditioning', 'Backup Camera'],
        notes: 'Minor wear on tires',
        createdBy: adminUser._id
      },
      {
        make: 'Ford',
        model: 'Transit',
        year: 2023,
        licensePlate: 'GHI-9012',
        vin: '1FTYR1ZM0FKA12345',
        color: 'White',
        capacity: 12,
        vehicleType: 'van',
        fuelType: 'diesel',
        isWheelchairAccessible: true,
        status: 'active',
        mileage: 12450,
        fuelLevel: 78,
        lastServiceDate: new Date('2024-10-01'),
        nextServiceDate: new Date('2025-01-01'),
        features: ['Wheelchair Lift', 'Air Conditioning', 'GPS'],
        notes: 'Excellent condition, wheelchair accessible',
        createdBy: adminUser._id
      },
      {
        make: 'Chevrolet',
        model: 'Suburban',
        year: 2022,
        licensePlate: 'JKL-3456',
        vin: '1GNSKHKC0FR123456',
        color: 'Black',
        capacity: 8,
        vehicleType: 'suv',
        fuelType: 'gasoline',
        isWheelchairAccessible: false,
        status: 'maintenance',
        mileage: 45600,
        fuelLevel: 45,
        lastServiceDate: new Date('2024-08-10'),
        nextServiceDate: new Date('2024-11-10'),
        features: ['Third Row Seating', 'Roof Rack'],
        notes: 'Needs oil change and tire rotation',
        createdBy: adminUser._id
      },
      {
        make: 'Nissan',
        model: 'NV200',
        year: 2021,
        licensePlate: 'MNO-7890',
        vin: '1N6AD0CU0FN123456',
        color: 'Yellow',
        capacity: 5,
        vehicleType: 'van',
        fuelType: 'gasoline',
        isWheelchairAccessible: true,
        status: 'idle',
        mileage: 28900,
        fuelLevel: 88,
        lastServiceDate: new Date('2024-09-05'),
        nextServiceDate: new Date('2024-12-05'),
        features: ['Wheelchair Accessible', 'Air Conditioning'],
        notes: 'Good condition',
        createdBy: adminUser._id
      },
      {
        make: 'BMW',
        model: 'X5',
        year: 2023,
        licensePlate: 'PQR-2468',
        vin: '5UXCR6C00L9A12345',
        color: 'Gray',
        capacity: 5,
        vehicleType: 'suv',
        fuelType: 'gasoline',
        isWheelchairAccessible: false,
        status: 'active',
        mileage: 18750,
        fuelLevel: 76,
        lastServiceDate: new Date('2024-10-20'),
        nextServiceDate: new Date('2025-01-20'),
        features: ['Premium Sound System', 'Leather Seats', 'Navigation'],
        notes: 'Luxury vehicle, well maintained',
        createdBy: adminUser._id
      },
      {
        make: 'Mercedes',
        model: 'Sprinter',
        year: 2022,
        licensePlate: 'STU-1357',
        vin: 'WDAPF4CC0F1234567',
        color: 'White',
        capacity: 15,
        vehicleType: 'van',
        fuelType: 'diesel',
        isWheelchairAccessible: true,
        status: 'maintenance',
        mileage: 35200,
        fuelLevel: 62,
        lastServiceDate: new Date('2024-07-15'),
        nextServiceDate: new Date('2024-10-15'),
        features: ['Wheelchair Lift', 'High Roof', 'Air Conditioning'],
        notes: 'In maintenance - brake inspection needed',
        createdBy: adminUser._id
      },
      {
        make: 'Tesla',
        model: 'Model S',
        year: 2023,
        licensePlate: 'VWX-9753',
        vin: '5YJSA1E20F1234567',
        color: 'Red',
        capacity: 4,
        vehicleType: 'sedan',
        fuelType: 'electric',
        isWheelchairAccessible: false,
        status: 'idle',
        mileage: 15600,
        fuelLevel: 95, // Battery level
        lastServiceDate: new Date('2024-09-30'),
        nextServiceDate: new Date('2025-03-30'),
        features: ['Autopilot', 'Supercharger Access', 'Premium Audio'],
        notes: 'Electric vehicle, low maintenance',
        createdBy: adminUser._id
      }
    ];

    // Insert vehicles
    const createdVehicles = await Vehicle.insertMany(vehicles);
    console.log(`Successfully seeded ${createdVehicles.length} vehicles`);

    // Add some maintenance history to a few vehicles
    const vehicleWithHistory = await Vehicle.findOne({ licensePlate: 'ABC-1234' });
    if (vehicleWithHistory) {
      vehicleWithHistory.maintenanceHistory.push({
        date: new Date('2024-10-15'),
        type: 'service',
        description: 'Regular maintenance service',
        mileage: 25000,
        cost: 150,
        performedBy: 'Quick Lube Auto Service',
        notes: 'Oil change, tire rotation, brake inspection'
      });
      await vehicleWithHistory.save();
    }

    console.log('Vehicle seeding completed successfully');

  } catch (error) {
    console.error('Error seeding vehicles:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the seed function
seedVehicles();