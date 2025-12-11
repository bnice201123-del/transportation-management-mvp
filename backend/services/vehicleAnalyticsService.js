import Vehicle from '../models/Vehicle.js';
import VehicleAssignment from '../models/VehicleAssignment.js';
import MaintenanceSchedule from '../models/MaintenanceSchedule.js';
import MaintenanceRecord from '../models/MaintenanceRecord.js';
import Trip from '../models/Trip.js';
import VehicleTelematics from '../models/VehicleTelematics.js';

/**
 * VehicleAnalyticsService
 * Advanced analytics for vehicle performance, downtime, and fleet optimization
 */

class VehicleAnalyticsService {
  /**
   * Calculate comprehensive downtime analytics
   */
  async getDowntimeAnalytics(vehicleId = null, startDate, endDate) {
    try {
      const query = vehicleId ? { _id: vehicleId } : {};
      const vehicles = await Vehicle.find(query);

      const analytics = {
        totalVehicles: vehicles.length,
        totalDowntimeHours: 0,
        totalDowntimeCost: 0,
        averageDowntimePerVehicle: 0,
        downtimeByReason: {},
        downtimeByVehicle: {},
        downtimeTrend: []
      };

      for (const vehicle of vehicles) {
        const vehicleDowntime = await this.calculateVehicleDowntime(
          vehicle._id,
          startDate,
          endDate
        );

        const vehicleKey = vehicle._id.toString();
        analytics.downtimeByVehicle[vehicleKey] = {
          vehicle: {
            id: vehicle._id,
            make: vehicle.make,
            model: vehicle.model,
            licensePlate: vehicle.licensePlate
          },
          ...vehicleDowntime
        };

        analytics.totalDowntimeHours += vehicleDowntime.totalHours;
        analytics.totalDowntimeCost += vehicleDowntime.estimatedCost;

        // Aggregate by reason
        Object.keys(vehicleDowntime.byReason).forEach(reason => {
          if (!analytics.downtimeByReason[reason]) {
            analytics.downtimeByReason[reason] = {
              hours: 0,
              incidents: 0,
              cost: 0
            };
          }
          analytics.downtimeByReason[reason].hours += vehicleDowntime.byReason[reason].hours;
          analytics.downtimeByReason[reason].incidents += vehicleDowntime.byReason[reason].incidents;
          analytics.downtimeByReason[reason].cost += vehicleDowntime.byReason[reason].cost;
        });
      }

      if (vehicles.length > 0) {
        analytics.averageDowntimePerVehicle = analytics.totalDowntimeHours / vehicles.length;
      }

      // Calculate downtime trend by day
      analytics.downtimeTrend = await this.calculateDowntimeTrend(startDate, endDate, vehicleId);

      return analytics;
    } catch (error) {
      throw new Error(`Failed to get downtime analytics: ${error.message}`);
    }
  }

  /**
   * Calculate downtime for a specific vehicle
   */
  async calculateVehicleDowntime(vehicleId, startDate, endDate) {
    const downtime = {
      totalHours: 0,
      estimatedCost: 0,
      byReason: {
        maintenance: { hours: 0, incidents: 0, cost: 0 },
        repair: { hours: 0, incidents: 0, cost: 0 },
        inspection: { hours: 0, incidents: 0, cost: 0 },
        accident: { hours: 0, incidents: 0, cost: 0 },
        unavailable: { hours: 0, incidents: 0, cost: 0 },
        other: { hours: 0, incidents: 0, cost: 0 }
      },
      periods: []
    };

    // Get maintenance records in period
    const maintenanceRecords = await MaintenanceRecord.find({
      vehicle: vehicleId,
      startDate: { $gte: startDate, $lte: endDate },
      status: { $in: ['completed', 'in_progress'] }
    });

    maintenanceRecords.forEach(record => {
      const hours = record.laborHours || 0;
      const cost = record.cost?.total || 0;
      
      let reason = 'maintenance';
      if (record.type === 'repair') reason = 'repair';
      else if (record.type === 'inspection') reason = 'inspection';

      downtime.totalHours += hours;
      downtime.estimatedCost += cost;
      downtime.byReason[reason].hours += hours;
      downtime.byReason[reason].incidents++;
      downtime.byReason[reason].cost += cost;

      downtime.periods.push({
        startDate: record.startDate,
        endDate: record.completedDate || new Date(),
        hours,
        reason,
        description: record.description,
        cost
      });
    });

    // Get accident-related downtime from vehicle incidents
    const vehicle = await Vehicle.findById(vehicleId);
    if (vehicle && vehicle.incidents) {
      vehicle.incidents.forEach(incident => {
        if (incident.date >= startDate && incident.date <= endDate) {
          // Estimate downtime based on severity
          let estimatedHours = 0;
          switch (incident.severity) {
            case 'minor': estimatedHours = 4; break;
            case 'moderate': estimatedHours = 24; break;
            case 'major': estimatedHours = 72; break;
            case 'total-loss': estimatedHours = 720; break; // 30 days
          }

          const cost = incident.actualCost || incident.estimatedCost || 0;

          downtime.totalHours += estimatedHours;
          downtime.estimatedCost += cost;
          downtime.byReason.accident.hours += estimatedHours;
          downtime.byReason.accident.incidents++;
          downtime.byReason.accident.cost += cost;

          downtime.periods.push({
            startDate: incident.date,
            endDate: incident.resolvedDate || new Date(incident.date.getTime() + estimatedHours * 60 * 60 * 1000),
            hours: estimatedHours,
            reason: 'accident',
            description: incident.description,
            cost
          });
        }
      });
    }

    // Calculate opportunity cost (revenue lost during downtime)
    const costPerHour = 25; // Estimated revenue per vehicle hour
    downtime.estimatedCost += downtime.totalHours * costPerHour;

    return downtime;
  }

  /**
   * Calculate downtime trend over time
   */
  async calculateDowntimeTrend(startDate, endDate, vehicleId = null) {
    const trend = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayDowntime = await this.getDowntimeAnalytics(
        vehicleId,
        currentDate,
        nextDate
      );

      trend.push({
        date: new Date(currentDate),
        totalHours: dayDowntime.totalDowntimeHours,
        totalCost: dayDowntime.totalDowntimeCost,
        byReason: dayDowntime.downtimeByReason
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return trend;
  }

  /**
   * Get fuel consumption analytics
   */
  async getFuelAnalytics(vehicleId = null, startDate, endDate) {
    try {
      const query = vehicleId ? { _id: vehicleId } : {};
      const vehicles = await Vehicle.find(query);

      const analytics = {
        totalVehicles: vehicles.length,
        totalFuelConsumed: 0,
        totalFuelCost: 0,
        averageMPG: 0,
        totalMilesDriven: 0,
        averageCostPerMile: 0,
        byVehicle: {},
        fuelEfficiencyTrend: [],
        costTrend: []
      };

      for (const vehicle of vehicles) {
        const fuelData = await this.calculateVehicleFuelConsumption(
          vehicle._id,
          startDate,
          endDate
        );

        const vehicleKey = vehicle._id.toString();
        analytics.byVehicle[vehicleKey] = {
          vehicle: {
            id: vehicle._id,
            make: vehicle.make,
            model: vehicle.model,
            licensePlate: vehicle.licensePlate
          },
          ...fuelData
        };

        analytics.totalFuelConsumed += fuelData.totalFuel;
        analytics.totalFuelCost += fuelData.totalCost;
        analytics.totalMilesDriven += fuelData.totalMiles;
      }

      // Calculate averages
      if (analytics.totalFuelConsumed > 0) {
        analytics.averageMPG = analytics.totalMilesDriven / analytics.totalFuelConsumed;
      }
      if (analytics.totalMilesDriven > 0) {
        analytics.averageCostPerMile = analytics.totalFuelCost / analytics.totalMilesDriven;
      }

      return analytics;
    } catch (error) {
      throw new Error(`Failed to get fuel analytics: ${error.message}`);
    }
  }

  /**
   * Calculate fuel consumption for specific vehicle
   */
  async calculateVehicleFuelConsumption(vehicleId, startDate, endDate) {
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    const fuelData = {
      totalFuel: 0,
      totalCost: 0,
      totalMiles: 0,
      averageMPG: 0,
      averageCostPerGallon: 0,
      fuelLogs: []
    };

    // Get fuel logs from vehicle
    if (vehicle.fuelLogs) {
      const relevantLogs = vehicle.fuelLogs.filter(log => 
        log.date >= startDate && log.date <= endDate
      );

      relevantLogs.forEach(log => {
        fuelData.totalFuel += log.gallons || 0;
        fuelData.totalCost += log.totalCost || 0;
        
        if (log.mileage && fuelData.fuelLogs.length > 0) {
          const lastLog = fuelData.fuelLogs[fuelData.fuelLogs.length - 1];
          const miles = log.mileage - lastLog.mileage;
          fuelData.totalMiles += miles;
        }

        fuelData.fuelLogs.push(log);
      });
    }

    // Get fuel data from assignments
    const assignments = await VehicleAssignment.find({
      vehicle: vehicleId,
      startDate: { $gte: startDate, $lte: endDate },
      status: 'completed'
    });

    assignments.forEach(assignment => {
      if (assignment.fuel) {
        fuelData.totalFuel += assignment.fuel.fuelConsumed || 0;
        fuelData.totalCost += assignment.fuel.fuelCost || 0;
        fuelData.totalMiles += assignment.mileage.totalMiles || 0;
      }
    });

    // Calculate averages
    if (fuelData.totalFuel > 0) {
      fuelData.averageMPG = fuelData.totalMiles / fuelData.totalFuel;
      fuelData.averageCostPerGallon = fuelData.totalCost / fuelData.totalFuel;
    }

    return fuelData;
  }

  /**
   * Get vehicle performance metrics
   */
  async getPerformanceMetrics(vehicleId, startDate, endDate) {
    try {
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        throw new Error('Vehicle not found');
      }

      const metrics = {
        vehicle: {
          id: vehicle._id,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          licensePlate: vehicle.licensePlate
        },
        utilization: {},
        reliability: {},
        costEfficiency: {},
        safety: {},
        maintenance: {}
      };

      // Utilization metrics
      const utilizationData = await this.calculateUtilizationMetrics(vehicleId, startDate, endDate);
      metrics.utilization = utilizationData;

      // Reliability metrics
      const reliabilityData = await this.calculateReliabilityMetrics(vehicleId, startDate, endDate);
      metrics.reliability = reliabilityData;

      // Cost efficiency
      const costData = await this.calculateCostEfficiency(vehicleId, startDate, endDate);
      metrics.costEfficiency = costData;

      // Safety metrics
      const safetyData = await this.calculateSafetyMetrics(vehicleId, startDate, endDate);
      metrics.safety = safetyData;

      // Maintenance metrics
      const maintenanceData = await this.calculateMaintenanceMetrics(vehicleId, startDate, endDate);
      metrics.maintenance = maintenanceData;

      return metrics;
    } catch (error) {
      throw new Error(`Failed to get performance metrics: ${error.message}`);
    }
  }

  /**
   * Calculate utilization metrics
   */
  async calculateUtilizationMetrics(vehicleId, startDate, endDate) {
    const assignments = await VehicleAssignment.find({
      vehicle: vehicleId,
      startDate: { $gte: startDate, $lte: endDate },
      status: { $in: ['active', 'completed'] }
    });

    const totalPeriodHours = (endDate - startDate) / (1000 * 60 * 60);
    let activeHours = 0;
    let totalMiles = 0;
    let totalRevenue = 0;

    assignments.forEach(assignment => {
      activeHours += assignment.utilization.actualHours || 0;
      totalMiles += assignment.utilization.actualMileage || 0;
      // Assume $2 per mile revenue
      totalRevenue += (assignment.utilization.actualMileage || 0) * 2;
    });

    return {
      utilizationRate: totalPeriodHours > 0 ? (activeHours / totalPeriodHours) * 100 : 0,
      activeHours,
      idleHours: totalPeriodHours - activeHours,
      totalMiles,
      averageMilesPerDay: totalMiles / Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
      totalAssignments: assignments.length,
      revenuePerHour: activeHours > 0 ? totalRevenue / activeHours : 0,
      revenuePerMile: totalMiles > 0 ? totalRevenue / totalMiles : 0
    };
  }

  /**
   * Calculate reliability metrics
   */
  async calculateReliabilityMetrics(vehicleId, startDate, endDate) {
    const vehicle = await Vehicle.findById(vehicleId);
    const assignments = await VehicleAssignment.find({
      vehicle: vehicleId,
      startDate: { $gte: startDate, $lte: endDate }
    });

    const maintenanceRecords = await MaintenanceRecord.find({
      vehicle: vehicleId,
      startDate: { $gte: startDate, $lte: endDate }
    });

    const totalAssignments = assignments.length;
    const completedOnTime = assignments.filter(a => 
      a.performance?.onTimeStart && a.performance?.onTimeEnd
    ).length;

    const breakdowns = maintenanceRecords.filter(r => 
      r.type === 'repair' && r.priority === 'urgent'
    ).length;

    const incidents = vehicle.incidents ? vehicle.incidents.filter(i =>
      i.date >= startDate && i.date <= endDate
    ).length : 0;

    return {
      onTimePercentage: totalAssignments > 0 ? (completedOnTime / totalAssignments) * 100 : 100,
      breakdownRate: breakdowns,
      meanTimeBetweenFailures: breakdowns > 0 ? 
        ((endDate - startDate) / (1000 * 60 * 60 * 24)) / breakdowns : 
        999,
      incidentRate: incidents,
      reliabilityScore: Math.max(0, 100 - (breakdowns * 10) - (incidents * 5))
    };
  }

  /**
   * Calculate cost efficiency
   */
  async calculateCostEfficiency(vehicleId, startDate, endDate) {
    const assignments = await VehicleAssignment.find({
      vehicle: vehicleId,
      startDate: { $gte: startDate, $lte: endDate },
      status: 'completed'
    });

    const maintenanceRecords = await MaintenanceRecord.find({
      vehicle: vehicleId,
      startDate: { $gte: startDate, $lte: endDate }
    });

    const fuelData = await this.calculateVehicleFuelConsumption(vehicleId, startDate, endDate);

    let totalCost = fuelData.totalCost;
    let maintenanceCost = 0;
    let totalMiles = fuelData.totalMiles;

    maintenanceRecords.forEach(record => {
      maintenanceCost += record.cost?.total || 0;
      totalCost += record.cost?.total || 0;
    });

    return {
      totalCost,
      fuelCost: fuelData.totalCost,
      maintenanceCost,
      costPerMile: totalMiles > 0 ? totalCost / totalMiles : 0,
      fuelCostPerMile: totalMiles > 0 ? fuelData.totalCost / totalMiles : 0,
      maintenanceCostPerMile: totalMiles > 0 ? maintenanceCost / totalMiles : 0,
      totalMiles
    };
  }

  /**
   * Calculate safety metrics
   */
  async calculateSafetyMetrics(vehicleId, startDate, endDate) {
    const vehicle = await Vehicle.findById(vehicleId);
    const assignments = await VehicleAssignment.find({
      vehicle: vehicleId,
      startDate: { $gte: startDate, $lte: endDate },
      status: 'completed'
    });

    const accidents = vehicle.incidents ? vehicle.incidents.filter(i =>
      i.type === 'accident' && i.date >= startDate && i.date <= endDate
    ) : [];

    let totalHardBraking = 0;
    let totalRapidAcceleration = 0;
    let totalMiles = 0;

    assignments.forEach(assignment => {
      totalHardBraking += assignment.performance?.hardBraking || 0;
      totalRapidAcceleration += assignment.performance?.rapidAcceleration || 0;
      totalMiles += assignment.mileage?.totalMiles || 0;
    });

    return {
      accidentCount: accidents.length,
      accidentRate: totalMiles > 0 ? (accidents.length / totalMiles) * 100000 : 0, // per 100k miles
      hardBrakingEvents: totalHardBraking,
      rapidAccelerationEvents: totalRapidAcceleration,
      safetyScore: Math.max(0, 100 - (accidents.length * 20) - (totalHardBraking * 2) - (totalRapidAcceleration * 2))
    };
  }

  /**
   * Calculate maintenance metrics
   */
  async calculateMaintenanceMetrics(vehicleId, startDate, endDate) {
    const maintenanceRecords = await MaintenanceRecord.find({
      vehicle: vehicleId,
      startDate: { $gte: startDate, $lte: endDate }
    });

    const schedules = await MaintenanceSchedule.find({
      vehicle: vehicleId,
      isActive: true
    });

    const totalMaintenance = maintenanceRecords.length;
    const preventiveMaintenance = maintenanceRecords.filter(r => r.type === 'preventive').length;
    const repairs = maintenanceRecords.filter(r => r.type === 'repair').length;
    
    const onTimeSchedules = schedules.filter(s => 
      s.performance?.onTimeCompletions > 0
    ).length;
    
    const overdueSchedules = schedules.filter(s => s.nextDue?.isOverdue).length;

    let totalCost = 0;
    maintenanceRecords.forEach(record => {
      totalCost += record.cost?.total || 0;
    });

    return {
      totalMaintenanceEvents: totalMaintenance,
      preventiveMaintenanceCount: preventiveMaintenance,
      repairCount: repairs,
      preventiveMaintenanceRatio: totalMaintenance > 0 ? (preventiveMaintenance / totalMaintenance) * 100 : 0,
      totalMaintenanceCost: totalCost,
      averageMaintenanceCost: totalMaintenance > 0 ? totalCost / totalMaintenance : 0,
      onTimeMaintenanceRate: schedules.length > 0 ? (onTimeSchedules / schedules.length) * 100 : 100,
      overdueMaintenanceCount: overdueSchedules,
      maintenanceHealthScore: Math.max(0, 100 - (repairs * 5) - (overdueSchedules * 10))
    };
  }

  /**
   * Get fleet-wide comparison
   */
  async getFleetComparison(startDate, endDate) {
    try {
      const vehicles = await Vehicle.find({ status: { $ne: 'retired' } });

      const comparison = {
        totalVehicles: vehicles.length,
        vehicles: []
      };

      for (const vehicle of vehicles) {
        const metrics = await this.getPerformanceMetrics(vehicle._id, startDate, endDate);
        
        comparison.vehicles.push({
          vehicle: metrics.vehicle,
          utilizationScore: metrics.utilization.utilizationRate,
          reliabilityScore: metrics.reliability.reliabilityScore,
          safetyScore: metrics.safety.safetyScore,
          maintenanceScore: metrics.maintenance.maintenanceHealthScore,
          costEfficiency: metrics.costEfficiency.costPerMile,
          overallScore: (
            metrics.utilization.utilizationRate * 0.25 +
            metrics.reliability.reliabilityScore * 0.25 +
            metrics.safety.safetyScore * 0.25 +
            metrics.maintenance.maintenanceHealthScore * 0.25
          )
        });
      }

      // Sort by overall score
      comparison.vehicles.sort((a, b) => b.overallScore - a.overallScore);

      // Calculate fleet averages
      comparison.fleetAverages = {
        utilizationScore: 0,
        reliabilityScore: 0,
        safetyScore: 0,
        maintenanceScore: 0,
        costPerMile: 0,
        overallScore: 0
      };

      comparison.vehicles.forEach(v => {
        comparison.fleetAverages.utilizationScore += v.utilizationScore;
        comparison.fleetAverages.reliabilityScore += v.reliabilityScore;
        comparison.fleetAverages.safetyScore += v.safetyScore;
        comparison.fleetAverages.maintenanceScore += v.maintenanceScore;
        comparison.fleetAverages.costPerMile += v.costEfficiency;
        comparison.fleetAverages.overallScore += v.overallScore;
      });

      Object.keys(comparison.fleetAverages).forEach(key => {
        comparison.fleetAverages[key] /= vehicles.length;
      });

      return comparison;
    } catch (error) {
      throw new Error(`Failed to get fleet comparison: ${error.message}`);
    }
  }
}

export default new VehicleAnalyticsService();
