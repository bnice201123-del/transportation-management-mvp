import RecurringTrip from '../models/RecurringTrip.js';
import Trip from '../models/Trip.js';
import { logActivity } from '../utils/logger.js';

class RecurringTripService {
  constructor() {
    this.isProcessing = false;
  }

  /**
   * Generate trips for all active recurring patterns
   * This should be called periodically (e.g., daily via cron job)
   */
  async generateTripsForAllPatterns(options = {}) {
    if (this.isProcessing) {
      console.log('RecurringTripService: Already processing, skipping this run');
      return { message: 'Already processing' };
    }

    this.isProcessing = true;
    
    try {
      const { 
        daysAhead = 7,
        maxTripsPerPattern = 50,
        dryRun = false 
      } = options;

      console.info('RecurringTripService: Starting generation process', { daysAhead, maxTripsPerPattern, dryRun });

      // Find all active recurring trip patterns ready for generation
      const patterns = await RecurringTrip.findReadyForGeneration();
      
      if (patterns.length === 0) {
        console.info('RecurringTripService: No patterns ready for generation');
        return { 
          message: 'No patterns ready for generation',
          processed: 0,
          generated: 0 
        };
      }

      console.info(`RecurringTripService: Found ${patterns.length} patterns to process`);

      const results = {
        processed: 0,
        generated: 0,
        errors: 0,
        patterns: []
      };

      // Process each pattern
      for (const pattern of patterns) {
        try {
          const patternResult = await this.generateTripsForPattern(pattern, {
            daysAhead,
            maxTripsPerPattern,
            dryRun
          });

          results.processed++;
          results.generated += patternResult.generated;
          results.patterns.push({
            id: pattern._id,
            title: pattern.title,
            generated: patternResult.generated,
            errors: patternResult.errors.length,
            status: 'success'
          });

        } catch (error) {
          console.error(`RecurringTripService: Error processing pattern ${pattern._id}:`, error);
          results.errors++;
          results.patterns.push({
            id: pattern._id,
            title: pattern.title,
            generated: 0,
            errors: 1,
            status: 'error',
            error: error.message
          });
        }
      }

      console.info('RecurringTripService: Generation process completed', results);
      return results;

    } catch (error) {
      console.error('RecurringTripService: Fatal error in generation process:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Generate trips for a specific recurring pattern
   */
  async generateTripsForPattern(pattern, options = {}) {
    const { 
      daysAhead = 7,
      maxTripsPerPattern = 50,
      dryRun = false,
      startDate = new Date(),
      userId = null 
    } = options;

    console.info(`RecurringTripService: Generating trips for pattern ${pattern._id}`, {
      title: pattern.title,
      daysAhead,
      maxTripsPerPattern,
      dryRun
    });

    // Calculate end date
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + daysAhead);

    // Generate occurrences using the pattern's method
    const occurrences = pattern.generateOccurrences(startDate, endDate, maxTripsPerPattern);

    if (dryRun) {
      console.info(`RecurringTripService: Dry run - would generate ${occurrences.length} trips`);
      return {
        generated: 0,
        wouldGenerate: occurrences.length,
        occurrences: occurrences.slice(0, 10), // Return first 10 for preview
        errors: []
      };
    }

    const results = {
      generated: 0,
      skipped: 0,
      errors: []
    };

    // Generate actual trips
    for (const occurrence of occurrences) {
      try {
        // Check if trip already exists for this date
        const existingTrip = pattern.generatedTrips.find(
          gt => gt.scheduledDate.toISOString().split('T')[0] === occurrence.scheduledDate
        );

        if (existingTrip) {
          console.debug(`RecurringTripService: Skipping existing trip for ${occurrence.scheduledDate}`);
          results.skipped++;
          continue;
        }

        // Check if we've reached the max occurrences limit
        if (pattern.maxOccurrences && pattern.currentOccurrences >= pattern.maxOccurrences) {
          console.info(`RecurringTripService: Pattern ${pattern._id} has reached max occurrences limit`);
          break;
        }

        // Create the trip
        const tripData = {
          riderName: pattern.riderName,
          riderPhone: pattern.riderPhone,
          riderEmail: pattern.riderEmail,
          pickupLocation: pattern.pickupLocation,
          dropoffLocation: pattern.dropoffLocation,
          scheduledDate: occurrence.date,
          scheduledTime: pattern.startTime,
          duration: pattern.duration,
          assignedDriver: pattern.assignedDriver,
          assignedVehicle: pattern.assignedVehicle,
          fare: pattern.fare,
          notes: this.buildTripNotes(pattern),
          status: 'scheduled',
          createdBy: userId || pattern.createdBy,
          recurringTripId: pattern._id,
          isRecurring: true,
          tags: pattern.tags || [],
          priority: pattern.priority || 'normal'
        };

        const trip = new Trip(tripData);
        const savedTrip = await trip.save();

        // Add to pattern's generated trips tracking
        pattern.generatedTrips.push({
          tripId: savedTrip._id,
          scheduledDate: occurrence.date,
          status: 'scheduled',
          generatedAt: new Date()
        });

        results.generated++;

        console.debug(`RecurringTripService: Created trip ${savedTrip._id} for ${occurrence.scheduledDate}`);

      } catch (error) {
        console.error(`RecurringTripService: Error creating trip for ${occurrence.scheduledDate}:`, error);
        results.errors.push({
          date: occurrence.scheduledDate,
          error: error.message
        });
      }
    }

    // Update pattern tracking if trips were generated
    if (results.generated > 0) {
      await pattern.updateGenerationTracking(results.generated);
      console.info(`RecurringTripService: Updated tracking for pattern ${pattern._id} - generated ${results.generated} trips`);
    }

    return results;
  }

  /**
   * Build comprehensive trip notes from pattern information
   */
  buildTripNotes(pattern) {
    const notes = [];
    
    // Add original notes if they exist
    if (pattern.notes) {
      notes.push(pattern.notes);
    }

    // Add recurring pattern info
    notes.push(`🔄 Generated from recurring pattern: "${pattern.title}"`);
    
    // Add frequency info
    const frequencyInfo = this.getFrequencyDescription(pattern);
    notes.push(`📅 Frequency: ${frequencyInfo}`);

    // Add special handling notes
    const specialNotes = [];
    if (pattern.skipHolidays) specialNotes.push('Skip Holidays');
    if (pattern.skipWeekends) specialNotes.push('Skip Weekends');
    if (pattern.autoAssign) specialNotes.push('Auto-Assign Enabled');
    
    if (specialNotes.length > 0) {
      notes.push(`⚙️ Options: ${specialNotes.join(', ')}`);
    }

    return notes.join(' | ');
  }

  /**
   * Get human-readable frequency description
   */
  getFrequencyDescription(pattern) {
    switch (pattern.frequency) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return `Weekly (${pattern.daysOfWeek?.join(', ') || 'No days selected'})`;
      case 'monthly':
        return `Monthly (Day ${pattern.dayOfMonth})`;
      case 'custom':
        return `Every ${pattern.customInterval} ${pattern.customUnit}`;
      default:
        return pattern.frequency;
    }
  }

  /**
   * Get service status and statistics
   */
  async getServiceStatus() {
    try {
      const stats = await RecurringTrip.aggregate([
        {
          $group: {
            _id: null,
            totalPatterns: { $sum: 1 },
            activePatterns: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
            },
            totalTripsGenerated: { $sum: '$totalTripsGenerated' },
            totalTripsCompleted: { $sum: '$totalTripsCompleted' },
            totalTripsCancelled: { $sum: '$totalTripsCancelled' }
          }
        }
      ]);

      return {
        isProcessing: this.isProcessing,
        statistics: stats[0] || {
          totalPatterns: 0,
          activePatterns: 0,
          totalTripsGenerated: 0,
          totalTripsCompleted: 0,
          totalTripsCancelled: 0
        },
        lastChecked: new Date()
      };
    } catch (error) {
      console.error('RecurringTripService: Error getting service status:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new RecurringTripService();