import DriverPreference from '../models/DriverPreference.js';
import User from '../models/User.js';
import Trip from '../models/Trip.js';

/**
 * Driver Matching Service
 * Intelligent algorithm to match drivers with trips based on preferences, availability, and performance
 */

class DriverMatchingService {
  /**
   * Calculate Haversine distance between two points
   */
  static calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Find available drivers near a location
   */
  static async findNearbyDrivers(location, radiusKm = 10, options = {}) {
    const query = {
      role: 'driver',
      isActive: true,
      isAvailable: true
    };

    // Add location tracking filter if specified
    if (options.requireLocationTracking) {
      query.isLocationTracking = true;
    }

    const drivers = await User.find(query).select(
      'firstName lastName currentLocation vehicleInfo rating completedTrips'
    );

    // Filter by distance and sort by proximity
    const nearbyDrivers = drivers
      .filter(driver => {
        if (!driver.currentLocation || !driver.currentLocation.coordinates) {
          return false;
        }
        
        const driverLocation = {
          lat: driver.currentLocation.coordinates[1],
          lng: driver.currentLocation.coordinates[0]
        };
        
        const distance = this.calculateDistance(location, driverLocation);
        driver.distanceToPickup = distance;
        
        return distance <= radiusKm;
      })
      .sort((a, b) => a.distanceToPickup - b.distanceToPickup);

    return nearbyDrivers;
  }

  /**
   * Calculate match score between a driver and a trip
   */
  static async calculateMatchScore(driver, driverPreference, trip, options = {}) {
    let score = 0;
    const breakdown = {};

    // Get driver location
    const driverLocation = driver.currentLocation?.coordinates
      ? { lat: driver.currentLocation.coordinates[1], lng: driver.currentLocation.coordinates[0] }
      : null;

    // 1. Distance Score (0-100)
    if (driverLocation) {
      const distance = this.calculateDistance(driverLocation, trip.pickupLocation);
      const distanceScore = Math.max(0, 100 - (distance / 50) * 100); // 50km = 0 score
      score += distanceScore * (driverPreference.matchingWeights.distance || 0.25);
      breakdown.distance = {
        value: distance,
        score: distanceScore,
        weight: driverPreference.matchingWeights.distance
      };
    } else {
      breakdown.distance = { value: null, score: 0, weight: 0 };
    }

    // 2. Availability Score (0-100)
    const isAvailable = driverPreference.isAvailableAt(trip.pickupTime);
    const availabilityScore = isAvailable ? 100 : 0;
    score += availabilityScore * (driverPreference.matchingWeights.availability || 0.20);
    breakdown.availability = {
      isAvailable,
      score: availabilityScore,
      weight: driverPreference.matchingWeights.availability
    };

    // 3. Geographic Preference Score (0-100)
    const preferredAreaCheck = driverPreference.isInPreferredArea(trip.pickupLocation);
    const avoidAreaCheck = driverPreference.isInAvoidArea(trip.pickupLocation);
    
    let geoScore = 50; // Neutral if no preferences
    if (preferredAreaCheck.inArea) {
      geoScore = 50 + (preferredAreaCheck.priority * 10); // 60-100 based on priority
    } else if (avoidAreaCheck.inArea) {
      geoScore = 0; // Strong penalty for avoid areas
    }
    
    score += geoScore * (driverPreference.matchingWeights.preferences || 0.20);
    breakdown.geographic = {
      preferredArea: preferredAreaCheck,
      avoidArea: avoidAreaCheck,
      score: geoScore,
      weight: driverPreference.matchingWeights.preferences
    };

    // 4. Trip Type Preference Score (0-100)
    let tripTypeScore = 50; // Neutral default
    const tripType = trip.tripType || 'scheduled';
    
    const preferredType = driverPreference.tripPreferences.preferredTripTypes?.find(
      t => t.type === tripType
    );
    const avoidedType = driverPreference.tripPreferences.avoidTripTypes?.find(
      t => t.type === tripType
    );
    
    if (preferredType) {
      tripTypeScore = 50 + (preferredType.priority * 10);
    } else if (avoidedType) {
      tripTypeScore = 0;
    }
    
    // Check special requirements
    if (trip.requiresWheelchair && !driverPreference.tripPreferences.acceptWheelchair) {
      tripTypeScore = 0;
    }
    if (trip.hasPets && !driverPreference.tripPreferences.acceptPets) {
      tripTypeScore = 0;
    }
    if (trip.waypoints?.length > driverPreference.tripPreferences.maxStopsPerTrip) {
      tripTypeScore = 0;
    }
    
    score += tripTypeScore * (driverPreference.matchingWeights.preferences || 0.20);
    breakdown.tripType = {
      type: tripType,
      score: tripTypeScore,
      weight: driverPreference.matchingWeights.preferences
    };

    // 5. Driver Rating Score (0-100)
    const driverRating = driver.rating || 0;
    const ratingScore = (driverRating / 5) * 100;
    score += ratingScore * (driverPreference.matchingWeights.rating || 0.15);
    breakdown.rating = {
      value: driverRating,
      score: ratingScore,
      weight: driverPreference.matchingWeights.rating
    };

    // 6. Efficiency Score (route optimization) (0-100)
    let efficiencyScore = 50; // Neutral default
    
    // If driver has a current trip ending near this pickup, boost score
    if (options.currentTrip && options.currentTrip.dropoffLocation) {
      const distanceFromLastDropoff = this.calculateDistance(
        options.currentTrip.dropoffLocation,
        trip.pickupLocation
      );
      efficiencyScore = Math.max(0, 100 - (distanceFromLastDropoff / 20) * 100); // 20km = 0
    }
    
    score += efficiencyScore * (driverPreference.matchingWeights.efficiency || 0.20);
    breakdown.efficiency = {
      score: efficiencyScore,
      weight: driverPreference.matchingWeights.efficiency
    };

    // 7. Rider Preference Bonus/Penalty
    if (trip.rider) {
      const preferredRider = driverPreference.riderPreferences.preferredRiders?.find(
        pr => pr.rider.toString() === trip.rider.toString()
      );
      const avoidedRider = driverPreference.riderPreferences.avoidRiders?.find(
        ar => ar.rider.toString() === trip.rider.toString()
      );
      
      if (preferredRider) {
        score += 10; // Bonus for preferred rider
        breakdown.riderBonus = 10;
      } else if (avoidedRider) {
        score = 0; // Strong penalty - driver doesn't want this rider
        breakdown.riderPenalty = 'avoided';
      }
    }

    // 8. Certification Requirements
    if (trip.requiresCertification) {
      const hasCertification = driverPreference.skills.certifications?.some(
        cert => cert.type === trip.requiresCertification && cert.verified
      );
      
      if (!hasCertification) {
        score = 0; // Driver not qualified
        breakdown.certificationMissing = trip.requiresCertification;
      }
    }

    // 9. Language Match Bonus
    if (trip.preferredLanguage && driverPreference.languages.preferMatchingLanguage) {
      const speaksLanguage = 
        driverPreference.languages.primary === trip.preferredLanguage ||
        driverPreference.languages.additional?.includes(trip.preferredLanguage);
      
      if (speaksLanguage) {
        score += 5; // Small bonus for language match
        breakdown.languageBonus = 5;
      }
    }

    return {
      totalScore: Math.max(0, Math.min(100, score)), // Clamp between 0-100
      breakdown,
      driverId: driver._id,
      driverName: `${driver.firstName} ${driver.lastName}`,
      distanceToPickup: breakdown.distance.value
    };
  }

  /**
   * Find best matching drivers for a trip
   */
  static async findBestMatches(trip, options = {}) {
    const limit = options.limit || 10;
    const radiusKm = options.radiusKm || 20;
    const minScore = options.minScore || 40;

    // Find nearby available drivers
    const nearbyDrivers = await this.findNearbyDrivers(
      trip.pickupLocation,
      radiusKm,
      { requireLocationTracking: true }
    );

    if (nearbyDrivers.length === 0) {
      return {
        success: false,
        message: 'No available drivers found nearby',
        matches: []
      };
    }

    // Get driver preferences for all nearby drivers
    const driverIds = nearbyDrivers.map(d => d._id);
    const preferences = await DriverPreference.find({
      driver: { $in: driverIds },
      isActive: true
    });

    // Create a map for quick lookup
    const preferencesMap = new Map();
    preferences.forEach(pref => {
      preferencesMap.set(pref.driver.toString(), pref);
    });

    // Calculate match scores
    const matches = [];
    for (const driver of nearbyDrivers) {
      const driverPref = preferencesMap.get(driver._id.toString());
      
      // If driver has no preferences, create default scoring
      const preference = driverPref || {
        matchingWeights: {
          distance: 0.4,
          availability: 0.2,
          preferences: 0.2,
          rating: 0.1,
          efficiency: 0.1
        },
        isAvailableAt: () => true,
        isInPreferredArea: () => ({ inArea: true, priority: 3 }),
        isInAvoidArea: () => ({ inArea: false }),
        tripPreferences: {
          acceptWheelchair: true,
          acceptPets: true,
          acceptMultiStop: true,
          maxStopsPerTrip: 10
        },
        skills: { certifications: [] },
        languages: { primary: 'en', additional: [], preferMatchingLanguage: false },
        riderPreferences: { preferredRiders: [], avoidRiders: [] }
      };

      const matchScore = await this.calculateMatchScore(
        driver,
        preference,
        trip,
        options
      );

      // Check if driver meets minimum score
      if (matchScore.totalScore >= minScore) {
        matches.push({
          driver: {
            id: driver._id,
            name: `${driver.firstName} ${driver.lastName}`,
            rating: driver.rating,
            completedTrips: driver.completedTrips,
            vehicleInfo: driver.vehicleInfo,
            currentLocation: driver.currentLocation
          },
          matchScore: matchScore.totalScore,
          distanceToPickup: matchScore.distanceToPickup,
          breakdown: matchScore.breakdown,
          autoAccept: driverPref?.shouldAutoAccept(
            trip,
            matchScore.distanceToPickup,
            trip.fare || 0
          ) || false
        });
      }
    }

    // Sort by match score (highest first)
    matches.sort((a, b) => b.matchScore - a.matchScore);

    // Limit results
    const topMatches = matches.slice(0, limit);

    return {
      success: true,
      matches: topMatches,
      totalDriversConsidered: nearbyDrivers.length,
      totalMatches: matches.length,
      topMatchScore: topMatches[0]?.matchScore || 0
    };
  }

  /**
   * Assign trip to best available driver
   */
  static async assignToBestDriver(tripId, options = {}) {
    const trip = await Trip.findById(tripId)
      .populate('rider', 'firstName lastName rating preferredLanguage');

    if (!trip) {
      return {
        success: false,
        error: 'Trip not found'
      };
    }

    // Find best matches
    const matchResult = await this.findBestMatches(trip, {
      limit: 1,
      ...options
    });

    if (!matchResult.success || matchResult.matches.length === 0) {
      return {
        success: false,
        error: 'No suitable drivers found',
        ...matchResult
      };
    }

    const bestMatch = matchResult.matches[0];

    // Update trip with assigned driver
    trip.driver = bestMatch.driver.id;
    trip.status = bestMatch.autoAccept ? 'accepted' : 'pending';
    trip.assignedAt = new Date();
    trip.matchScore = bestMatch.matchScore;
    
    await trip.save();

    return {
      success: true,
      trip,
      assignedDriver: bestMatch.driver,
      matchScore: bestMatch.matchScore,
      autoAccepted: bestMatch.autoAccept,
      breakdown: bestMatch.breakdown
    };
  }

  /**
   * Bulk match multiple trips to drivers (for batch scheduling)
   */
  static async batchMatchTrips(tripIds, options = {}) {
    const results = [];
    
    for (const tripId of tripIds) {
      const result = await this.assignToBestDriver(tripId, options);
      results.push({
        tripId,
        ...result
      });
      
      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      success: true,
      results,
      summary: {
        total: tripIds.length,
        successful,
        failed,
        successRate: (successful / tripIds.length) * 100
      }
    };
  }

  /**
   * Re-assign trip to next best driver (if original driver declines)
   */
  static async reassignTrip(tripId, excludeDriverIds = [], options = {}) {
    const trip = await Trip.findById(tripId)
      .populate('rider', 'firstName lastName rating preferredLanguage');

    if (!trip) {
      return {
        success: false,
        error: 'Trip not found'
      };
    }

    // Find matches, excluding drivers who already declined
    const matchResult = await this.findBestMatches(trip, {
      excludeDrivers: excludeDriverIds,
      ...options
    });

    if (!matchResult.success || matchResult.matches.length === 0) {
      return {
        success: false,
        error: 'No alternative drivers found',
        ...matchResult
      };
    }

    const nextBestMatch = matchResult.matches[0];

    // Update trip
    trip.driver = nextBestMatch.driver.id;
    trip.status = nextBestMatch.autoAccept ? 'accepted' : 'pending';
    trip.assignedAt = new Date();
    trip.matchScore = nextBestMatch.matchScore;
    trip.reassignmentCount = (trip.reassignmentCount || 0) + 1;
    
    await trip.save();

    return {
      success: true,
      trip,
      assignedDriver: nextBestMatch.driver,
      matchScore: nextBestMatch.matchScore,
      autoAccepted: nextBestMatch.autoAccept,
      reassignmentCount: trip.reassignmentCount,
      alternativeMatches: matchResult.matches.slice(1, 3) // Next 2 alternatives
    };
  }

  /**
   * Get driver's match suitability for current time and location
   */
  static async getDriverAvailability(driverId) {
    const driver = await User.findById(driverId);
    if (!driver || driver.role !== 'driver') {
      return {
        success: false,
        error: 'Driver not found'
      };
    }

    const preference = await DriverPreference.findOne({ driver: driverId });
    
    const now = new Date();
    const isAvailable = driver.isAvailable;
    const isLocationTracking = driver.isLocationTracking;
    const hasPreferences = !!preference;
    
    let currentShift = null;
    if (preference) {
      const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      currentShift = preference.availability.preferredShifts?.find(shift => {
        return shift.dayOfWeek === dayOfWeek && 
               timeStr >= shift.startTime && 
               timeStr <= shift.endTime;
      });
    }

    return {
      success: true,
      driver: {
        id: driver._id,
        name: `${driver.firstName} ${driver.lastName}`,
        isAvailable,
        isLocationTracking,
        currentLocation: driver.currentLocation,
        rating: driver.rating,
        completedTrips: driver.completedTrips
      },
      preferences: {
        hasPreferences,
        inPreferredShift: !!currentShift,
        currentShift,
        acceptanceRate: preference?.statistics.acceptanceRate || 100,
        autoAcceptEnabled: preference?.autoAccept.enabled || false
      }
    };
  }
}

export default DriverMatchingService;
