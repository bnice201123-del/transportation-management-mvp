import Schedule from '../models/Schedule.js';
import TimeOff from '../models/TimeOff.js';
import User from '../models/User.js';

/**
 * Schedule Conflict Detection Service
 * Detects overlapping shifts, insufficient breaks, holiday conflicts, and time-off conflicts
 */

class ScheduleConflictService {
  /**
   * Parse time string (HH:mm) to minutes from midnight
   */
  static timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Calculate duration between two times (in minutes)
   */
  static calculateDuration(startTime, endTime) {
    let start = this.timeToMinutes(startTime);
    let end = this.timeToMinutes(endTime);
    
    // Handle overnight shifts
    if (end < start) {
      end += 24 * 60;
    }
    
    return end - start;
  }

  /**
   * Check if two time ranges overlap on the same day
   */
  static timesOverlap(shift1Start, shift1End, shift2Start, shift2End) {
    const s1 = this.timeToMinutes(shift1Start);
    const e1 = this.timeToMinutes(shift1End);
    const s2 = this.timeToMinutes(shift2Start);
    const e2 = this.timeToMinutes(shift2End);

    // Handle overnight shifts
    const adjustedE1 = e1 < s1 ? e1 + 24 * 60 : e1;
    const adjustedE2 = e2 < s2 ? e2 + 24 * 60 : e2;

    return !(adjustedE1 <= s2 || s1 >= adjustedE2);
  }

  /**
   * Check for overlapping shifts for a driver on a specific date
   */
  static async checkOverlappingShifts(driverId, date, shiftId = null) {
    const query = {
      driver: driverId,
      startTime: {
        $gte: new Date(date),
        $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
      },
      status: { $in: ['scheduled', 'in-progress', 'completed'] }
    };

    if (shiftId) {
      query._id = { $ne: shiftId };
    }

    const conflicts = await Schedule.find(query);
    return conflicts;
  }

  /**
   * Check if driver has sufficient break time between shifts
   */
  static async checkBreakTimeConflicts(driverId, newShift, minBreakHours = 11) {
    const conflictDetails = [];

    // Get schedules 2 days before and after to check for breaks
    const searchStart = new Date(newShift.startTime.getTime() - 2 * 24 * 60 * 60 * 1000);
    const searchEnd = new Date(newShift.startTime.getTime() + 2 * 24 * 60 * 60 * 1000);

    const adjacentShifts = await Schedule.find({
      driver: driverId,
      startTime: { $gte: searchStart, $lte: searchEnd },
      status: { $in: ['scheduled', 'in-progress', 'completed'] },
      _id: { $ne: newShift._id }
    }).sort({ startTime: 1 });

    for (const shift of adjacentShifts) {
      const endTime = shift.endTime || new Date(shift.startTime.getTime() + 8 * 60 * 60 * 1000);
      const breakMinutes = (newShift.startTime - endTime) / (1000 * 60);
      const breakHours = breakMinutes / 60;

      if (breakHours < minBreakHours && breakHours > -24) {
        // Negative hours mean it's the next day
        conflictDetails.push({
          type: 'insufficient_break',
          severity: 'high',
          description: `Only ${breakHours.toFixed(1)} hours between shifts (minimum: ${minBreakHours} hours)`,
          affectedShiftId: shift._id,
          suggestedBreakNeeded: minBreakHours - breakHours
        });
      }
    }

    return conflictDetails;
  }

  /**
   * Check for time-off conflicts with new shift
   */
  static async checkTimeOffConflicts(driverId, newShift) {
    const shiftDate = new Date(newShift.startTime);
    const conflictDetails = [];

    const timeOffs = await TimeOff.find({
      driver: driverId,
      status: 'approved',
      startDate: { $lte: shiftDate },
      endDate: { $gte: shiftDate }
    });

    if (timeOffs.length > 0) {
      for (const timeOff of timeOffs) {
        conflictDetails.push({
          type: 'time_off_conflict',
          severity: 'critical',
          description: `Driver has approved ${timeOff.type} from ${timeOff.startDate.toDateString()} to ${timeOff.endDate.toDateString()}`,
          timeOffId: timeOff._id,
          timeOffType: timeOff.type
        });
      }
    }

    return conflictDetails;
  }

  /**
   * Check for maximum hours in a week
   */
  static async checkMaxHoursPerWeek(driverId, newShift, maxHours = 60) {
    const conflictDetails = [];

    // Get start of week
    const date = new Date(newShift.startTime);
    const day = date.getDay();
    const diff = date.getDate() - day;
    const weekStart = new Date(date.setDate(diff));
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const weeklyShifts = await Schedule.find({
      driver: driverId,
      startTime: { $gte: weekStart, $lt: weekEnd },
      status: { $in: ['scheduled', 'completed'] },
      _id: { $ne: newShift._id }
    });

    let totalHours = newShift.duration || 0;
    for (const shift of weeklyShifts) {
      totalHours += shift.duration || 0;
    }

    if (totalHours > maxHours) {
      conflictDetails.push({
        type: 'max_hours_exceeded',
        severity: 'medium',
        description: `Total hours (${totalHours}) exceeds weekly maximum (${maxHours})`,
        totalHours,
        excessHours: totalHours - maxHours
      });
    }

    return conflictDetails;
  }

  /**
   * Comprehensive conflict check
   */
  static async checkAllConflicts(driverId, newShift) {
    const allConflicts = [];

    // Check overlapping shifts
    const overlapping = await this.checkOverlappingShifts(driverId, newShift.startTime, newShift._id);
    if (overlapping.length > 0) {
      allConflicts.push({
        type: 'overlapping_shift',
        severity: 'critical',
        count: overlapping.length,
        shifts: overlapping.map(s => ({
          id: s._id,
          startTime: s.startTime,
          endTime: s.endTime
        })),
        description: `${overlapping.length} overlapping shift(s) found on this date`
      });
    }

    // Check break time
    const breakConflicts = await this.checkBreakTimeConflicts(driverId, newShift);
    if (breakConflicts.length > 0) {
      allConflicts.push(...breakConflicts);
    }

    // Check time-off conflicts
    const timeOffConflicts = await this.checkTimeOffConflicts(driverId, newShift);
    if (timeOffConflicts.length > 0) {
      allConflicts.push(...timeOffConflicts);
    }

    // Check max hours
    const maxHoursConflicts = await this.checkMaxHoursPerWeek(driverId, newShift);
    if (maxHoursConflicts.length > 0) {
      allConflicts.push(...maxHoursConflicts);
    }

    return {
      hasConflicts: allConflicts.length > 0,
      conflicts: allConflicts,
      criticalCount: allConflicts.filter(c => c.severity === 'critical').length,
      warningCount: allConflicts.filter(c => c.severity === 'high' || c.severity === 'medium').length
    };
  }

  /**
   * Find alternative drivers for a shift (for coverage suggestions)
   */
  static async findAlternativeDrivers(originalDriverId, shift, maxResults = 5) {
    const alternativeDrivers = [];

    // Get all drivers
    const allDrivers = await User.find({ role: 'driver', isActive: true });

    for (const driver of allDrivers) {
      if (driver._id.toString() === originalDriverId.toString()) continue;

      const conflicts = await this.checkAllConflicts(driver._id.toString(), shift);
      
      alternativeDrivers.push({
        driverId: driver._id,
        name: driver.firstName + ' ' + driver.lastName,
        email: driver.email,
        phoneNumber: driver.phoneNumber,
        hasConflicts: conflicts.hasConflicts,
        conflictCount: conflicts.conflicts.length,
        availability: !conflicts.hasConflicts
      });
    }

    // Sort by availability and conflict count
    return alternativeDrivers
      .sort((a, b) => {
        if (a.availability !== b.availability) {
          return a.availability ? -1 : 1;
        }
        return a.conflictCount - b.conflictCount;
      })
      .slice(0, maxResults);
  }

  /**
   * Generate shift recommendations for a driver (prevent conflicts)
   */
  static async getAvailableTimeSlots(driverId, date, slotDuration = 480) {
    // Get all shifts for the day
    const existingShifts = await Schedule.find({
      driver: driverId,
      startTime: {
        $gte: new Date(date),
        $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
      },
      status: { $in: ['scheduled', 'in-progress', 'completed'] }
    }).sort({ startTime: 1 });

    // Get time-offs for the day
    const timeOffs = await TimeOff.find({
      driver: driverId,
      status: 'approved',
      startDate: { $lte: date },
      endDate: { $gte: date }
    });

    const availableSlots = [];
    let currentTime = 6 * 60; // 6:00 AM
    const endTime = 22 * 60; // 10:00 PM

    // Simple algorithm: find gaps between shifts
    for (const shift of existingShifts) {
      const shiftStart = this.timeToMinutes(shift.startTime);
      const shiftEnd = this.timeToMinutes(shift.endTime);

      if (currentTime + slotDuration <= shiftStart) {
        const hours = Math.floor(currentTime / 60);
        const mins = currentTime % 60;
        const endHours = Math.floor((currentTime + slotDuration) / 60);
        const endMins = (currentTime + slotDuration) % 60;

        availableSlots.push({
          startTime: `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`,
          endTime: `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`,
          duration: slotDuration
        });
      }

      currentTime = Math.max(currentTime, shiftEnd) + 60; // 1 hour break minimum
    }

    // Check final slot
    if (currentTime + slotDuration <= endTime) {
      const hours = Math.floor(currentTime / 60);
      const mins = currentTime % 60;
      const endHours = Math.floor((currentTime + slotDuration) / 60);
      const endMins = (currentTime + slotDuration) % 60;

      availableSlots.push({
        startTime: `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`,
        endTime: `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`,
        duration: slotDuration
      });
    }

    return availableSlots;
  }
}

export default ScheduleConflictService;
