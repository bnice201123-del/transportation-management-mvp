import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  },
  action: {
    type: String,
    required: true,
    enum: [
      'trip_created',
      'trip_assigned',
      'trip_started',
      'trip_completed',
      'trip_cancelled',
      'trip_status_reverted',
      'driver_arrived',
      'status_updated',
      'location_updated',
      'user_login',
      'user_logout',
      'profile_updated',
      'password_changed',
      'password_reset',
      'notification_preferences_update',
      'profile_image_uploaded',
      'profile_image_deleted',
      'user_created',
      'user_updated',
      'user_deleted',
      'role_changed',
      'waypoint_completed',
      'route_optimized',
      'bulk_cancel_trips',
      'template_created',
      'template_updated',
      'template_deleted',
      'template_shared',
      'traffic_alert',
      'trip_traffic_updated',
      'geofence_created',
      'geofence_updated',
      'geofence_deleted',
      'geofence_entered',
      'geofence_exited',
      'parking_location_created',
      'speed_violation',
      'route_deviation',
      'driver_preferences_created',
      'driver_preferences_updated',
      'driver_preferences_deleted',
      'driver_match_search',
      'trip_auto_assigned',
      'trip_reassigned',
      'trips_batch_assigned',
      'insurance_policy_created',
      'insurance_claim_filed',
      'fuel_card_created',
      'maintenance_record_created',
      'maintenance_completed',
      'part_created',
      'purchase_order_created',
      'telematics_initialized',
      'bulk_integration_sync',
      'maintenance_schedule_created',
      'bulk_maintenance_schedules_created',
      'maintenance_schedule_completed',
      'maintenance_schedule_rescheduled',
      'maintenance_schedule_deactivated',
      'vehicle_document_uploaded',
      'vehicle_document_archived',
      'vehicle_assignment_created',
      'vehicle_assignment_completed',
      'vehicle_assignment_cancelled',
      'vehicle_replaced',
      'logo_uploaded',
      'branding_updated'
    ]
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed // Store additional data as needed
  },
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
});

// Index for efficient queries
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ tripId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

export default mongoose.model('ActivityLog', activityLogSchema);