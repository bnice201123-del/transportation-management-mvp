import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid token or user inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(403).json({ message: 'Invalid token' });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Support both single role (legacy) and multiple roles array
    const userRoles = req.user.roles && req.user.roles.length > 0 
      ? req.user.roles 
      : [req.user.role];

    // Check if user has at least one of the required roles
    const hasAccess = roles.some(role => userRoles.includes(role));

    if (!hasAccess) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(', ')}. User roles: ${userRoles.join(', ')}` 
      });
    }

    next();
  };
};