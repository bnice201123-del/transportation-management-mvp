import ActivityLog from '../models/ActivityLog.js';

export const logActivity = async (userId, action, description, metadata = {}, tripId = null) => {
  try {
    const log = new ActivityLog({
      userId,
      action,
      description,
      metadata,
      ...(tripId && { tripId })
    });
    await log.save();
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

export const getClientInfo = (req) => {
  return {
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent')
  };
};