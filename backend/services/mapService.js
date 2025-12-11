import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

/**
 * Advanced Map Service
 * Provides offline maps, custom styles, geofencing, and analytics
 */

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const OFFLINE_MAPS_DIR = process.env.OFFLINE_MAPS_DIR || './data/offline-maps';

/**
 * Download map tiles for offline use
 * @param {Object} bounds - {north, south, east, west}
 * @param {Array} zoomLevels - Zoom levels to download (e.g., [10, 11, 12])
 */
export async function downloadOfflineMapTiles(bounds, zoomLevels = [10, 11, 12]) {
  try {
    const { north, south, east, west } = bounds;
    const tiles = [];

    for (const zoom of zoomLevels) {
      // Calculate tile coordinates
      const northWestTile = latLngToTile(north, west, zoom);
      const southEastTile = latLngToTile(south, east, zoom);

      for (let x = northWestTile.x; x <= southEastTile.x; x++) {
        for (let y = northWestTile.y; y <= southEastTile.y; y++) {
          tiles.push({ x, y, zoom });
        }
      }
    }

    // Download tiles
    const downloadedTiles = [];
    for (const tile of tiles) {
      try {
        const tileData = await downloadTile(tile);
        downloadedTiles.push({
          ...tile,
          path: tileData.path,
          size: tileData.size
        });
      } catch (error) {
        console.error(`Failed to download tile ${tile.zoom}/${tile.x}/${tile.y}:`, error);
      }
    }

    return {
      success: true,
      totalTiles: tiles.length,
      downloadedTiles: downloadedTiles.length,
      tiles: downloadedTiles,
      bounds,
      zoomLevels
    };
  } catch (error) {
    console.error('Download offline map tiles error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Convert lat/lng to tile coordinates
 */
function latLngToTile(lat, lng, zoom) {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lng + 180) / 360 * n);
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
  
  return { x, y };
}

/**
 * Download a single map tile
 */
async function downloadTile(tile) {
  const { x, y, zoom } = tile;
  const tileDir = path.join(OFFLINE_MAPS_DIR, zoom.toString(), x.toString());
  
  // Create directory if it doesn't exist
  await fs.mkdir(tileDir, { recursive: true });
  
  const tilePath = path.join(tileDir, `${y}.png`);
  
  // Check if tile already exists
  try {
    await fs.access(tilePath);
    const stats = await fs.stat(tilePath);
    return { path: tilePath, size: stats.size, cached: true };
  } catch (error) {
    // Tile doesn't exist, download it
  }

  // Download from tile server (using OpenStreetMap as example)
  const tileUrl = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
  
  const response = await axios.get(tileUrl, {
    responseType: 'arraybuffer',
    headers: {
      'User-Agent': 'TransportationMVP/1.0'
    }
  });

  await fs.writeFile(tilePath, response.data);
  
  return {
    path: tilePath,
    size: response.data.length,
    cached: false
  };
}

/**
 * Get custom map style configuration
 */
export function getMapStyle(themeName = 'standard') {
  const styles = {
    standard: [],
    dark: [
      { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#38414e' }]
      },
      {
        featureType: 'road',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#212a37' }]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{ color: '#746855' }]
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#17263c' }]
      }
    ],
    light: [
      { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
      { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#ffffff' }]
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#c9c9c9' }]
      }
    ],
    transit: [
      {
        featureType: 'transit',
        elementType: 'all',
        stylers: [{ visibility: 'on' }]
      },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#efefef' }]
      },
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ],
    satellite: [] // Use satellite view
  };

  return {
    success: true,
    theme: themeName,
    styles: styles[themeName] || styles.standard,
    availableThemes: Object.keys(styles)
  };
}

/**
 * Create and manage geofences
 */
export function createGeofence(geofenceData) {
  const {
    name,
    description,
    type = 'circular', // 'circular' or 'polygon'
    center, // { lat, lng } for circular
    radius, // meters for circular
    polygon, // array of { lat, lng } for polygon
    triggerEvents = ['enter', 'exit'],
    metadata = {}
  } = geofenceData;

  let area;
  if (type === 'circular') {
    area = Math.PI * Math.pow(radius, 2);
  } else if (type === 'polygon' && polygon) {
    area = calculatePolygonArea(polygon);
  }

  return {
    success: true,
    geofence: {
      id: generateGeofenceId(),
      name,
      description,
      type,
      center,
      radius,
      polygon,
      triggerEvents,
      metadata,
      area,
      createdAt: new Date(),
      isActive: true
    }
  };
}

/**
 * Check if a point is inside a geofence
 */
export function isPointInGeofence(point, geofence) {
  const { type, center, radius, polygon } = geofence;

  if (type === 'circular') {
    const distance = calculateDistance(point, center);
    return distance <= radius / 1000; // Convert meters to km
  } else if (type === 'polygon') {
    return isPointInPolygon(point, polygon);
  }

  return false;
}

/**
 * Calculate distance between two points (Haversine formula)
 */
function calculateDistance(point1, point2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(point2.lat - point1.lat);
  const dLon = toRad(point2.lng - point1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Check if point is inside polygon using ray casting algorithm
 */
function isPointInPolygon(point, polygon) {
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    
    const intersect = ((yi > point.lat) !== (yj > point.lat))
      && (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Calculate polygon area using Shoelace formula
 */
function calculatePolygonArea(polygon) {
  let area = 0;
  const n = polygon.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += polygon[i].lng * polygon[j].lat;
    area -= polygon[j].lng * polygon[i].lat;
  }
  
  area = Math.abs(area) / 2;
  
  // Convert to square meters (approximate)
  const metersPerDegree = 111000; // at equator
  return area * metersPerDegree * metersPerDegree;
}

/**
 * Generate unique geofence ID
 */
function generateGeofenceId() {
  return `GEO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate speed from two GPS points
 */
export function calculateSpeed(point1, point2) {
  const { lat: lat1, lng: lng1, timestamp: time1 } = point1;
  const { lat: lat2, lng: lng2, timestamp: time2 } = point2;

  const distance = calculateDistance(
    { lat: lat1, lng: lng1 },
    { lat: lat2, lng: lng2 }
  );

  const timeDiff = (new Date(time2) - new Date(time1)) / 1000 / 3600; // hours
  const speed = distance / timeDiff; // km/h

  return {
    speed: parseFloat(speed.toFixed(2)),
    distance: parseFloat(distance.toFixed(3)),
    timeDiff: parseFloat((timeDiff * 3600).toFixed(1)), // seconds
    unit: 'km/h'
  };
}

/**
 * Check if speed exceeds limit and generate alert
 */
export function checkSpeedLimit(currentSpeed, speedLimit) {
  const exceedsLimit = currentSpeed > speedLimit;
  const percentage = ((currentSpeed - speedLimit) / speedLimit) * 100;

  return {
    exceedsLimit,
    currentSpeed,
    speedLimit,
    excessSpeed: exceedsLimit ? currentSpeed - speedLimit : 0,
    percentage: exceedsLimit ? parseFloat(percentage.toFixed(1)) : 0,
    severity: getSeverity(percentage),
    alert: exceedsLimit ? {
      type: 'speed_violation',
      message: `Speed limit exceeded by ${(currentSpeed - speedLimit).toFixed(1)} km/h`,
      timestamp: new Date()
    } : null
  };
}

function getSeverity(percentage) {
  if (percentage >= 50) return 'critical';
  if (percentage >= 30) return 'high';
  if (percentage >= 15) return 'medium';
  if (percentage > 0) return 'low';
  return 'none';
}

/**
 * Check route deviation
 */
export function checkRouteDeviation(currentLocation, plannedRoute, threshold = 500) {
  // Find nearest point on planned route
  let minDistance = Infinity;
  let nearestPoint = null;
  let segmentIndex = -1;

  for (let i = 0; i < plannedRoute.length - 1; i++) {
    const point = findNearestPointOnSegment(
      currentLocation,
      plannedRoute[i],
      plannedRoute[i + 1]
    );
    
    const distance = calculateDistance(currentLocation, point);
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestPoint = point;
      segmentIndex = i;
    }
  }

  const deviationMeters = minDistance * 1000;
  const isDeviated = deviationMeters > threshold;

  return {
    isDeviated,
    deviationMeters: parseFloat(deviationMeters.toFixed(1)),
    threshold,
    nearestPoint,
    segmentIndex,
    severity: isDeviated ? (deviationMeters > threshold * 2 ? 'high' : 'medium') : 'none',
    alert: isDeviated ? {
      type: 'route_deviation',
      message: `Vehicle deviated ${deviationMeters.toFixed(0)}m from planned route`,
      timestamp: new Date()
    } : null
  };
}

/**
 * Find nearest point on line segment
 */
function findNearestPointOnSegment(point, segmentStart, segmentEnd) {
  const A = point.lat - segmentStart.lat;
  const B = point.lng - segmentStart.lng;
  const C = segmentEnd.lat - segmentStart.lat;
  const D = segmentEnd.lng - segmentStart.lng;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let nearestLat, nearestLng;

  if (param < 0) {
    nearestLat = segmentStart.lat;
    nearestLng = segmentStart.lng;
  } else if (param > 1) {
    nearestLat = segmentEnd.lat;
    nearestLng = segmentEnd.lng;
  } else {
    nearestLat = segmentStart.lat + param * C;
    nearestLng = segmentStart.lng + param * D;
  }

  return { lat: nearestLat, lng: nearestLng };
}

/**
 * Suggest fuel-efficient route
 */
export async function getFuelEfficientRoute(origin, destination, waypoints = []) {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key is required');
  }

  try {
    const waypointStr = waypoints.length > 0 
      ? waypoints.map(wp => `${wp.lat},${wp.lng}`).join('|')
      : '';

    const params = {
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      key: GOOGLE_MAPS_API_KEY,
      mode: 'driving',
      alternatives: true,
      optimize_waypoints: true
    };

    if (waypointStr) {
      params.waypoints = waypointStr;
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Google Maps API error: ${response.data.status}`);
    }

    // Analyze routes for fuel efficiency
    const routes = response.data.routes.map((route, index) => {
      let totalDistance = 0;
      let totalDuration = 0;
      let elevationGain = 0;
      let highwayDistance = 0;
      let cityDistance = 0;

      route.legs.forEach(leg => {
        totalDistance += leg.distance.value / 1000;
        totalDuration += leg.duration.value / 60;

        // Analyze steps for road types
        leg.steps.forEach(step => {
          const stepDistance = step.distance.value / 1000;
          if (step.html_instructions.toLowerCase().includes('highway') || 
              step.html_instructions.toLowerCase().includes('freeway')) {
            highwayDistance += stepDistance;
          } else {
            cityDistance += stepDistance;
          }
        });
      });

      // Fuel efficiency score (lower is better)
      // Highway driving is more fuel efficient
      const fuelScore = calculateFuelScore({
        totalDistance,
        totalDuration,
        highwayDistance,
        cityDistance,
        elevationGain
      });

      return {
        index,
        summary: route.summary,
        totalDistance: parseFloat(totalDistance.toFixed(2)),
        totalDuration: parseFloat(totalDuration.toFixed(1)),
        highwayDistance: parseFloat(highwayDistance.toFixed(2)),
        cityDistance: parseFloat(cityDistance.toFixed(2)),
        highwayPercentage: parseFloat((highwayDistance / totalDistance * 100).toFixed(1)),
        fuelScore,
        estimatedFuelConsumption: calculateFuelConsumption({
          totalDistance,
          highwayDistance,
          cityDistance
        }),
        polyline: route.overview_polyline.points
      };
    });

    // Sort by fuel efficiency
    routes.sort((a, b) => a.fuelScore - b.fuelScore);

    return {
      success: true,
      recommendedRoute: routes[0],
      alternativeRoutes: routes.slice(1),
      analysis: {
        totalRoutes: routes.length,
        fuelSavings: routes.length > 1 
          ? parseFloat((routes[routes.length - 1].estimatedFuelConsumption - routes[0].estimatedFuelConsumption).toFixed(2))
          : 0
      }
    };
  } catch (error) {
    console.error('Fuel-efficient route error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Calculate fuel efficiency score
 */
function calculateFuelScore(routeData) {
  const { totalDistance, totalDuration, highwayDistance, cityDistance } = routeData;
  
  const avgSpeed = totalDistance / (totalDuration / 60);
  const highwayRatio = highwayDistance / totalDistance;
  
  // Optimal speed for fuel efficiency is around 80-90 km/h
  const speedPenalty = Math.abs(avgSpeed - 85) * 0.1;
  
  // Highway driving is more efficient
  const highwayBonus = highwayRatio * 10;
  
  return parseFloat((totalDistance + speedPenalty - highwayBonus).toFixed(2));
}

/**
 * Calculate estimated fuel consumption
 */
function calculateFuelConsumption(routeData) {
  const { totalDistance, highwayDistance, cityDistance } = routeData;
  
  // Average consumption rates (liters per 100km)
  const highwayRate = 7.0;
  const cityRate = 10.0;
  
  const highwayFuel = (highwayDistance / 100) * highwayRate;
  const cityFuel = (cityDistance / 100) * cityRate;
  
  return parseFloat((highwayFuel + cityFuel).toFixed(2));
}

export default {
  downloadOfflineMapTiles,
  getMapStyle,
  createGeofence,
  isPointInGeofence,
  calculateSpeed,
  checkSpeedLimit,
  checkRouteDeviation,
  getFuelEfficientRoute
};
