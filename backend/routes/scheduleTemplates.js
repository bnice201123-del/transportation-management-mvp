import express from 'express';
import ScheduleTemplate from '../models/ScheduleTemplate.js';
import Schedule from '../models/Schedule.js';
import { authenticateToken, requireAdmin, requirePermission } from '../middleware/auth.js';
import { logAuditAction } from '../services/auditService.js';

const router = express.Router();

/**
 * =====================
 * TEMPLATE MANAGEMENT
 * =====================
 */

// Get all templates
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category, isActive } = req.query;
    const query = {};
    
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const templates = await ScheduleTemplate.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single template
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const template = await ScheduleTemplate.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email');

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new template
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      category = 'custom',
      pattern,
      defaultLocation,
      defaultVehicle,
      notes
    } = req.body;

    // Validate required fields
    if (!name || !pattern) {
      return res.status(400).json({ message: 'Name and pattern are required' });
    }

    const template = new ScheduleTemplate({
      name,
      description,
      category,
      pattern,
      defaultLocation,
      defaultVehicle,
      notes,
      createdBy: req.user._id,
      isActive: true
    });

    await template.save();

    // Log audit action
    await logAuditAction('schedule_template_created', 'ScheduleTemplate', template._id, {
      name,
      category
    }, 'info');

    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update template
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, category, pattern, defaultLocation, defaultVehicle, isActive, notes } = req.body;

    const template = await ScheduleTemplate.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        category,
        pattern,
        defaultLocation,
        defaultVehicle,
        isActive,
        notes
      },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Log audit action
    await logAuditAction('schedule_template_updated', 'ScheduleTemplate', template._id, {
      name,
      category
    }, 'info');

    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete template
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const template = await ScheduleTemplate.findByIdAndDelete(req.params.id);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Log audit action
    await logAuditAction('schedule_template_deleted', 'ScheduleTemplate', template._id, {
      name: template.name
    }, 'info');

    res.json({ message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * =====================
 * APPLY TEMPLATES
 * =====================
 */

// Apply template to generate schedules
router.post('/:id/apply', authenticateToken, requirePermission('schedule', 'create'), async (req, res) => {
  try {
    const { driverIds, startDate, endDate, overwriteExisting = false } = req.body;

    if (!driverIds || !startDate || !endDate) {
      return res.status(400).json({
        message: 'driverIds, startDate, and endDate are required'
      });
    }

    const template = await ScheduleTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    let createdCount = 0;
    const errors = [];

    // Generate schedules for each driver in the date range
    for (const driverId of driverIds) {
      try {
        // If overwriting, delete existing schedules in range
        if (overwriteExisting) {
          await Schedule.deleteMany({
            driver: driverId,
            startTime: { $gte: start, $lte: end }
          });
        }

        // Apply template to this driver
        const schedules = await template.applyToDateRange(driverId, start, end);
        createdCount += schedules.length;
      } catch (err) {
        errors.push({
          driverId,
          error: err.message
        });
      }
    }

    // Log audit action
    await logAuditAction('schedule_template_applied', 'Schedule', null, {
      templateId: template._id,
      templateName: template.name,
      driverCount: driverIds.length,
      createdCount,
      dateRange: `${startDate} to ${endDate}`
    }, 'info');

    res.json({
      templateId: template._id,
      templateName: template.name,
      createdCount,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Created ${createdCount} schedules from template`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get predefined templates
router.get('/predefined/list', authenticateToken, async (req, res) => {
  try {
    const predefined = ScheduleTemplate.getPredefinedTemplates();
    res.json(predefined);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clone existing template
router.post('/:id/clone', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;

    const original = await ScheduleTemplate.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Create clone
    const cloned = new ScheduleTemplate({
      name: name || `${original.name} (Copy)`,
      description: original.description,
      category: original.category,
      pattern: JSON.parse(JSON.stringify(original.pattern)), // Deep copy
      defaultLocation: original.defaultLocation,
      defaultVehicle: original.defaultVehicle,
      notes: original.notes,
      createdBy: req.user._id,
      isActive: true
    });

    await cloned.save();

    // Log audit action
    await logAuditAction('schedule_template_cloned', 'ScheduleTemplate', cloned._id, {
      name: cloned.name,
      fromTemplate: original.name
    }, 'info');

    res.status(201).json(cloned);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get template usage stats
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const template = await ScheduleTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Count schedules created from this template
    const scheduleCount = await Schedule.countDocuments({
      templateName: template.name
    });

    res.json({
      templateId: template._id,
      templateName: template.name,
      totalUsed: template.usageCount,
      schedulesCreated: scheduleCount,
      lastUsed: template.lastUsed,
      createdAt: template.createdAt,
      createdBy: template.createdBy
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
