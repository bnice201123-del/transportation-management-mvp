import InsurancePolicy from '../models/InsurancePolicy.js';
import FuelCard from '../models/FuelCard.js';
import MaintenanceRecord from '../models/MaintenanceRecord.js';
import PartsInventory from '../models/PartsInventory.js';
import VehicleTelematics from '../models/VehicleTelematics.js';
import Vehicle from '../models/Vehicle.js';
import axios from 'axios';

/**
 * Fleet Management Integration Service
 * Handles integration with external fleet management systems
 */

class FleetIntegrationService {
  // ============================================
  // Insurance Provider Integration
  // ============================================

  /**
   * Sync insurance policy with provider API
   */
  static async syncInsurancePolicy(policyId) {
    const policy = await InsurancePolicy.findById(policyId).select('+provider.apiKey');
    
    if (!policy || !policy.provider.apiKey || !policy.provider.apiEndpoint) {
      throw new Error('Insurance policy not configured for API sync');
    }

    try {
      const response = await axios.get(
        `${policy.provider.apiEndpoint}/policies/${policy.provider.policyNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${policy.provider.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      // Update policy with API data
      if (response.data) {
        policy.apiData.lastVerified = new Date();
        policy.apiData.verificationStatus = 'verified';
        policy.provider.lastSyncedAt = new Date();

        // Update policy details from API
        if (response.data.expirationDate) {
          policy.expirationDate = new Date(response.data.expirationDate);
        }
        if (response.data.premium) {
          policy.premium.amount = response.data.premium.amount;
          policy.premium.nextPaymentDate = new Date(response.data.premium.nextPaymentDate);
        }
        if (response.data.status) {
          policy.status = response.data.status;
        }

        await policy.save();
      }

      return {
        success: true,
        policy,
        message: 'Insurance policy synced successfully'
      };
    } catch (error) {
      policy.apiData.verificationStatus = 'failed';
      policy.apiData.lastSyncError = error.message;
      await policy.save();

      return {
        success: false,
        error: 'Failed to sync insurance policy',
        details: error.message
      };
    }
  }

  /**
   * File insurance claim with provider
   */
  static async fileInsuranceClaim(policyId, claimData) {
    const policy = await InsurancePolicy.findById(policyId).select('+provider.apiKey');
    
    if (!policy || !policy.provider.apiKey) {
      throw new Error('Insurance policy not configured for API integration');
    }

    try {
      const response = await axios.post(
        `${policy.provider.apiEndpoint}/claims`,
        {
          policyNumber: policy.provider.policyNumber,
          ...claimData
        },
        {
          headers: {
            'Authorization': `Bearer ${policy.provider.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      if (response.data && response.data.claimNumber) {
        // Add claim to policy
        await policy.addClaim({
          claimNumber: response.data.claimNumber,
          ...claimData,
          status: 'pending'
        });

        return {
          success: true,
          claimNumber: response.data.claimNumber,
          message: 'Claim filed successfully'
        };
      }

      throw new Error('Invalid response from insurance provider');
    } catch (error) {
      return {
        success: false,
        error: 'Failed to file insurance claim',
        details: error.message
      };
    }
  }

  // ============================================
  // Fuel Card Integration
  // ============================================

  /**
   * Sync fuel card transactions from provider
   */
  static async syncFuelCardTransactions(cardId, startDate = null, endDate = null) {
    const fuelCard = await FuelCard.findById(cardId).select('+apiIntegration.apiKey');
    
    if (!fuelCard || !fuelCard.apiIntegration.enabled || !fuelCard.apiIntegration.apiKey) {
      throw new Error('Fuel card not configured for API sync');
    }

    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: last 7 days
    const end = endDate || new Date();

    try {
      const response = await axios.get(
        `${fuelCard.apiIntegration.apiEndpoint}/transactions`,
        {
          params: {
            cardNumber: fuelCard.cardNumber,
            startDate: start.toISOString(),
            endDate: end.toISOString()
          },
          headers: {
            'Authorization': `Bearer ${fuelCard.apiIntegration.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      const transactions = response.data.transactions || [];
      let newTransactions = 0;

      for (const tx of transactions) {
        // Check if transaction already exists
        const exists = fuelCard.transactions.some(
          t => t.transactionId === tx.transactionId
        );

        if (!exists) {
          await fuelCard.addTransaction({
            transactionId: tx.transactionId,
            date: new Date(tx.date),
            station: tx.station,
            fuelType: tx.fuelType,
            quantity: tx.quantity,
            pricePerUnit: tx.pricePerUnit,
            totalAmount: tx.totalAmount,
            odometer: tx.odometer,
            purchaseType: tx.purchaseType || 'fuel',
            receiptNumber: tx.receiptNumber
          });
          newTransactions++;
        }
      }

      fuelCard.apiIntegration.lastSynced = new Date();
      await fuelCard.save();

      return {
        success: true,
        newTransactions,
        totalTransactions: transactions.length,
        message: `Synced ${newTransactions} new transactions`
      };
    } catch (error) {
      fuelCard.apiIntegration.lastSyncError = error.message;
      await fuelCard.save();

      return {
        success: false,
        error: 'Failed to sync fuel card transactions',
        details: error.message
      };
    }
  }

  /**
   * Update fuel card limits via API
   */
  static async updateFuelCardLimits(cardId, limits) {
    const fuelCard = await FuelCard.findById(cardId).select('+apiIntegration.apiKey');
    
    if (!fuelCard || !fuelCard.apiIntegration.enabled) {
      throw new Error('Fuel card not configured for API integration');
    }

    try {
      await axios.put(
        `${fuelCard.apiIntegration.apiEndpoint}/cards/${fuelCard.apiIntegration.externalCardId}/limits`,
        limits,
        {
          headers: {
            'Authorization': `Bearer ${fuelCard.apiIntegration.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      // Update local limits
      fuelCard.limits = { ...fuelCard.limits, ...limits };
      await fuelCard.save();

      return {
        success: true,
        message: 'Fuel card limits updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update fuel card limits',
        details: error.message
      };
    }
  }

  // ============================================
  // Maintenance System Integration
  // ============================================

  /**
   * Sync maintenance record with external system
   */
  static async syncMaintenanceRecord(recordId) {
    const record = await MaintenanceRecord.findById(recordId).populate('vehicle');
    
    if (!record || !record.externalSystem.systemName) {
      throw new Error('Maintenance record not configured for external sync');
    }

    try {
      // This is a placeholder - actual implementation depends on the external system
      const endpoint = process.env.MAINTENANCE_SYSTEM_ENDPOINT;
      const apiKey = process.env.MAINTENANCE_SYSTEM_API_KEY;

      if (!endpoint || !apiKey) {
        throw new Error('Maintenance system not configured');
      }

      const response = await axios.post(
        `${endpoint}/work-orders`,
        {
          workOrderNumber: record.workOrderNumber,
          vehicleId: record.vehicle.licensePlate,
          serviceType: record.maintenanceType,
          description: record.description,
          status: record.status,
          parts: record.partsUsed,
          labor: record.labor,
          totalCost: record.costs.total
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      if (response.data && response.data.workOrderId) {
        record.externalSystem.externalId = response.data.workOrderId;
        record.externalSystem.syncStatus = 'synced';
        record.externalSystem.lastSynced = new Date();
        await record.save();

        return {
          success: true,
          externalId: response.data.workOrderId,
          message: 'Maintenance record synced successfully'
        };
      }

      throw new Error('Invalid response from maintenance system');
    } catch (error) {
      record.externalSystem.syncStatus = 'failed';
      record.externalSystem.syncError = error.message;
      await record.save();

      return {
        success: false,
        error: 'Failed to sync maintenance record',
        details: error.message
      };
    }
  }

  // ============================================
  // Parts Inventory Integration
  // ============================================

  /**
   * Sync parts inventory with supplier
   */
  static async syncPartsInventory(partId, supplierId = null) {
    const part = await PartsInventory.findById(partId);
    
    if (!part) {
      throw new Error('Part not found');
    }

    const supplier = supplierId 
      ? part.suppliers.find(s => s._id.toString() === supplierId)
      : part.suppliers.find(s => s.isPrimary);

    if (!supplier || !supplier.apiIntegration?.enabled) {
      throw new Error('Supplier not configured for API integration');
    }

    try {
      const response = await axios.get(
        `${supplier.apiIntegration.endpoint}/parts/${supplier.supplierPartNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${supplier.apiIntegration.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data) {
        // Update pricing and availability from supplier
        if (response.data.price) {
          supplier.cost = response.data.price;
          part.pricing.lastCostUpdate = new Date();
        }
        if (response.data.availability) {
          supplier.leadTime = response.data.availability.leadTime;
        }

        await part.save();

        return {
          success: true,
          part,
          message: 'Parts inventory synced successfully'
        };
      }

      throw new Error('Invalid response from supplier');
    } catch (error) {
      return {
        success: false,
        error: 'Failed to sync parts inventory',
        details: error.message
      };
    }
  }

  /**
   * Create purchase order with supplier
   */
  static async createPurchaseOrder(partId, quantity, supplierId = null) {
    const part = await PartsInventory.findById(partId);
    
    if (!part) {
      throw new Error('Part not found');
    }

    const supplier = supplierId 
      ? part.suppliers.find(s => s._id.toString() === supplierId)
      : part.suppliers.find(s => s.isPrimary);

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    const poNumber = `PO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const unitCost = supplier.cost || part.pricing.cost;
    const totalCost = unitCost * quantity;

    try {
      // If supplier has API integration, submit via API
      if (supplier.apiIntegration?.enabled) {
        const response = await axios.post(
          `${supplier.apiIntegration.endpoint}/orders`,
          {
            partNumber: supplier.supplierPartNumber,
            quantity,
            orderNumber: poNumber
          },
          {
            headers: {
              'Authorization': `Bearer ${supplier.apiIntegration.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 15000
          }
        );

        if (response.data && response.data.orderId) {
          // Add PO to part with external order ID
          part.purchaseOrders.push({
            poNumber,
            supplier: supplier.name,
            quantity,
            unitCost,
            totalCost,
            status: 'ordered',
            notes: `External Order ID: ${response.data.orderId}`
          });

          await part.save();

          return {
            success: true,
            poNumber,
            externalOrderId: response.data.orderId,
            message: 'Purchase order created and submitted to supplier'
          };
        }
      }

      // If no API integration, just create local PO
      part.purchaseOrders.push({
        poNumber,
        supplier: supplier.name,
        quantity,
        unitCost,
        totalCost,
        status: 'pending'
      });

      await part.save();

      return {
        success: true,
        poNumber,
        message: 'Purchase order created (manual fulfillment required)'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create purchase order',
        details: error.message
      };
    }
  }

  // ============================================
  // Vehicle Telematics Integration
  // ============================================

  /**
   * Sync telematics data from provider
   */
  static async syncTelematicsData(vehicleId) {
    const telematics = await VehicleTelematics.findOne({ vehicle: vehicleId })
      .select('+apiIntegration.apiKey');
    
    if (!telematics || !telematics.apiIntegration.enabled) {
      throw new Error('Vehicle telematics not configured for API sync');
    }

    try {
      // Fetch current vehicle data
      const response = await axios.get(
        `${telematics.apiIntegration.apiEndpoint}/vehicles/${telematics.apiIntegration.accountId}/device/${telematics.device.deviceId}`,
        {
          headers: {
            'Authorization': `Bearer ${telematics.apiIntegration.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const data = response.data;

      // Update location
      if (data.location) {
        await telematics.updateLocation({
          coordinates: {
            type: 'Point',
            coordinates: [data.location.longitude, data.location.latitude]
          },
          speed: data.location.speed,
          heading: data.location.heading,
          address: data.location.address,
          isMoving: data.location.speed > 5,
          ignitionStatus: data.ignitionStatus
        });
      }

      // Update diagnostics
      if (data.diagnostics) {
        telematics.diagnostics.odometer = {
          value: data.diagnostics.odometer,
          unit: 'miles',
          lastUpdated: new Date()
        };
        telematics.diagnostics.fuelLevel = {
          percentage: data.diagnostics.fuelLevel,
          lastUpdated: new Date()
        };
        telematics.diagnostics.engineHours = {
          value: data.diagnostics.engineHours,
          lastUpdated: new Date()
        };
        telematics.diagnostics.batteryVoltage = data.diagnostics.batteryVoltage;
      }

      // Update fault codes
      if (data.faultCodes && data.faultCodes.length > 0) {
        for (const fault of data.faultCodes) {
          const existingFault = telematics.faultCodes.find(
            f => f.code === fault.code && f.isActive
          );
          
          if (!existingFault) {
            await telematics.addFaultCode(fault.code, fault.description, fault.severity);
          }
        }
      }

      telematics.device.lastCommunication = new Date();
      telematics.apiIntegration.lastSynced = new Date();
      await telematics.save();

      // Update vehicle odometer
      if (data.diagnostics?.odometer) {
        await Vehicle.findByIdAndUpdate(vehicleId, {
          mileage: data.diagnostics.odometer
        });
      }

      return {
        success: true,
        telematics,
        message: 'Telematics data synced successfully'
      };
    } catch (error) {
      telematics.apiIntegration.syncError = error.message;
      await telematics.save();

      return {
        success: false,
        error: 'Failed to sync telematics data',
        details: error.message
      };
    }
  }

  /**
   * Batch sync all enabled integrations
   */
  static async syncAllIntegrations() {
    const results = {
      insurance: { synced: 0, failed: 0 },
      fuelCards: { synced: 0, failed: 0 },
      telematics: { synced: 0, failed: 0 }
    };

    // Sync insurance policies
    const policies = await InsurancePolicy.find({
      status: 'active',
      'apiData.syncEnabled': true
    });

    for (const policy of policies) {
      const result = await this.syncInsurancePolicy(policy._id);
      if (result.success) {
        results.insurance.synced++;
      } else {
        results.insurance.failed++;
      }
      await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
    }

    // Sync fuel cards
    const fuelCards = await FuelCard.find({
      status: 'active',
      'apiIntegration.enabled': true
    });

    for (const card of fuelCards) {
      const result = await this.syncFuelCardTransactions(card._id);
      if (result.success) {
        results.fuelCards.synced++;
      } else {
        results.fuelCards.failed++;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Sync telematics
    const telematicsDevices = await VehicleTelematics.find({
      'device.status': 'active',
      'apiIntegration.enabled': true
    });

    for (const device of telematicsDevices) {
      const result = await this.syncTelematicsData(device.vehicle);
      if (result.success) {
        results.telematics.synced++;
      } else {
        results.telematics.failed++;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      success: true,
      results,
      timestamp: new Date()
    };
  }
}

export default FleetIntegrationService;
