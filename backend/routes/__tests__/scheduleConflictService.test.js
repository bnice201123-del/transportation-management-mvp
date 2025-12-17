import ScheduleConflictService from '../services/scheduleConflictService.js';
import Schedule from '../models/Schedule.js';
import TimeOff from '../models/TimeOff.js';
import User from '../models/User.js';

/**
 * Schedule Conflict Service Tests
 * 
 * Run with: npm test -- scheduleConflictService.test.js
 * 
 * These tests verify the conflict detection logic for:
 * - Overlapping shifts
 * - Break time enforcement
 * - Weekly hour limits
 * - Time-off conflicts
 * - Alternative driver suggestions
 * - Available time slot calculation
 */

describe('ScheduleConflictService', () => {
  let testDriver, testDriver2, testShift, testTimeOff;

  beforeEach(async () => {
    // Setup test data
    testDriver = await User.create({
      email: 'driver1@test.com',
      firstName: 'Test',
      lastName: 'Driver1',
      role: 'driver'
    });

    testDriver2 = await User.create({
      email: 'driver2@test.com',
      firstName: 'Test',
      lastName: 'Driver2',
      role: 'driver'
    });
  });

  afterEach(async () => {
    // Cleanup
    await Schedule.deleteMany({});
    await TimeOff.deleteMany({});
    await User.deleteMany({});
  });

  // ============================================
  // Time Utility Tests
  // ============================================

  describe('Time Utilities', () => {
    test('timeToMinutes converts HH:mm format correctly', () => {
      expect(ScheduleConflictService.timeToMinutes('08:00')).toBe(480);
      expect(ScheduleConflictService.timeToMinutes('17:30')).toBe(1050);
      expect(ScheduleConflictService.timeToMinutes('00:00')).toBe(0);
      expect(ScheduleConflictService.timeToMinutes('23:59')).toBe(1439);
    });

    test('calculateDuration returns hours between two times', () => {
      const start = new Date('2025-12-15T08:00:00Z');
      const end = new Date('2025-12-15T17:00:00Z');
      
      const duration = ScheduleConflictService.calculateDuration(start, end);
      expect(duration).toBe(9);
    });

    test('calculateDuration handles overnight shifts', () => {
      const start = new Date('2025-12-15T22:00:00Z');
      const end = new Date('2025-12-16T06:00:00Z');
      
      const duration = ScheduleConflictService.calculateDuration(start, end);
      expect(duration).toBe(8);
    });
  });

  // ============================================
  // Overlap Detection Tests
  // ============================================

  describe('Overlap Detection', () => {
    test('timesOverlap detects overlapping time ranges', () => {
      // Exact overlap
      expect(
        ScheduleConflictService.timesOverlap('08:00', '17:00', '08:00', '17:00')
      ).toBe(true);

      // Partial overlap
      expect(
        ScheduleConflictService.timesOverlap('08:00', '12:00', '11:00', '17:00')
      ).toBe(true);

      // No overlap
      expect(
        ScheduleConflictService.timesOverlap('08:00', '12:00', '13:00', '17:00')
      ).toBe(false);

      // Adjacent times (no overlap)
      expect(
        ScheduleConflictService.timesOverlap('08:00', '12:00', '12:00', '17:00')
      ).toBe(false);
    });

    test('checkOverlappingShifts finds conflicting shifts on same date', async () => {
      const existingShift = await Schedule.create({
        driver: testDriver._id,
        startTime: new Date('2025-12-15T08:00:00Z'),
        endTime: new Date('2025-12-15T17:00:00Z'),
        status: 'scheduled'
      });

      const conflictingShift = {
        startTime: new Date('2025-12-15T12:00:00Z'),
        endTime: new Date('2025-12-15T20:00:00Z')
      };

      const conflicts = await ScheduleConflictService.checkOverlappingShifts(
        testDriver._id,
        '2025-12-15',
        null
      );

      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].type).toBe('overlapping_shift');
    });

    test('checkOverlappingShifts ignores shift being updated', async () => {
      const existingShift = await Schedule.create({
        driver: testDriver._id,
        startTime: new Date('2025-12-15T08:00:00Z'),
        endTime: new Date('2025-12-15T17:00:00Z'),
        status: 'scheduled'
      });

      const conflicts = await ScheduleConflictService.checkOverlappingShifts(
        testDriver._id,
        '2025-12-15',
        existingShift._id // Should be excluded from conflict check
      );

      expect(conflicts.length).toBe(0);
    });
  });

  // ============================================
  // Break Time Tests
  // ============================================

  describe('Break Time Enforcement', () => {
    test('checkBreakTimeConflicts detects insufficient rest', async () => {
      const existingShift = await Schedule.create({
        driver: testDriver._id,
        startTime: new Date('2025-12-15T08:00:00Z'),
        endTime: new Date('2025-12-15T17:00:00Z'),
        status: 'scheduled'
      });

      const shortBreakShift = {
        startTime: new Date('2025-12-15T23:00:00Z'), // Only 6 hours break
        endTime: new Date('2025-12-16T08:00:00Z')
      };

      const conflicts = await ScheduleConflictService.checkBreakTimeConflicts(
        testDriver._id,
        shortBreakShift,
        11 // 11 hour minimum
      );

      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].type).toBe('insufficient_break');
    });

    test('checkBreakTimeConflicts allows sufficient rest', async () => {
      const existingShift = await Schedule.create({
        driver: testDriver._id,
        startTime: new Date('2025-12-15T08:00:00Z'),
        endTime: new Date('2025-12-15T17:00:00Z'),
        status: 'scheduled'
      });

      const goodBreakShift = {
        startTime: new Date('2025-12-16T05:00:00Z'), // 12 hours break
        endTime: new Date('2025-12-16T14:00:00Z')
      };

      const conflicts = await ScheduleConflictService.checkBreakTimeConflicts(
        testDriver._id,
        goodBreakShift,
        11
      );

      expect(conflicts.length).toBe(0);
    });
  });

  // ============================================
  // Weekly Hours Tests
  // ============================================

  describe('Weekly Hours Limits', () => {
    test('checkMaxHoursPerWeek detects exceeded limits', async () => {
      // Create multiple shifts totaling 45+ hours
      const shifts = [
        { startTime: new Date('2025-12-15T08:00:00Z'), endTime: new Date('2025-12-15T17:00:00Z') },
        { startTime: new Date('2025-12-16T08:00:00Z'), endTime: new Date('2025-12-16T17:00:00Z') },
        { startTime: new Date('2025-12-17T08:00:00Z'), endTime: new Date('2025-12-17T17:00:00Z') },
        { startTime: new Date('2025-12-18T08:00:00Z'), endTime: new Date('2025-12-18T17:00:00Z') },
        { startTime: new Date('2025-12-19T08:00:00Z'), endTime: new Date('2025-12-19T17:00:00Z') }
      ];

      for (const shift of shifts) {
        await Schedule.create({
          driver: testDriver._id,
          startTime: shift.startTime,
          endTime: shift.endTime,
          status: 'scheduled'
        });
      }

      // Try to add another 9-hour shift (would exceed 60 hour limit)
      const newShift = {
        startTime: new Date('2025-12-20T08:00:00Z'),
        endTime: new Date('2025-12-20T17:00:00Z')
      };

      const conflicts = await ScheduleConflictService.checkMaxHoursPerWeek(
        testDriver._id,
        newShift,
        60
      );

      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].type).toBe('max_hours_exceeded');
    });
  });

  // ============================================
  // Time-Off Conflict Tests
  // ============================================

  describe('Time-Off Conflict Detection', () => {
    test('checkTimeOffConflicts detects schedule during approved time-off', async () => {
      const approvedTimeOff = await TimeOff.create({
        driver: testDriver._id,
        type: 'vacation',
        startDate: new Date('2025-12-20'),
        endDate: new Date('2025-12-25'),
        status: 'approved'
      });

      const newShift = {
        startTime: new Date('2025-12-22T08:00:00Z'),
        endTime: new Date('2025-12-22T17:00:00Z')
      };

      const conflicts = await ScheduleConflictService.checkTimeOffConflicts(
        testDriver._id,
        newShift
      );

      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].type).toBe('time_off_conflict');
    });

    test('checkTimeOffConflicts ignores pending time-off', async () => {
      const pendingTimeOff = await TimeOff.create({
        driver: testDriver._id,
        type: 'vacation',
        startDate: new Date('2025-12-20'),
        endDate: new Date('2025-12-25'),
        status: 'pending' // Not yet approved
      });

      const newShift = {
        startTime: new Date('2025-12-22T08:00:00Z'),
        endTime: new Date('2025-12-22T17:00:00Z')
      };

      const conflicts = await ScheduleConflictService.checkTimeOffConflicts(
        testDriver._id,
        newShift
      );

      expect(conflicts.length).toBe(0);
    });
  });

  // ============================================
  // Alternative Driver Tests
  // ============================================

  describe('Alternative Driver Suggestions', () => {
    test('findAlternativeDrivers suggests drivers with no conflicts', async () => {
      // Create a shift with conflict for testDriver
      const conflictingShift = await Schedule.create({
        driver: testDriver._id,
        startTime: new Date('2025-12-15T08:00:00Z'),
        endTime: new Date('2025-12-15T17:00:00Z'),
        status: 'scheduled'
      });

      // testDriver2 has no conflicts
      const newShift = {
        startTime: new Date('2025-12-15T08:00:00Z'),
        endTime: new Date('2025-12-15T17:00:00Z')
      };

      const alternatives = await ScheduleConflictService.findAlternativeDrivers(
        testDriver._id,
        newShift,
        5
      );

      expect(alternatives.length).toBeGreaterThan(0);
      expect(alternatives.some(d => d._id.equals(testDriver2._id))).toBe(true);
    });

    test('findAlternativeDrivers excludes drivers with conflicts', async () => {
      // Give testDriver2 a conflicting shift
      await Schedule.create({
        driver: testDriver2._id,
        startTime: new Date('2025-12-15T08:00:00Z'),
        endTime: new Date('2025-12-15T17:00:00Z'),
        status: 'scheduled'
      });

      const newShift = {
        startTime: new Date('2025-12-15T08:00:00Z'),
        endTime: new Date('2025-12-15T17:00:00Z')
      };

      const alternatives = await ScheduleConflictService.findAlternativeDrivers(
        testDriver._id,
        newShift,
        5
      );

      expect(
        alternatives.every(d => !d._id.equals(testDriver2._id))
      ).toBe(true);
    });
  });

  // ============================================
  // Available Time Slots Tests
  // ============================================

  describe('Available Time Slot Calculation', () => {
    test('getAvailableTimeSlots finds gaps in schedule', async () => {
      // Create a shift from 08:00-12:00
      await Schedule.create({
        driver: testDriver._id,
        startTime: new Date('2025-12-15T08:00:00Z'),
        endTime: new Date('2025-12-15T12:00:00Z'),
        status: 'scheduled'
      });

      // Create a shift from 14:00-18:00
      await Schedule.create({
        driver: testDriver._id,
        startTime: new Date('2025-12-15T14:00:00Z'),
        endTime: new Date('2025-12-15T18:00:00Z'),
        status: 'scheduled'
      });

      const availableSlots = await ScheduleConflictService.getAvailableTimeSlots(
        testDriver._id,
        '2025-12-15',
        480 // 8 hour slot
      );

      // Should find slots like 12:00-20:00
      expect(availableSlots.length).toBeGreaterThan(0);
    });

    test('getAvailableTimeSlots respects break time requirements', async () => {
      // Create an evening shift
      await Schedule.create({
        driver: testDriver._id,
        startTime: new Date('2025-12-15T17:00:00Z'),
        endTime: new Date('2025-12-16T02:00:00Z'),
        status: 'scheduled'
      });

      const availableSlots = await ScheduleConflictService.getAvailableTimeSlots(
        testDriver._id,
        '2025-12-16',
        480
      );

      // Should not suggest slots before 13:00 (11 hour break)
      const earlySlots = availableSlots.filter(slot => {
        const hour = new Date(slot.startTime).getHours();
        return hour < 13;
      });

      expect(earlySlots.length).toBe(0);
    });
  });

  // ============================================
  // Comprehensive Conflict Check Tests
  // ============================================

  describe('Comprehensive Conflict Checking', () => {
    test('checkAllConflicts returns aggregated conflicts', async () => {
      // Create multiple conflict scenarios
      await Schedule.create({
        driver: testDriver._id,
        startTime: new Date('2025-12-15T08:00:00Z'),
        endTime: new Date('2025-12-15T17:00:00Z'),
        status: 'scheduled'
      });

      const newShift = {
        startTime: new Date('2025-12-15T09:00:00Z'),
        endTime: new Date('2025-12-15T18:00:00Z')
      };

      const report = await ScheduleConflictService.checkAllConflicts(
        testDriver._id,
        newShift
      );

      expect(report).toHaveProperty('hasConflicts');
      expect(report).toHaveProperty('conflicts');
      expect(Array.isArray(report.conflicts)).toBe(true);

      if (report.hasConflicts) {
        expect(report.conflicts.length).toBeGreaterThan(0);
        expect(report.conflicts[0]).toHaveProperty('type');
        expect(report.conflicts[0]).toHaveProperty('severity');
        expect(report.conflicts[0]).toHaveProperty('description');
      }
    });

    test('checkAllConflicts returns empty when no conflicts', async () => {
      const newShift = {
        startTime: new Date('2025-12-20T08:00:00Z'),
        endTime: new Date('2025-12-20T17:00:00Z')
      };

      const report = await ScheduleConflictService.checkAllConflicts(
        testDriver._id,
        newShift
      );

      expect(report.hasConflicts).toBe(false);
      expect(report.conflicts.length).toBe(0);
    });
  });
});
