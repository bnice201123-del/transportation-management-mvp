import VehicleAssignment from '../models/VehicleAssignment.js';
import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';
import Trip from '../models/Trip.js';
import DriverPreference from '../models/DriverPreference.js';
import MaintenanceSchedule from '../models/MaintenanceSchedule.js';
import ActivityLog from '../models/ActivityLog.js';

/**
 * VehicleAssignmentService
 * Intelligent vehicle assignment optimization and management
 */

class VehicleAssignmentService {
  /**
   * Find optimal vehicle for a trip using multi-criteria optimization
   */
  async findOptimalVehicle(tripRequirements, options = {}) {
    try {
      const {
        preferredDriver = null,
        excludeVehicles = [],
        prioritizeProximity = true,
        prioritizeCost = false,
        allowOverride = false
      } = options;

      // Get all available vehicles
      const availableVehicles = await this.getAvailableVehicles(
        tripRequirements.startDate,
        tripRequirements.endDate,
        tripRequirements,
        excludeVehicles
      );

      if (availableVehicles.length === 0) {
        return { success: false, message: 'No available vehicles found' };
      }

      // Score each vehicle
      const scoredVehicles = [];
      for (const vehicle of availableVehicles) {
        const scores = await this.calculateVehicleScore(
          vehicle,
          tripRequirements,
          preferredDriver,
          { prioritizeProximity, prioritizeCost }
        );

        scoredVehicles.push({
          vehicle,
          scores,
          overallScore: scores.overall
        });
      }

      // Sort by overall score
      scoredVehicles.sort((a, b) => b.overallScore - a.overallScore);

      return {
        success: true,
        optimalVehicle: scoredVehicles[0],
        alternatives: scoredVehicles.slice(1, 5), // Top 5 alternatives
        allOptions: scoredVehicles
      };
    } catch (error) {
      throw new Error(`Failed to find optimal vehicle: ${error.message}`);
    }
  }

  /**
   * Get available vehicles for a time period
   */
  async getAvailableVehicles(startDate, endDate, requirements = {}, excludeVehicles = []) {
    try {
      // Build base query
      const query = {
        status: { $in: ['active', 'idle'] },
        _id: { $nin: excludeVehicles }
      };

      // Apply requirement filters
      if (requirements.wheelchairAccessible) {
        query.isWheelchairAccessible = true;
      }
      if (requirements.passengerCapacity) {
        query.capacity = { $gte: requirements.passengerCapacity };
      }
      if (requirements.fuelType) {
        query.fuelType = requirements.fuelType;
      }
      if (requirements.vehicleType) {
        query.vehicleType = requirements.vehicleType;
      }

      // Get vehicles matching requirements
      let vehicles = await Vehicle.find(query);

      // Filter out vehicles with conflicting assignments
      const conflictingAssignments = await VehicleAssignment.find({
        status: { $in: ['pending', 'active'] },
        $or: [
          {
            startDate: { $lte: endDate },
            endDate: { $gte: startDate }
          },
          {
            startDate: { $lte: endDate },
            endDate: null
          }
        ]
      }).distinct('vehicle');

      vehicles = vehicles.filter(v => 
        !conflictingAssignments.some(id => id.toString() === v._id.toString())
      );

      // Filter out vehicles with scheduled maintenance
      const maintenanceDue = await MaintenanceSchedule.find({
        'nextDue.date': {
          $gte: startDate,
          $lte: endDate
        },
        status: 'scheduled',
        isActive: true
      }).distinct('vehicle');

      vehicles = vehicles.filter(v =>
        !maintenanceDue.some(id => id.toString() === v._id.toString())
      );

      return vehicles;
    } catch (error) {
      throw new Error(`Failed to get available vehicles: ${error.message}`);
    }
  }

  /**
   * Calculate multi-criteria score for a vehicle
   */
  async calculateVehicleScore(vehicle, requirements, preferredDriver = null, options = {}) {
    const scores = {
      overall: 0,
      driverPreference: 0,
      vehicleUtilization: 0,
      proximityScore: 0,
      availabilityScore: 100, // Already filtered for availability
      maintenanceScore: 0,
      fuelEfficiency: 0,
      equipmentMatch: 0,
      costEfficiency: 0
    };

    const weights = {
      driverPreference: options.preferredDriver ? 20 : 0,
      vehicleUtilization: 15,
      proximityScore: options.prioritizeProximity ? 25 : 10,
      availabilityScore: 10,
      maintenanceScore: 10,
      fuelEfficiency: 10,
      equipmentMatch: 15,
      costEfficiency: options.prioritizeCost ? 20 : 10
    };

    // 1. Driver Preference Score
    if (preferredDriver) {
      const driverPref = await DriverPreference.findOne({ driver: preferredDriver });
      if (driverPref && driverPref.vehiclePreferences) {
        const vehiclePref = driverPref.vehiclePreferences.preferredVehicles.find(
          pv => pv.vehicle.toString() === vehicle._id.toString()
        );
        if (vehiclePref) {
          scores.driverPreference = 100;
        } else if (driverPref.vehiclePreferences.avoidVehicles.includes(vehicle._id.toString())) {
          scores.driverPreference = 0;
        } else {
          scores.driverPreference = 50;
        }
      } else {
        scores.driverPreference = 50;
      }
    }

    // 2. Vehicle Utilization Score (prefer underutilized vehicles)
    if (vehicle.utilizationMetrics && vehicle.utilizationMetrics.utilizationRate) {
      const utilizationRate = vehicle.utilizationMetrics.utilizationRate;
      // Prefer vehicles with 40-60% utilization (balanced)
      if (utilizationRate >= 40 && utilizationRate <= 60) {
        scores.vehicleUtilization = 100;
      } else if (utilizationRate < 40) {
        scores.vehicleUtilization = 80; // Underutilized, good to use
      } else if (utilizationRate > 60 && utilizationRate <= 80) {
        scores.vehicleUtilization = 60;
      } else {
        scores.vehicleUtilization = 40; // Over-utilized
      }
    } else {
      scores.vehicleUtilization = 70; // No data, assume moderate
    }

    // 3. Proximity Score
    if (requirements.pickupLocation && vehicle.currentLocation) {
      const distance = this.calculateDistance(
        requirements.pickupLocation.coordinates,
        vehicle.currentLocation.coordinates
      );
      
      // Score based on distance (miles)
      if (distance <= 5) scores.proximityScore = 100;
      else if (distance <= 10) scores.proximityScore = 80;
      else if (distance <= 20) scores.proximityScore = 60;
      else if (distance <= 50) scores.proximityScore = 40;
      else scores.proximityScore = 20;
    } else {
      scores.proximityScore = 50; // No location data
    }

    // 4. Maintenance Score
    const daysSinceService = vehicle.lastServiceDate
      ? Math.floor((new Date() - new Date(vehicle.lastServiceDate)) / (1000 * 60 * 60 * 24))
      : 999;
    
    const daysUntilService = vehicle.nextServiceDate
      ? Math.floor((new Date(vehicle.nextServiceDate) - new Date()) / (1000 * 60 * 60 * 24))
      : 999;

    if (daysUntilService < 0) {
      scores.maintenanceScore = 20; // Overdue service
    } else if (daysUntilService <= 7) {
      scores.maintenanceScore = 40; // Service due soon
    } else if (daysUntilService <= 30) {
      scores.maintenanceScore = 70; // Service due within month
    } else {
      scores.maintenanceScore = 100; // Good maintenance status
    }

    // 5. Fuel Efficiency Score
    if (requirements.estimatedDistance && vehicle.fuelType) {
      const avgMPG = this.getAverageMPG(vehicle.vehicleType, vehicle.fuelType);
      const estimatedFuelCost = (requirements.estimatedDistance / avgMPG) * 3.50; // Assume $3.50/gallon
      
      // Score based on estimated fuel cost
      if (estimatedFuelCost <= 20) scores.fuelEfficiency = 100;
      else if (estimatedFuelCost <= 40) scores.fuelEfficiency = 80;
      else if (estimatedFuelCost <= 60) scores.fuelEfficiency = 60;
      else scores.fuelEfficiency = 40;
    } else {
      scores.fuelEfficiency = 70;
    }

    // 6. Equipment Match Score
    let equipmentMatches = 0;
    let equipmentRequired = 0;

    if (requirements.wheelchairAccessible) {
      equipmentRequired++;
      if (vehicle.isWheelchairAccessible) equipmentMatches++;
    }
    if (requirements.specialEquipment) {
      requirements.specialEquipment.forEach(equipment => {
        equipmentRequired++;
        if (vehicle.features && vehicle.features.includes(equipment)) {
          equipmentMatches++;
        }
      });
    }

    scores.equipmentMatch = equipmentRequired > 0
      ? (equipmentMatches / equipmentRequired) * 100
      : 100;

    // 7. Cost Efficiency Score
    const estimatedCostPerMile = this.estimateCostPerMile(vehicle);
    const estimatedTotalCost = requirements.estimatedDistance
      ? estimatedCostPerMile * requirements.estimatedDistance
      : estimatedCostPerMile * 50; // Default 50 miles

    if (estimatedTotalCost <= 50) scores.costEfficiency = 100;
    else if (estimatedTotalCost <= 100) scores.costEfficiency = 80;
    else if (estimatedTotalCost <= 150) scores.costEfficiency = 60;
    else scores.costEfficiency = 40;

    // Calculate weighted overall score
    let totalWeight = 0;
    scores.overall = 0;

    Object.keys(weights).forEach(key => {
      scores.overall += scores[key] * (weights[key] / 100);
      totalWeight += weights[key];
    });

    scores.overall = (scores.overall / totalWeight) * 100;

    return scores;
  }

  /**
   * Create vehicle assignment
   */
  async createAssignment(assignmentData, assignedBy) {
    try {
      // Validate vehicle availability
      const isAvailable = await this.checkVehicleAvailability(
        assignmentData.vehicle,
        assignmentData.startDate,
        assignmentData.endDate
      );

      if (!isAvailable.available) {
        throw new Error(`Vehicle not available: ${isAvailable.reason}`);
      }

      // Calculate match scores if not provided
      if (!assignmentData.matchScores && assignmentData.trip) {
        const trip = await Trip.findById(assignmentData.trip);
        if (trip) {
          const vehicle = await Vehicle.findById(assignmentData.vehicle);
          const scores = await this.calculateVehicleScore(vehicle, {
            pickupLocation: trip.pickup,
            passengerCapacity: trip.passengerCount,
            wheelchairAccessible: trip.requiresWheelchair,
            estimatedDistance: trip.estimatedDistance
          }, assignmentData.driver);
          
          assignmentData.matchScores = scores;
        }
      }

      const assignment = new VehicleAssignment({
        ...assignmentData,
        assignedBy,
        changeHistory: [{
          changeType: 'created',
          changedBy: assignedBy
        }]
      });

      await assignment.save();

      // Update vehicle status
      await Vehicle.findByIdAndUpdate(assignmentData.vehicle, {
        currentDriver: assignmentData.driver,
        assignedDate: assignmentData.assignedDate,
        status: 'active'
      });

      // Log activity
      await ActivityLog.create({
        user: assignedBy,
        action: 'vehicle_assignment_created',
        target: 'VehicleAssignment',
        targetId: assignment._id,
        details: `Assigned vehicle to ${assignmentData.assignmentType} assignment`,
        metadata: {
          assignmentId: assignment.assignmentId,
          vehicleId: assignmentData.vehicle,
          driverId: assignmentData.driver,
          tripId: assignmentData.trip
        }
      });

      return assignment;
    } catch (error) {
      throw new Error(`Failed to create assignment: ${error.message}`);
    }
  }

  /**
   * Auto-assign vehicle to trip
   */
  async autoAssignVehicle(tripId, assignedBy, options = {}) {
    try {
      const trip = await Trip.findById(tripId).populate('assignedDriver');
      if (!trip) {
        throw new Error('Trip not found');
      }

      const requirements = {
        startDate: trip.scheduledPickupTime,
        endDate: trip.estimatedDropoffTime,
        pickupLocation: trip.pickup,
        passengerCapacity: trip.passengerCount,
        wheelchairAccessible: trip.requiresWheelchair,
        estimatedDistance: trip.estimatedDistance
      };

      const result = await this.findOptimalVehicle(requirements, {
        preferredDriver: trip.assignedDriver?._id,
        ...options
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      const assignment = await this.createAssignment({
        vehicle: result.optimalVehicle.vehicle._id,
        driver: trip.assignedDriver?._id,
        trip: tripId,
        assignmentType: 'trip_based',
        startDate: requirements.startDate,
        endDate: requirements.endDate,
        matchScores: result.optimalVehicle.scores,
        assignmentReason: 'optimal_match',
        isAutomated: true,
        automationScore: result.optimalVehicle.overallScore,
        requirements: {
          wheelchairAccessible: requirements.wheelchairAccessible,
          passengerCapacity: requirements.passengerCapacity
        },
        locations: {
          startLocation: trip.pickup.location,
          endLocation: trip.dropoff.location
        },
        utilization: {
          plannedMileage: trip.estimatedDistance,
          passengerCount: trip.passengerCount
        }
      }, assignedBy);

      // Update trip with assigned vehicle
      trip.assignedVehicle = result.optimalVehicle.vehicle._id;
      await trip.save();

      return {
        assignment,
        vehicle: result.optimalVehicle.vehicle,
        matchScore: result.optimalVehicle.overallScore,
        alternatives: result.alternatives
      };
    } catch (error) {
      throw new Error(`Failed to auto-assign vehicle: ${error.message}`);
    }
  }

  /**
   * Check vehicle availability
   */
  async checkVehicleAvailability(vehicleId, startDate, endDate) {
    try {
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        return { available: false, reason: 'Vehicle not found' };
      }

      if (vehicle.status === 'maintenance' || vehicle.status === 'out-of-service') {
        return { available: false, reason: `Vehicle status: ${vehicle.status}` };
      }

      // Check for conflicting assignments
      const conflictingAssignment = await VehicleAssignment.findOne({
        vehicle: vehicleId,
        status: { $in: ['pending', 'active'] },
        $or: [
          {
            startDate: { $lte: endDate },
            endDate: { $gte: startDate }
          },
          {
            startDate: { $lte: endDate },
            endDate: null
          }
        ]
      });

      if (conflictingAssignment) {
        return { available: false, reason: 'Vehicle has conflicting assignment', assignment: conflictingAssignment };
      }

      // Check for scheduled maintenance
      const maintenanceSchedule = await MaintenanceSchedule.findOne({
        vehicle: vehicleId,
        'nextDue.date': {
          $gte: startDate,
          $lte: endDate
        },
        status: 'scheduled',
        isActive: true
      });

      if (maintenanceSchedule) {
        return { available: false, reason: 'Maintenance scheduled during this period', schedule: maintenanceSchedule };
      }

      return { available: true };
    } catch (error) {
      throw new Error(`Failed to check availability: ${error.message}`);
    }
  }

  /**
   * Get utilization analytics for vehicles
   */
  async getUtilizationAnalytics(vehicleIds = null, startDate, endDate) {
    try {
      const query = {
        status: { $in: ['active', 'completed'] },
        startDate: { $gte: startDate, $lte: endDate }
      };

      if (vehicleIds && vehicleIds.length > 0) {
        query.vehicle = { $in: vehicleIds };
      }

      const assignments = await VehicleAssignment.find(query)
        .populate('vehicle', 'make model licensePlate');

      const analytics = {
        totalAssignments: assignments.length,
        totalMiles: 0,
        totalHours: 0,
        totalCost: 0,
        averageCostPerMile: 0,
        averageCostPerHour: 0,
        averageUtilization: 0,
        byVehicle: {},
        byType: {},
        utilizationDistribution: {
          underutilized: 0, // <40%
          optimal: 0, // 40-70%
          overutilized: 0 // >70%
        }
      };

      assignments.forEach(assignment => {
        // Aggregate totals
        analytics.totalMiles += assignment.utilization.actualMileage || 0;
        analytics.totalHours += assignment.utilization.actualHours || 0;
        analytics.totalCost += assignment.costs.totalActualCost || 0;

        // By vehicle
        const vehicleKey = assignment.vehicle._id.toString();
        if (!analytics.byVehicle[vehicleKey]) {
          analytics.byVehicle[vehicleKey] = {
            vehicle: assignment.vehicle,
            assignments: 0,
            totalMiles: 0,
            totalHours: 0,
            totalCost: 0,
            averageUtilization: 0
          };
        }
        analytics.byVehicle[vehicleKey].assignments++;
        analytics.byVehicle[vehicleKey].totalMiles += assignment.utilization.actualMileage || 0;
        analytics.byVehicle[vehicleKey].totalHours += assignment.utilization.actualHours || 0;
        analytics.byVehicle[vehicleKey].totalCost += assignment.costs.totalActualCost || 0;

        // Utilization distribution
        const utilization = assignment.utilization.capacityUtilization || 0;
        if (utilization < 40) analytics.utilizationDistribution.underutilized++;
        else if (utilization <= 70) analytics.utilizationDistribution.optimal++;
        else analytics.utilizationDistribution.overutilized++;
      });

      // Calculate averages
      if (analytics.totalMiles > 0) {
        analytics.averageCostPerMile = analytics.totalCost / analytics.totalMiles;
      }
      if (analytics.totalHours > 0) {
        analytics.averageCostPerHour = analytics.totalCost / analytics.totalHours;
      }

      return analytics;
    } catch (error) {
      throw new Error(`Failed to get utilization analytics: ${error.message}`);
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(coords1, coords2) {
    const [lon1, lat1] = coords1;
    const [lon2, lat2] = coords2;

    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return distance;
  }

  /**
   * Estimate average MPG based on vehicle type
   */
  getAverageMPG(vehicleType, fuelType) {
    const mpgTable = {
      sedan: { gasoline: 30, diesel: 35, electric: 100, hybrid: 45 },
      suv: { gasoline: 22, diesel: 28, electric: 80, hybrid: 35 },
      van: { gasoline: 18, diesel: 22, electric: 60, hybrid: 28 },
      bus: { gasoline: 10, diesel: 12, electric: 40, hybrid: 15 },
      truck: { gasoline: 16, diesel: 20, electric: 50, hybrid: 22 }
    };

    return mpgTable[vehicleType]?.[fuelType] || 20;
  }

  /**
   * Estimate cost per mile
   */
  estimateCostPerMile(vehicle) {
    // Base cost factors
    const fuelCostPerMile = 3.50 / this.getAverageMPG(vehicle.vehicleType, vehicle.fuelType);
    const maintenanceCostPerMile = 0.10; // $0.10/mile average
    const depreciationCostPerMile = 0.15; // $0.15/mile average
    
    return fuelCostPerMile + maintenanceCostPerMile + depreciationCostPerMile;
  }
}

export default new VehicleAssignmentService();
