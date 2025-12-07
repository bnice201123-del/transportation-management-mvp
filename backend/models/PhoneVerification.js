/**
 * Phone Verification Model
 * 
 * Manages phone number verification codes and verification status.
 * Supports SMS verification via Twilio with automatic expiration.
 */

import mongoose from 'mongoose';

const phoneVerificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  verificationCode: {
    type: String,
    required: true,
    select: false // Don't return by default for security
  },
  purpose: {
    type: String,
    enum: ['registration', 'login', 'phone_change', '2fa_backup', 'password_reset'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'expired', 'failed'],
    default: 'pending'
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    required: true
    // Removed index: true to avoid duplicate - indexed in compound and TTL indexes below
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  metadata: {
    deliveryStatus: String,
    messageId: String,
    carrier: String,
    type: String // mobile, landline, voip
  }
}, {
  timestamps: true
});

// Compound index for efficient lookups
phoneVerificationSchema.index({ phoneNumber: 1, status: 1, expiresAt: 1 });
phoneVerificationSchema.index({ userId: 1, purpose: 1, status: 1 });

// TTL index to auto-delete expired verifications after 24 hours
phoneVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });

/**
 * Generate a random 6-digit verification code
 * @returns {string} 6-digit code
 */
phoneVerificationSchema.statics.generateCode = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Create a new verification request
 * @param {ObjectId} userId - User ID
 * @param {string} phoneNumber - Phone number to verify
 * @param {string} purpose - Purpose of verification
 * @param {Object} options - Additional options (ipAddress, userAgent)
 * @returns {Promise<Object>} Created verification
 */
phoneVerificationSchema.statics.createVerification = async function(userId, phoneNumber, purpose, options = {}) {
  // Invalidate any pending verifications for this phone/purpose
  await this.updateMany(
    {
      phoneNumber,
      purpose,
      status: 'pending'
    },
    {
      $set: { status: 'expired' }
    }
  );

  // Generate new code
  const code = this.generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const verification = await this.create({
    userId,
    phoneNumber,
    verificationCode: code,
    purpose,
    expiresAt,
    ipAddress: options.ipAddress,
    userAgent: options.userAgent
  });

  return {
    verificationId: verification._id,
    code, // Return code for sending via SMS
    expiresAt
  };
};

/**
 * Verify a code
 * @param {string} phoneNumber - Phone number
 * @param {string} code - Verification code
 * @param {string} purpose - Purpose of verification
 * @returns {Promise<Object>} Verification result
 */
phoneVerificationSchema.statics.verifyCode = async function(phoneNumber, code, purpose) {
  const verification = await this.findOne({
    phoneNumber,
    purpose,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  }).select('+verificationCode');

  if (!verification) {
    return {
      success: false,
      error: 'No valid verification found. Please request a new code.',
      code: 'NOT_FOUND'
    };
  }

  // Increment attempts
  verification.attempts += 1;
  await verification.save();

  // Check if max attempts reached
  if (verification.attempts > 5) {
    verification.status = 'failed';
    await verification.save();
    return {
      success: false,
      error: 'Maximum verification attempts exceeded. Please request a new code.',
      code: 'MAX_ATTEMPTS'
    };
  }

  // Verify code
  if (verification.verificationCode !== code) {
    return {
      success: false,
      error: `Invalid code. ${6 - verification.attempts} attempts remaining.`,
      code: 'INVALID_CODE',
      attemptsRemaining: 5 - verification.attempts
    };
  }

  // Success!
  verification.status = 'verified';
  verification.verifiedAt = new Date();
  await verification.save();

  return {
    success: true,
    userId: verification.userId,
    verificationId: verification._id,
    verifiedAt: verification.verifiedAt
  };
};

/**
 * Check if phone number is verified for user
 * @param {ObjectId} userId - User ID
 * @param {string} phoneNumber - Phone number
 * @returns {Promise<boolean>}
 */
phoneVerificationSchema.statics.isPhoneVerified = async function(userId, phoneNumber) {
  const verification = await this.findOne({
    userId,
    phoneNumber,
    status: 'verified'
  });
  return !!verification;
};

/**
 * Get recent verification attempts for phone
 * @param {string} phoneNumber - Phone number
 * @param {number} hours - Hours to look back (default 24)
 * @returns {Promise<number>}
 */
phoneVerificationSchema.statics.getRecentAttempts = async function(phoneNumber, hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return await this.countDocuments({
    phoneNumber,
    createdAt: { $gte: since }
  });
};

/**
 * Cleanup expired verifications
 * @param {number} daysOld - Delete verifications older than this many days
 * @returns {Promise<Object>}
 */
phoneVerificationSchema.statics.cleanup = async function(daysOld = 7) {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  
  const result = await this.deleteMany({
    $or: [
      { status: { $in: ['expired', 'failed'] }, createdAt: { $lt: cutoffDate } },
      { status: 'verified', verifiedAt: { $lt: cutoffDate } }
    ]
  });

  return {
    deletedCount: result.deletedCount,
    cutoffDate
  };
};

/**
 * Get verification statistics
 * @param {number} days - Days to look back (default 30)
 * @returns {Promise<Object>}
 */
phoneVerificationSchema.statics.getStatistics = async function(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [stats, byPurpose, byStatus] = await Promise.all([
    this.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          verified: {
            $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          avgAttempts: { $avg: '$attempts' }
        }
      }
    ]),
    this.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: '$purpose',
          count: { $sum: 1 }
        }
      }
    ]),
    this.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  const summary = stats[0] || { total: 0, verified: 0, failed: 0, avgAttempts: 0 };

  return {
    period: `Last ${days} days`,
    summary: {
      total: summary.total,
      verified: summary.verified,
      failed: summary.failed,
      pending: summary.total - summary.verified - summary.failed,
      successRate: summary.total > 0 ? ((summary.verified / summary.total) * 100).toFixed(2) : 0,
      avgAttempts: summary.avgAttempts ? summary.avgAttempts.toFixed(2) : 0
    },
    byPurpose: byPurpose.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    byStatus: byStatus.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {})
  };
};

const PhoneVerification = mongoose.model('PhoneVerification', phoneVerificationSchema);

export default PhoneVerification;
