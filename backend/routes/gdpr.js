import express from 'express';
import GDPRRequest from '../models/GDPRRequest.js';
import GDPRService from '../services/gdprService.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';
import { gdprLimiter, adminLimiter } from '../middleware/rateLimiter.js';
import crypto from 'crypto';
import path from 'path';

const router = express.Router();

/**
 * POST /api/gdpr/export
 * Request data export
 */
router.post('/export', gdprLimiter, authenticateToken, async (req, res) => {
  try {
    const { format = 'json', includeRelated = true } = req.body;
    const userId = req.user._id;

    // Check for existing pending/processing requests
    const existingRequest = await GDPRRequest.findOne({
      userId,
      requestType: 'data_export',
      status: { $in: ['pending', 'processing'] }
    });

    if (existingRequest) {
      return res.status(409).json({
        message: 'You already have a pending data export request',
        requestId: existingRequest._id
      });
    }

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create GDPR request
    const request = await GDPRRequest.createRequest({
      userId,
      requestType: 'data_export',
      requestDetails: {
        format,
        includeRelated
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestSource: 'web'
      },
      verificationToken
    });

    // Audit log
    await logAudit({
      userId: req.user._id,
      username: req.user.username,
      userRole: req.user.role,
      action: 'gdpr_export_requested',
      category: 'security',
      description: `Requested data export in ${format} format`,
      targetType: 'GDPRRequest',
      targetId: request._id.toString(),
      metadata: { ipAddress: req.ip, userAgent: req.headers['user-agent'] },
      severity: 'info',
      success: true
    });

    // In a production system, you might send verification email here
    // For now, we'll auto-verify and process

    // Auto-verify for MVP
    await request.markVerified('admin', {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Process immediately (in production, this should be queued)
    try {
      await request.updateStatus('processing', userId, 'Processing data export');

      const exportResult = await GDPRService.exportUserData(userId, {
        format,
        includeRelated
      });

      request.exportData = {
        fileName: exportResult.fileName,
        fileSize: exportResult.fileSize,
        dataCollections: exportResult.dataCollections,
        recordCounts: exportResult.recordCounts
      };

      await request.updateStatus('completed', userId, 'Data export completed');

      res.status(201).json({
        message: 'Data export request created and processed successfully',
        request: {
          id: request._id,
          status: request.status,
          fileName: exportResult.fileName,
          fileSize: exportResult.fileSize,
          recordCounts: exportResult.recordCounts,
          expiresAt: request.expiresAt
        }
      });
    } catch (error) {
      await request.updateStatus('failed', userId, error.message);
      request.result.errors = [error.message];
      await request.save();

      throw error;
    }
  } catch (error) {
    console.error('Error creating data export request:', error);
    res.status(500).json({
      message: 'Failed to create data export request',
      error: error.message
    });
  }
});

/**
 * GET /api/gdpr/export/:requestId/download
 * Download exported data
 */
router.get('/export/:requestId/download', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await GDPRRequest.findOne({
      _id: requestId,
      userId,
      requestType: 'data_export',
      status: 'completed'
    });

    if (!request) {
      return res.status(404).json({
        message: 'Export request not found or not ready'
      });
    }

    if (!request.exportData?.fileName) {
      return res.status(404).json({
        message: 'Export file not found'
      });
    }

    // Check if expired
    if (request.expiresAt && new Date() > request.expiresAt) {
      return res.status(410).json({
        message: 'Export file has expired'
      });
    }

    const filePath = GDPRService.getExportFilePath(request.exportData.fileName);

    // Record download
    await request.recordDownload();

    // Audit log
    await logAudit({
      userId: req.user._id,
      username: req.user.username,
      userRole: req.user.role,
      action: 'gdpr_export_downloaded',
      category: 'security',
      description: `Downloaded data export file`,
      targetType: 'GDPRRequest',
      targetId: request._id.toString(),
      metadata: { ipAddress: req.ip, userAgent: req.headers['user-agent'] },
      severity: 'info',
      success: true
    });

    res.download(filePath, request.exportData.fileName);
  } catch (error) {
    console.error('Error downloading export:', error);
    res.status(500).json({
      message: 'Failed to download export',
      error: error.message
    });
  }
});

/**
 * POST /api/gdpr/delete
 * Request account deletion
 */
router.post('/delete', gdprLimiter, authenticateToken, async (req, res) => {
  try {
    const { confirmation, reason } = req.body;
    const userId = req.user._id;

    // Require explicit confirmation
    if (confirmation !== 'DELETE_MY_ACCOUNT') {
      return res.status(400).json({
        message: 'Invalid confirmation. Type DELETE_MY_ACCOUNT to proceed'
      });
    }

    // Check for existing pending deletion request
    const existingRequest = await GDPRRequest.findOne({
      userId,
      requestType: 'data_deletion',
      status: { $in: ['pending', 'processing'] }
    });

    if (existingRequest) {
      return res.status(409).json({
        message: 'You already have a pending deletion request',
        requestId: existingRequest._id
      });
    }

    // Create GDPR request
    const request = await GDPRRequest.createRequest({
      userId,
      requestType: 'data_deletion',
      requestDetails: {
        reason: reason || 'User requested account deletion'
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestSource: 'web'
      }
    });

    // Audit log
    await logAudit({
      userId: req.user._id,
      username: req.user.username,
      userRole: req.user.role,
      action: 'gdpr_deletion_requested',
      category: 'security',
      description: `Requested account deletion`,
      targetType: 'GDPRRequest',
      targetId: request._id.toString(),
      metadata: { ipAddress: req.ip, userAgent: req.headers['user-agent'] },
      severity: 'warning',
      success: true
    });

    res.status(201).json({
      message: 'Account deletion request created. This will be processed within 30 days.',
      request: {
        id: request._id,
        status: request.status,
        requestedAt: request.requestedAt
      },
      warning: 'This action cannot be undone. Your data will be permanently deleted or anonymized.'
    });
  } catch (error) {
    console.error('Error creating deletion request:', error);
    res.status(500).json({
      message: 'Failed to create deletion request',
      error: error.message
    });
  }
});

/**
 * DELETE /api/gdpr/delete/:requestId
 * Cancel deletion request (before processing)
 */
router.delete('/delete/:requestId', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await GDPRRequest.findOne({
      _id: requestId,
      userId,
      requestType: 'data_deletion'
    });

    if (!request) {
      return res.status(404).json({
        message: 'Deletion request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        message: `Cannot cancel request with status: ${request.status}`
      });
    }

    await request.updateStatus('cancelled', userId, 'User cancelled deletion request');

    // Audit log
    await logAudit({
      userId: req.user._id,
      username: req.user.username,
      userRole: req.user.role,
      action: 'gdpr_deletion_cancelled',
      category: 'security',
      description: `Cancelled account deletion request`,
      targetType: 'GDPRRequest',
      targetId: request._id.toString(),
      metadata: { ipAddress: req.ip, userAgent: req.headers['user-agent'] },
      severity: 'info',
      success: true
    });

    res.json({
      message: 'Deletion request cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling deletion request:', error);
    res.status(500).json({
      message: 'Failed to cancel deletion request',
      error: error.message
    });
  }
});

/**
 * GET /api/gdpr/requests
 * Get user's GDPR requests
 */
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, status } = req.query;

    const requests = await GDPRRequest.getUserRequests(userId, {
      type,
      status,
      limit: 50
    });

    res.json({
      requests: requests.map(req => ({
        id: req._id,
        type: req.requestType,
        status: req.status,
        requestedAt: req.requestedAt,
        completedAt: req.completedAt,
        expiresAt: req.expiresAt,
        exportData: req.exportData ? {
          fileName: req.exportData.fileName,
          fileSize: req.exportData.fileSize,
          downloadCount: req.exportData.downloadCount
        } : null
      }))
    });
  } catch (error) {
    console.error('Error fetching GDPR requests:', error);
    res.status(500).json({
      message: 'Failed to fetch requests',
      error: error.message
    });
  }
});

// ============ ADMIN ROUTES ============

/**
 * GET /api/gdpr/admin/requests
 * Get all GDPR requests (admin only)
 */
router.get('/admin/requests', adminLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { type, status, page = 1, limit = 50 } = req.query;

    const query = {};
    if (type) query.requestType = type;
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const requests = await GDPRRequest.find(query)
      .populate('userId', 'firstName lastName email username role')
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await GDPRRequest.countDocuments(query);

    res.json({
      requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching GDPR requests:', error);
    res.status(500).json({
      message: 'Failed to fetch requests',
      error: error.message
    });
  }
});

/**
 * GET /api/gdpr/admin/pending
 * Get pending GDPR requests (admin only)
 */
router.get('/admin/pending', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { type } = req.query;
    const requests = await GDPRRequest.getPendingRequests({ type });

    res.json({ requests });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({
      message: 'Failed to fetch pending requests',
      error: error.message
    });
  }
});

/**
 * POST /api/gdpr/admin/process/:requestId
 * Process a GDPR request (admin only)
 */
router.post('/admin/process/:requestId', adminLimiter, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await GDPRRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        message: `Cannot process request with status: ${request.status}`
      });
    }

    await request.updateStatus('processing', req.user._id, 'Admin started processing');

    try {
      if (request.requestType === 'data_export') {
        const exportResult = await GDPRService.exportUserData(
          request.userId,
          request.requestDetails
        );

        request.exportData = {
          fileName: exportResult.fileName,
          fileSize: exportResult.fileSize,
          dataCollections: exportResult.dataCollections,
          recordCounts: exportResult.recordCounts
        };

        await request.updateStatus('completed', req.user._id, 'Export completed by admin');
      } else if (request.requestType === 'data_deletion') {
        const deletionResult = await GDPRService.deleteUserData(request.userId, {
          anonymize: true,
          createBackup: true,
          retainLegal: true
        });

        request.deletionData = deletionResult;
        await request.updateStatus('completed', req.user._id, 'Deletion completed by admin');
      }

      // Audit log
      await logAudit({
        userId: req.user._id,
        username: req.user.username,
        userRole: req.user.role,
        action: request.requestType === 'data_export' ? 'gdpr_export_processed' : 'gdpr_deletion_processed',
        category: 'security',
        description: `Processed ${request.requestType} request`,
        targetType: 'GDPRRequest',
        targetId: request._id.toString(),
        metadata: { ipAddress: req.ip, userAgent: req.headers['user-agent'] },
        severity: request.requestType === 'data_deletion' ? 'warning' : 'info',
        success: true
      });

      res.json({
        message: 'Request processed successfully',
        request
      });
    } catch (error) {
      await request.updateStatus('failed', req.user._id, error.message);
      request.result.errors = [error.message];
      await request.save();
      throw error;
    }
  } catch (error) {
    console.error('Error processing GDPR request:', error);
    res.status(500).json({
      message: 'Failed to process request',
      error: error.message
    });
  }
});

/**
 * POST /api/gdpr/admin/note/:requestId
 * Add admin note to request
 */
router.post('/admin/note/:requestId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { note } = req.body;

    const request = await GDPRRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    await request.addNote(note, req.user._id);

    res.json({
      message: 'Note added successfully',
      request
    });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({
      message: 'Failed to add note',
      error: error.message
    });
  }
});

/**
 * GET /api/gdpr/admin/statistics
 * Get GDPR statistics
 */
router.get('/admin/statistics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const statistics = await GDPRRequest.getStatistics({ startDate, endDate });

    res.json(statistics);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

/**
 * POST /api/gdpr/admin/cleanup
 * Clean up expired exports
 */
router.post('/admin/cleanup', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const deletedRequests = await GDPRRequest.cleanupExpired();
    const deletedFiles = await GDPRService.cleanupOldExports(30);

    // Audit log
    await logAudit({
      userId: req.user._id,
      username: req.user.username,
      userRole: req.user.role,
      action: 'gdpr_cleanup',
      category: 'system',
      description: `Cleaned up ${deletedRequests} expired requests and ${deletedFiles} old export files`,
      metadata: { ipAddress: req.ip, userAgent: req.headers['user-agent'] },
      severity: 'info',
      success: true
    });

    res.json({
      message: 'Cleanup completed',
      deletedRequests,
      deletedFiles
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    res.status(500).json({
      message: 'Cleanup failed',
      error: error.message
    });
  }
});

export default router;
