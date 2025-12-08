import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// Store notification history in memory (in production, use a database)
let notificationHistory = [];

// Email transporter configuration
const createTransporter = () => {
  // In production, use real SMTP credentials from environment variables
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'noreply@transport.com',
      pass: process.env.SMTP_PASS || 'password'
    }
  });
};

// Get notification configuration
router.get('/config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // In production, fetch from database
    const config = {
      enabled: true,
      recipients: ['admin@transport.com'],
      criticalOnly: true,
      includeUserInfo: true,
      includeOldValue: true,
      includeNewValue: true,
      notifyOnTemplateApply: true,
      notifyOnBulkImport: true,
      categories: {
        security: true,
        system: true,
        encryption: true,
        rateLimits: false,
        notifications: false
      }
    };
    
    res.json(config);
  } catch (error) {
    console.error('Error fetching notification config:', error);
    res.status(500).json({ message: 'Error fetching configuration' });
  }
});

// Save notification configuration
router.put('/config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const config = req.body;
    // In production, save to database
    // await NotificationConfig.findOneAndUpdate({ userId: req.user._id }, config, { upsert: true });
    
    res.json({ message: 'Configuration saved successfully', config });
  } catch (error) {
    console.error('Error saving notification config:', error);
    res.status(500).json({ message: 'Error saving configuration' });
  }
});

// Send test notification
router.post('/test', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { recipients } = req.body;
    
    if (!recipients || recipients.length === 0) {
      return res.status(400).json({ message: 'No recipients specified' });
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || 'Transport Management <noreply@transport.com>',
      to: recipients.join(', '),
      subject: '🔔 Test: Settings Change Notification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🔔 Test Notification</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              This is a test email notification from your Transport Management System.
            </p>
            
            <div style="background: white; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1f2937;">Configuration Status</h3>
              <p style="margin: 0; color: #6b7280;">✅ Email notifications are working correctly!</p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              You will receive notifications when critical settings are changed in your system.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>Transport Management System © ${new Date().getFullYear()}</p>
          </div>
        </div>
      `
    };

    // In development, just log instead of sending
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Test email (dev mode):', mailOptions);
      
      // Add to history
      notificationHistory.unshift({
        subject: mailOptions.subject,
        message: 'Test notification sent successfully',
        recipients,
        status: 'sent',
        timestamp: new Date().toISOString()
      });
      
      return res.json({ message: 'Test notification sent (development mode)' });
    }

    // In production, send actual email
    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    
    // Add to history
    notificationHistory.unshift({
      subject: mailOptions.subject,
      message: 'Test notification sent successfully',
      recipients,
      status: 'sent',
      timestamp: new Date().toISOString()
    });
    
    res.json({ message: 'Test notification sent successfully' });
  } catch (error) {
    console.error('Error sending test notification:', error);
    
    // Add failed notification to history
    notificationHistory.unshift({
      subject: 'Test notification',
      message: error.message,
      recipients: req.body.recipients,
      status: 'failed',
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ message: 'Error sending test notification', error: error.message });
  }
});

// Send setting change notification
router.post('/send', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { category, field, oldValue, newValue, user, timestamp, recipients } = req.body;
    
    if (!recipients || recipients.length === 0) {
      return res.status(400).json({ message: 'No recipients specified' });
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || 'Transport Management <noreply@transport.com>',
      to: recipients.join(', '),
      subject: `⚠️ Critical Setting Changed: ${category}.${field}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">⚠️ Critical Setting Changed</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb;">
            <div style="background: white; border-left: 4px solid #ef4444; padding: 20px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 15px 0; color: #1f2937;">Setting Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Category:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${category}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Setting:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${field}</td>
                </tr>
                ${oldValue !== undefined ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Old Value:</td>
                  <td style="padding: 8px 0; color: #ef4444; text-decoration: line-through;">${oldValue}</td>
                </tr>
                ` : ''}
                ${newValue !== undefined ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">New Value:</td>
                  <td style="padding: 8px 0; color: #10b981; font-weight: 600;">${newValue}</td>
                </tr>
                ` : ''}
                ${user ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Changed By:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${user}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Time:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${new Date(timestamp).toLocaleString()}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin-top: 20px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>⚠️ Security Notice:</strong> This is a critical system setting. 
                If you did not make this change, please review your system immediately.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>Transport Management System © ${new Date().getFullYear()}</p>
            <p>This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      `
    };

    // In development, just log instead of sending
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Setting change notification (dev mode):', {
        to: recipients.join(', '),
        category,
        field,
        oldValue,
        newValue
      });
      
      // Add to history
      notificationHistory.unshift({
        subject: mailOptions.subject,
        message: `${category}.${field} changed from ${oldValue} to ${newValue}`,
        recipients,
        status: 'sent',
        timestamp: new Date().toISOString()
      });
      
      return res.json({ message: 'Notification sent (development mode)' });
    }

    // In production, send actual email
    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    
    // Add to history
    notificationHistory.unshift({
      subject: mailOptions.subject,
      message: `${category}.${field} changed`,
      recipients,
      status: 'sent',
      timestamp: new Date().toISOString()
    });
    
    res.json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Error sending notification:', error);
    
    // Add failed notification to history
    notificationHistory.unshift({
      subject: `Setting change: ${req.body.category}.${req.body.field}`,
      message: error.message,
      recipients: req.body.recipients,
      status: 'failed',
      timestamp: new Date().toISOString()
    });
    
    // Don't fail the request - notifications are non-critical
    res.json({ message: 'Setting saved, but notification failed', error: error.message });
  }
});

// Get recent notifications
router.get('/recent', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Return last 50 notifications
    const recent = notificationHistory.slice(0, 50);
    res.json(recent);
  } catch (error) {
    console.error('Error fetching recent notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

export default router;
