import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import InsurancePolicy from '../models/InsurancePolicy.js';
import FuelCard from '../models/FuelCard.js';
import MaintenanceRecord from '../models/MaintenanceRecord.js';
import PartsInventory from '../models/PartsInventory.js';
import VehicleTelematics from '../models/VehicleTelematics.js';
import FleetIntegrationService from '../services/fleetIntegrationService.js';
import ActivityLog from '../models/ActivityLog.js';

const router = express.Router();

// ============================================
// Insurance Management
// ============================================

// Get all insurance policies
router.get('/insurance', authenticateToken, async (req, res) => {
  try {
    const { status, vehicle, expiringWithin } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (vehicle) query.vehicle = vehicle;
    
    let policies = await InsurancePolicy.find(query)
      .populate('vehicle', 'make model licensePlate')
      .populate('coveredDrivers.driver', 'firstName lastName')
      .sort({ expirationDate: 1 });

    if (expiringWithin) {
      const days = parseInt(expiringWithin);
      policies = policies.filter(p => p.isExpiringSoon(days));
    }

    res.json({
      success: true,
      policies
    });
  } catch (error) {
    console.error('Error fetching insurance policies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch insurance policies',
      details: error.message
    });
  }
});

// Create insurance policy
router.post('/insurance', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'dispatcher'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to create insurance policies'
      });
    }

    const policy = new InsurancePolicy({
      ...req.body,
      createdBy: req.user.id
    });

    await policy.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: 'insurance_policy_created',
      resourceType: 'InsurancePolicy',
      resourceId: policy._id,
      details: { vehicle: policy.vehicle, policyNumber: policy.provider.policyNumber }
    });

    res.status(201).json({
      success: true,
      policy
    });
  } catch (error) {
    console.error('Error creating insurance policy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create insurance policy',
      details: error.message
    });
  }
});

// Sync insurance policy with provider
router.post('/insurance/:id/sync', authenticateToken, async (req, res) => {
  try {
    const result = await FleetIntegrationService.syncInsurancePolicy(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// File insurance claim
router.post('/insurance/:id/claims', authenticateToken, async (req, res) => {
  try {
    const result = await FleetIntegrationService.fileInsuranceClaim(
      req.params.id,
      req.body
    );
    
    if (result.success) {
      await ActivityLog.create({
        userId: req.user.id,
        action: 'insurance_claim_filed',
        resourceType: 'InsurancePolicy',
        resourceId: req.params.id,
        details: { claimNumber: result.claimNumber }
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// Fuel Card Management
// ============================================

// Get all fuel cards
router.get('/fuel-cards', authenticateToken, async (req, res) => {
  try {
    const { status, vehicle, driver } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (vehicle) query.vehicle = vehicle;
    if (driver) query.driver = driver;

    const fuelCards = await FuelCard.find(query)
      .populate('vehicle', 'make model licensePlate')
      .populate('driver', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      fuelCards: fuelCards.map(card => ({
        ...card.toObject(),
        cardNumber: card.maskedCardNumber // Return masked number
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fuel cards',
      details: error.message
    });
  }
});

// Create fuel card
router.post('/fuel-cards', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'dispatcher'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to create fuel cards'
      });
    }

    const fuelCard = new FuelCard({
      ...req.body,
      createdBy: req.user.id
    });

    await fuelCard.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: 'fuel_card_created',
      resourceType: 'FuelCard',
      resourceId: fuelCard._id,
      details: { cardNumber: fuelCard.cardNumberLast4, vehicle: fuelCard.vehicle }
    });

    res.status(201).json({
      success: true,
      fuelCard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create fuel card',
      details: error.message
    });
  }
});

// Sync fuel card transactions
router.post('/fuel-cards/:id/sync', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const result = await FleetIntegrationService.syncFuelCardTransactions(
      req.params.id,
      startDate,
      endDate
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get fuel card daily limit status
router.get('/fuel-cards/:id/daily-limit', authenticateToken, async (req, res) => {
  try {
    const fuelCard = await FuelCard.findById(req.params.id);
    
    if (!fuelCard) {
      return res.status(404).json({
        success: false,
        error: 'Fuel card not found'
      });
    }

    const limitStatus = fuelCard.checkDailyLimit();

    res.json({
      success: true,
      limitStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// Maintenance Management
// ============================================

// Get all maintenance records
router.get('/maintenance', authenticateToken, async (req, res) => {
  try {
    const { vehicle, status, type, startDate, endDate } = req.query;
    
    const query = {};
    if (vehicle) query.vehicle = vehicle;
    if (status) query.status = status;
    if (type) query.maintenanceType = type;
    if (startDate || endDate) {
      query.scheduledDate = {};
      if (startDate) query.scheduledDate.$gte = new Date(startDate);
      if (endDate) query.scheduledDate.$lte = new Date(endDate);
    }

    const records = await MaintenanceRecord.find(query)
      .populate('vehicle', 'make model licensePlate mileage')
      .populate('reportedBy', 'firstName lastName')
      .sort({ scheduledDate: -1 });

    res.json({
      success: true,
      records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch maintenance records',
      details: error.message
    });
  }
});

// Create maintenance record
router.post('/maintenance', authenticateToken, async (req, res) => {
  try {
    const record = new MaintenanceRecord({
      ...req.body,
      createdBy: req.user.id,
      reportedBy: req.user.id
    });

    await record.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: 'maintenance_record_created',
      resourceType: 'MaintenanceRecord',
      resourceId: record._id,
      details: { vehicle: record.vehicle, type: record.maintenanceType }
    });

    res.status(201).json({
      success: true,
      record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create maintenance record',
      details: error.message
    });
  }
});

// Complete maintenance record
router.post('/maintenance/:id/complete', authenticateToken, async (req, res) => {
  try {
    const record = await MaintenanceRecord.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Maintenance record not found'
      });
    }

    await record.complete(req.body);

    await ActivityLog.create({
      userId: req.user.id,
      action: 'maintenance_completed',
      resourceType: 'MaintenanceRecord',
      resourceId: record._id,
      details: { vehicle: record.vehicle, totalCost: record.costs.total }
    });

    res.json({
      success: true,
      record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to complete maintenance record',
      details: error.message
    });
  }
});

// Sync maintenance with external system
router.post('/maintenance/:id/sync', authenticateToken, async (req, res) => {
  try {
    const result = await FleetIntegrationService.syncMaintenanceRecord(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// Parts Inventory Management
// ============================================

// Get all parts
router.get('/parts', authenticateToken, async (req, res) => {
  try {
    const { category, status, lowStock, search } = req.query;
    
    const query = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$text = { $search: search };
    }

    let parts = await PartsInventory.find(query).sort({ partNumber: 1 });

    if (lowStock === 'true') {
      parts = parts.filter(p => p.needsReorder);
    }

    res.json({
      success: true,
      parts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch parts inventory',
      details: error.message
    });
  }
});

// Create part
router.post('/parts', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'dispatcher'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to create parts'
      });
    }

    const part = new PartsInventory({
      ...req.body,
      createdBy: req.user.id
    });

    await part.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: 'part_created',
      resourceType: 'PartsInventory',
      resourceId: part._id,
      details: { partNumber: part.partNumber, partName: part.partName }
    });

    res.status(201).json({
      success: true,
      part
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create part',
      details: error.message
    });
  }
});

// Issue stock
router.post('/parts/:id/issue', authenticateToken, async (req, res) => {
  try {
    const { quantity, reference, referenceType, vehicleId, notes } = req.body;
    
    const part = await PartsInventory.findById(req.params.id);
    if (!part) {
      return res.status(404).json({
        success: false,
        error: 'Part not found'
      });
    }

    await part.issueStock(quantity, {
      reference,
      referenceType,
      vehicle: vehicleId,
      user: req.user.id,
      notes
    });

    res.json({
      success: true,
      part,
      message: 'Stock issued successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Receive stock
router.post('/parts/:id/receive', authenticateToken, async (req, res) => {
  try {
    const { quantity, poNumber, cost } = req.body;
    
    const part = await PartsInventory.findById(req.params.id);
    if (!part) {
      return res.status(404).json({
        success: false,
        error: 'Part not found'
      });
    }

    await part.receiveStock(quantity, {
      reference: poNumber,
      referenceType: 'purchase_order',
      cost,
      user: req.user.id
    });

    res.json({
      success: true,
      part,
      message: 'Stock received successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create purchase order
router.post('/parts/:id/purchase-order', authenticateToken, async (req, res) => {
  try {
    const { quantity, supplierId } = req.body;
    
    const result = await FleetIntegrationService.createPurchaseOrder(
      req.params.id,
      quantity,
      supplierId
    );

    if (result.success) {
      await ActivityLog.create({
        userId: req.user.id,
        action: 'purchase_order_created',
        resourceType: 'PartsInventory',
        resourceId: req.params.id,
        details: { poNumber: result.poNumber, quantity }
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// Vehicle Telematics
// ============================================

// Get vehicle telematics
router.get('/telematics/:vehicleId', authenticateToken, async (req, res) => {
  try {
    const telematics = await VehicleTelematics.findOne({ vehicle: req.params.vehicleId })
      .populate('vehicle', 'make model licensePlate')
      .populate('driverBehavior.currentDriver', 'firstName lastName');

    if (!telematics) {
      return res.status(404).json({
        success: false,
        error: 'Telematics data not found for this vehicle'
      });
    }

    res.json({
      success: true,
      telematics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch telematics data',
      details: error.message
    });
  }
});

// Create/initialize telematics for vehicle
router.post('/telematics', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'dispatcher'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to create telematics records'
      });
    }

    const telematics = new VehicleTelematics({
      ...req.body,
      createdBy: req.user.id
    });

    await telematics.save();

    await ActivityLog.create({
      userId: req.user.id,
      action: 'telematics_initialized',
      resourceType: 'VehicleTelematics',
      resourceId: telematics._id,
      details: { vehicle: telematics.vehicle, deviceId: telematics.device.deviceId }
    });

    res.status(201).json({
      success: true,
      telematics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create telematics record',
      details: error.message
    });
  }
});

// Sync telematics data
router.post('/telematics/:vehicleId/sync', authenticateToken, async (req, res) => {
  try {
    const result = await FleetIntegrationService.syncTelematicsData(req.params.vehicleId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get active fault codes
router.get('/telematics/:vehicleId/faults', authenticateToken, async (req, res) => {
  try {
    const telematics = await VehicleTelematics.findOne({ vehicle: req.params.vehicleId });
    
    if (!telematics) {
      return res.status(404).json({
        success: false,
        error: 'Telematics data not found'
      });
    }

    const activeFaults = telematics.faultCodes.filter(f => f.isActive);

    res.json({
      success: true,
      faults: activeFaults,
      count: activeFaults.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clear fault code
router.post('/telematics/:vehicleId/faults/:code/clear', authenticateToken, async (req, res) => {
  try {
    const telematics = await VehicleTelematics.findOne({ vehicle: req.params.vehicleId });
    
    if (!telematics) {
      return res.status(404).json({
        success: false,
        error: 'Telematics data not found'
      });
    }

    await telematics.clearFaultCode(req.params.code);

    res.json({
      success: true,
      message: 'Fault code cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// Bulk Operations
// ============================================

// Sync all integrations
router.post('/sync-all', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only administrators can perform bulk sync'
      });
    }

    const result = await FleetIntegrationService.syncAllIntegrations();

    await ActivityLog.create({
      userId: req.user.id,
      action: 'bulk_integration_sync',
      resourceType: 'System',
      details: result.results
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to sync integrations',
      details: error.message
    });
  }
});

export default router;
