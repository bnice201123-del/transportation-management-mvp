import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import Vehicle from '../models/Vehicle.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/vehicles/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and documents are allowed.'));
    }
  }
});

// ============================================
// INSPECTION ROUTES
// ============================================

// Add inspection record
router.post('/:vehicleId/inspections', authenticateToken, authorizeRoles('admin', 'dispatcher', 'driver'), async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const inspectionData = {
      ...req.body,
      inspectedBy: req.user._id
    };

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    vehicle.inspectionHistory.push(inspectionData);
    await vehicle.save();

    res.json({ 
      success: true, 
      message: 'Inspection record added successfully',
      inspection: vehicle.inspectionHistory[vehicle.inspectionHistory.length - 1]
    });
  } catch (error) {
    console.error('Add inspection error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get inspection history
router.get('/:vehicleId/inspections', authenticateToken, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const vehicle = await Vehicle.findById(vehicleId)
      .populate('inspectionHistory.inspectedBy', 'firstName lastName')
      .select('inspectionHistory make model licensePlate');

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    res.json({ 
      success: true, 
      inspections: vehicle.inspectionHistory,
      vehicle: { make: vehicle.make, model: vehicle.model, licensePlate: vehicle.licensePlate }
    });
  } catch (error) {
    console.error('Get inspections error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ============================================
// EXPENSE TRACKING ROUTES
// ============================================

// Add expense
router.post('/:vehicleId/expenses', authenticateToken, authorizeRoles('admin', 'dispatcher'), async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const expenseData = {
      ...req.body,
      approvedBy: req.user._id
    };

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    vehicle.expenses.push(expenseData);
    await vehicle.save();

    res.json({ 
      success: true, 
      message: 'Expense added successfully',
      expense: vehicle.expenses[vehicle.expenses.length - 1]
    });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get expenses with filtering
router.get('/:vehicleId/expenses', authenticateToken, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { category, startDate, endDate } = req.query;

    const vehicle = await Vehicle.findById(vehicleId)
      .populate('expenses.approvedBy', 'firstName lastName')
      .select('expenses make model licensePlate');

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    let expenses = vehicle.expenses;

    // Filter by category
    if (category && category !== 'all') {
      expenses = expenses.filter(exp => exp.category === category);
    }

    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      expenses = expenses.filter(exp => exp.date >= start && exp.date <= end);
    }

    // Calculate totals
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const expensesByCategory = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});

    res.json({ 
      success: true, 
      expenses,
      summary: {
        total: totalExpenses,
        byCategory: expensesByCategory,
        count: expenses.length
      },
      vehicle: { make: vehicle.make, model: vehicle.model, licensePlate: vehicle.licensePlate }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ============================================
// FUEL LOG ROUTES
// ============================================

// Add fuel log entry
router.post('/:vehicleId/fuel-logs', authenticateToken, authorizeRoles('admin', 'dispatcher', 'driver'), async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const fuelData = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Calculate MPG if possible
    if (fuelData.fullTank && vehicle.fuelLogs.length > 0) {
      const lastFullTank = [...vehicle.fuelLogs].reverse().find(log => log.fullTank);
      if (lastFullTank) {
        const milesDriven = fuelData.mileage - lastFullTank.mileage;
        const gallonsUsed = fuelData.gallons;
        if (milesDriven > 0 && gallonsUsed > 0) {
          fuelData.mpg = Math.round((milesDriven / gallonsUsed) * 100) / 100;
        }
      }
    }

    vehicle.fuelLogs.push(fuelData);
    
    // Update vehicle mileage if provided
    if (fuelData.mileage > vehicle.mileage) {
      vehicle.mileage = fuelData.mileage;
    }

    await vehicle.save();

    res.json({ 
      success: true, 
      message: 'Fuel log added successfully',
      fuelLog: vehicle.fuelLogs[vehicle.fuelLogs.length - 1],
      averageMPG: vehicle.calculateAverageMPG()
    });
  } catch (error) {
    console.error('Add fuel log error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get fuel logs with analytics
router.get('/:vehicleId/fuel-logs', authenticateToken, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const fuelLogs = vehicle.fuelLogs.sort((a, b) => b.date - a.date);
    const averageMPG = vehicle.calculateAverageMPG();
    
    // Calculate fuel statistics
    const totalGallons = fuelLogs.reduce((sum, log) => sum + log.gallons, 0);
    const totalCost = fuelLogs.reduce((sum, log) => sum + (log.totalCost || 0), 0);
    const avgCostPerGallon = totalGallons > 0 ? totalCost / totalGallons : 0;

    res.json({ 
      success: true, 
      fuelLogs,
      analytics: {
        averageMPG,
        totalGallons: Math.round(totalGallons * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        averageCostPerGallon: Math.round(avgCostPerGallon * 100) / 100,
        logsCount: fuelLogs.length
      },
      vehicle: { make: vehicle.make, model: vehicle.model, licensePlate: vehicle.licensePlate }
    });
  } catch (error) {
    console.error('Get fuel logs error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ============================================
// TIRE MAINTENANCE ROUTES
// ============================================

// Add tire maintenance record
router.post('/:vehicleId/tires', authenticateToken, authorizeRoles('admin', 'dispatcher'), async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const tireData = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    vehicle.tireHistory.push(tireData);

    // Update next tire rotation if it's a rotation
    if (tireData.type === 'rotation' && tireData.mileage) {
      vehicle.nextTireRotation = {
        mileage: tireData.mileage + 6000, // Default 6000 miles
        date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // or 90 days
      };
    }

    await vehicle.save();

    res.json({ 
      success: true, 
      message: 'Tire maintenance record added',
      tireRecord: vehicle.tireHistory[vehicle.tireHistory.length - 1]
    });
  } catch (error) {
    console.error('Add tire maintenance error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get tire history
router.get('/:vehicleId/tires', authenticateToken, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const vehicle = await Vehicle.findById(vehicleId)
      .select('tireHistory nextTireRotation make model licensePlate mileage');

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    res.json({ 
      success: true, 
      tireHistory: vehicle.tireHistory,
      nextTireRotation: vehicle.nextTireRotation,
      currentMileage: vehicle.mileage,
      vehicle: { make: vehicle.make, model: vehicle.model, licensePlate: vehicle.licensePlate }
    });
  } catch (error) {
    console.error('Get tire history error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ============================================
// INSURANCE ROUTES
// ============================================

// Update insurance information
router.put('/:vehicleId/insurance', authenticateToken, authorizeRoles('admin'), upload.array('documents', 5), async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const insuranceData = JSON.parse(req.body.data || '{}');

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Add uploaded documents
    if (req.files && req.files.length > 0) {
      insuranceData.documents = req.files.map(file => file.path);
    }

    vehicle.insurance = { ...vehicle.insurance, ...insuranceData };
    await vehicle.save();

    res.json({ 
      success: true, 
      message: 'Insurance information updated',
      insurance: vehicle.insurance
    });
  } catch (error) {
    console.error('Update insurance error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Add insurance claim
router.post('/:vehicleId/insurance/claims', authenticateToken, authorizeRoles('admin', 'dispatcher'), async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const claimData = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    if (!vehicle.insurance.claims) {
      vehicle.insurance.claims = [];
    }

    vehicle.insurance.claims.push(claimData);
    await vehicle.save();

    res.json({ 
      success: true, 
      message: 'Insurance claim added',
      claim: vehicle.insurance.claims[vehicle.insurance.claims.length - 1]
    });
  } catch (error) {
    console.error('Add insurance claim error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ============================================
// REGISTRATION ROUTES
// ============================================

// Update registration information
router.put('/:vehicleId/registration', authenticateToken, authorizeRoles('admin'), upload.array('documents', 5), async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const registrationData = JSON.parse(req.body.data || '{}');

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Add uploaded documents
    if (req.files && req.files.length > 0) {
      registrationData.documents = req.files.map(file => file.path);
    }

    vehicle.registration = { ...vehicle.registration, ...registrationData };
    await vehicle.save();

    res.json({ 
      success: true, 
      message: 'Registration information updated',
      registration: vehicle.registration
    });
  } catch (error) {
    console.error('Update registration error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ============================================
// DEPRECIATION ROUTES
// ============================================

// Update depreciation settings
router.put('/:vehicleId/depreciation', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const depreciationData = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    vehicle.depreciation = { ...vehicle.depreciation, ...depreciationData };
    const currentValue = vehicle.calculateDepreciation();
    await vehicle.save();

    res.json({ 
      success: true, 
      message: 'Depreciation settings updated',
      depreciation: vehicle.depreciation,
      currentValue
    });
  } catch (error) {
    console.error('Update depreciation error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Calculate current depreciation
router.get('/:vehicleId/depreciation/calculate', authenticateToken, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const currentValue = vehicle.calculateDepreciation();
    await vehicle.save();

    res.json({ 
      success: true, 
      depreciation: vehicle.depreciation,
      currentValue,
      purchasePrice: vehicle.depreciation.purchasePrice,
      totalDepreciation: vehicle.depreciation.purchasePrice - currentValue
    });
  } catch (error) {
    console.error('Calculate depreciation error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ============================================
// INCIDENT REPORTING ROUTES
// ============================================

// Add incident report
router.post('/:vehicleId/incidents', authenticateToken, authorizeRoles('admin', 'dispatcher', 'driver'), upload.array('photos', 10), async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const incidentData = JSON.parse(req.body.data || '{}');

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Add uploaded photos
    if (req.files && req.files.length > 0) {
      incidentData.photos = req.files.map(file => file.path);
    }

    // Set driver involved if not specified
    if (!incidentData.driverInvolved && req.user.role === 'driver') {
      incidentData.driverInvolved = req.user._id;
    }

    vehicle.incidents.push(incidentData);
    await vehicle.save();

    res.json({ 
      success: true, 
      message: 'Incident report added successfully',
      incident: vehicle.incidents[vehicle.incidents.length - 1]
    });
  } catch (error) {
    console.error('Add incident error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get incidents
router.get('/:vehicleId/incidents', authenticateToken, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { resolved } = req.query;

    const vehicle = await Vehicle.findById(vehicleId)
      .populate('incidents.driverInvolved', 'firstName lastName')
      .select('incidents make model licensePlate');

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    let incidents = vehicle.incidents;

    // Filter by resolved status
    if (resolved !== undefined) {
      const isResolved = resolved === 'true';
      incidents = incidents.filter(inc => inc.resolved === isResolved);
    }

    res.json({ 
      success: true, 
      incidents,
      vehicle: { make: vehicle.make, model: vehicle.model, licensePlate: vehicle.licensePlate }
    });
  } catch (error) {
    console.error('Get incidents error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Update incident status
router.patch('/:vehicleId/incidents/:incidentId', authenticateToken, authorizeRoles('admin', 'dispatcher'), async (req, res) => {
  try {
    const { vehicleId, incidentId } = req.params;
    const updateData = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const incident = vehicle.incidents.id(incidentId);
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    Object.assign(incident, updateData);
    await vehicle.save();

    res.json({ 
      success: true, 
      message: 'Incident updated successfully',
      incident
    });
  } catch (error) {
    console.error('Update incident error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ============================================
// ALERTS & NOTIFICATIONS
// ============================================

// Get vehicle alerts
router.get('/:vehicleId/alerts', authenticateToken, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const alerts = vehicle.getAlerts();

    res.json({ 
      success: true, 
      alerts,
      vehicle: { 
        make: vehicle.make, 
        model: vehicle.model, 
        licensePlate: vehicle.licensePlate 
      }
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get all vehicles with alerts
router.get('/alerts/all', authenticateToken, authorizeRoles('admin', 'dispatcher'), async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ isActive: true });
    
    const vehiclesWithAlerts = vehicles.map(vehicle => ({
      vehicleId: vehicle._id,
      make: vehicle.make,
      model: vehicle.model,
      licensePlate: vehicle.licensePlate,
      alerts: vehicle.getAlerts()
    })).filter(v => v.alerts.length > 0);

    res.json({ 
      success: true, 
      vehicles: vehiclesWithAlerts,
      totalAlertsCount: vehiclesWithAlerts.reduce((sum, v) => sum + v.alerts.length, 0)
    });
  } catch (error) {
    console.error('Get all alerts error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ============================================
// FLEET UTILIZATION REPORTS
// ============================================

// Get fleet utilization summary
router.get('/reports/utilization', authenticateToken, authorizeRoles('admin', 'dispatcher'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const vehicles = await Vehicle.find({ isActive: true })
      .select('make model licensePlate utilization expenses mileage status currentDriver');

    const summary = {
      totalVehicles: vehicles.length,
      activeVehicles: vehicles.filter(v => v.status === 'active').length,
      idleVehicles: vehicles.filter(v => v.status === 'idle').length,
      maintenanceVehicles: vehicles.filter(v => v.status === 'maintenance').length,
      totalMileage: vehicles.reduce((sum, v) => sum + (v.mileage || 0), 0),
      totalExpenses: 0,
      averageUtilization: 0
    };

    // Calculate total expenses
    vehicles.forEach(vehicle => {
      if (vehicle.expenses && vehicle.expenses.length > 0) {
        let vehicleExpenses = vehicle.expenses;
        
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          vehicleExpenses = vehicleExpenses.filter(exp => 
            exp.date >= start && exp.date <= end
          );
        }
        
        summary.totalExpenses += vehicleExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      }
    });

    // Calculate average utilization
    const utilizationRates = vehicles
      .filter(v => v.utilization && v.utilization.utilizationRate)
      .map(v => v.utilization.utilizationRate);
    
    if (utilizationRates.length > 0) {
      summary.averageUtilization = utilizationRates.reduce((sum, rate) => sum + rate, 0) / utilizationRates.length;
    }

    summary.costPerMile = summary.totalMileage > 0 ? summary.totalExpenses / summary.totalMileage : 0;

    res.json({ 
      success: true, 
      summary: {
        ...summary,
        totalExpenses: Math.round(summary.totalExpenses * 100) / 100,
        costPerMile: Math.round(summary.costPerMile * 100) / 100,
        averageUtilization: Math.round(summary.averageUtilization * 100) / 100
      },
      vehicles: vehicles.map(v => ({
        _id: v._id,
        make: v.make,
        model: v.model,
        licensePlate: v.licensePlate,
        status: v.status,
        mileage: v.mileage,
        utilization: v.utilization,
        assignedDriver: v.currentDriver ? 'Assigned' : 'Unassigned'
      }))
    });
  } catch (error) {
    console.error('Get utilization report error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

export default router;
