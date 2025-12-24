import express from 'express';
import Rider from '../models/Rider.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Get all riders
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Prevent caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    // Get ALL riders first to see what we have
    const allRiders = await Rider.find().sort({ createdAt: -1 });
    console.log(`\n📊 Total riders in database: ${allRiders.length}`);
    
    // Detailed breakdown
    allRiders.forEach((r, i) => {
      console.log(`  ${i+1}. ${r.firstName} ${r.lastName} | Email: ${r.email || 'NONE'} | Status: ${r.status}`);
    });
    
    // Now apply filter - only return riders with REAL email addresses (not example.com and not empty)
    // AND status must be active
    const riders = allRiders.filter(r => {
      // Must have active status
      if (r.status !== 'active') return false;
      
      // Must have an email
      if (!r.email) return false;
      
      // Must not be a test email domain
      if (r.email.includes('@example.com')) return false;
      if (r.email.includes('@placeholder.com')) return false;
      
      return true;
    });
    
    console.log(`✅ GET /api/riders: Returning ${riders.length} legitimate riders (filtered from ${allRiders.length} total)`);
    riders.forEach((rider, index) => {
      const name = rider.firstName + ' ' + rider.lastName;
      const email = rider.email || 'N/A';
      const phone = rider.phone || 'N/A';
      console.log(`   ${index + 1}. ${name} | ${email} | ${phone}`);
    });
    
    res.json(riders);
  } catch (error) {
    console.error('Error fetching riders:', error);
    res.status(500).json({ message: 'Server error fetching riders' });
  }
});

// Get single rider by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const rider = await Rider.findById(req.params.id);
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }
    res.json(rider);
  } catch (error) {
    console.error('Error fetching rider:', error);
    res.status(500).json({ message: 'Server error fetching rider' });
  }
});

// Create new rider (admin only)
router.post('/', authenticateToken, authorizeRoles('admin', 'dispatcher'), async (req, res) => {
  try {
    const { riderId, firstName, lastName, dateOfBirth, phone, email, address, notes, serviceBalance, contractDetails, pricingDetails, mileageBalance, preferredVehicleType } = req.body;

    console.log('Creating new rider:', req.body);

    // Check if rider already exists with same riderId
    const existingRider = await Rider.findOne({ riderId });
    if (existingRider) {
      return res.status(400).json({ 
        success: false,
        message: 'A rider with this ID already exists' 
      });
    }

    // Check for duplicate email
    if (email) {
      const existingEmail = await Rider.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ 
          success: false,
          message: 'A rider with this email already exists' 
        });
      }
    }

    // Check for duplicate phone
    if (phone) {
      const existingPhone = await Rider.findOne({ phone });
      if (existingPhone) {
        return res.status(400).json({ 
          success: false,
          message: 'A rider with this phone number already exists' 
        });
      }
    }

    // Validate required fields
    if (!riderId || !firstName || !lastName || !dateOfBirth || !phone) {
      return res.status(400).json({ message: 'Required fields: riderId, firstName, lastName, dateOfBirth, phone' });
    }

    // Create new rider
    const riderData = {
      riderId,
      firstName,
      lastName,
      dateOfBirth,
      phone,
      email,
      address,
      notes,
      preferredVehicleType,
      serviceBalance,
      contractDetails,
      pricingDetails,
      mileageBalance,
      status: 'active',
      isActive: true
    };

    const rider = new Rider(riderData);
    await rider.save();

    res.status(201).json({
      message: 'Rider created successfully',
      rider: rider.toJSON()
    });
  } catch (error) {
    console.error('Error creating rider:', error);
    res.status(500).json({ message: 'Server error creating rider' });
  }
});

// Update rider
router.put('/:id', authenticateToken, authorizeRoles('admin', 'dispatcher'), async (req, res) => {
  try {
    // Check for duplicate riderId (excluding current rider)
    if (req.body.riderId) {
      const existingRiderId = await Rider.findOne({ 
        riderId: req.body.riderId,
        _id: { $ne: req.params.id }
      });
      if (existingRiderId) {
        return res.status(400).json({ 
          success: false,
          message: 'A rider with this ID already exists' 
        });
      }
    }

    // Check for duplicate email (excluding current rider)
    if (req.body.email) {
      const existingEmail = await Rider.findOne({ 
        email: req.body.email,
        _id: { $ne: req.params.id }
      });
      if (existingEmail) {
        return res.status(400).json({ 
          success: false,
          message: 'A rider with this email already exists' 
        });
      }
    }

    // Check for duplicate phone (excluding current rider)
    if (req.body.phone) {
      const existingPhone = await Rider.findOne({ 
        phone: req.body.phone,
        _id: { $ne: req.params.id }
      });
      if (existingPhone) {
        return res.status(400).json({ 
          success: false,
          message: 'A rider with this phone number already exists' 
        });
      }
    }

    const rider = await Rider.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    res.json({
      message: 'Rider updated successfully',
      rider: rider.toJSON()
    });
  } catch (error) {
    console.error('Error updating rider:', error);
    res.status(500).json({ message: 'Server error updating rider' });
  }
});

// Delete rider
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const rider = await Rider.findByIdAndDelete(req.params.id);
    
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    res.json({ message: 'Rider deleted successfully' });
  } catch (error) {
    console.error('Error deleting rider:', error);
    res.status(500).json({ message: 'Server error deleting rider' });
  }
});

export default router;
