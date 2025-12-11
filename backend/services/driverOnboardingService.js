import DriverOnboarding from '../models/DriverOnboarding.js';
import DriverPerformance from '../models/DriverPerformance.js';
import DriverRating from '../models/DriverRating.js';
import User from '../models/User.js';
import Trip from '../models/Trip.js';
import ActivityLog from '../models/ActivityLog.js';

/**
 * DriverOnboardingService
 * Manages driver onboarding process, certifications, documents, and training
 */

class DriverOnboardingService {
  /**
   * Initialize onboarding for a new driver
   */
  async initializeOnboarding(driverId, onboardingData = {}) {
    try {
      // Check if onboarding already exists
      let onboarding = await DriverOnboarding.findOne({ driver: driverId });
      
      if (onboarding) {
        return { success: false, message: 'Onboarding already exists for this driver' };
      }

      // Create default checklist
      const defaultChecklist = [
        { itemId: '1', itemName: 'Complete mobile app tutorial', category: 'Tutorial', required: true },
        { itemId: '2', itemName: 'Upload driver\'s license', category: 'Documents', required: true },
        { itemId: '3', itemName: 'Upload insurance certificate', category: 'Documents', required: true },
        { itemId: '4', itemName: 'Complete background check', category: 'Background', required: true },
        { itemId: '5', itemName: 'Complete safety training', category: 'Training', required: true },
        { itemId: '6', itemName: 'Complete customer service training', category: 'Training', required: true },
        { itemId: '7', itemName: 'Add emergency contacts', category: 'Personal', required: true },
        { itemId: '8', itemName: 'Acknowledge driver handbook', category: 'Legal', required: true },
        { itemId: '9', itemName: 'Set up payment information', category: 'Financial', required: false },
        { itemId: '10', itemName: 'Complete first trip', category: 'Practical', required: true }
      ];

      // Create default training modules
      const defaultTrainingModules = [
        {
          moduleId: 'safety-101',
          moduleName: 'Safety Fundamentals',
          category: 'safety',
          passingScore: 80,
          maxAttempts: 3
        },
        {
          moduleId: 'customer-service',
          moduleName: 'Customer Service Excellence',
          category: 'customer_service',
          passingScore: 80,
          maxAttempts: 3
        },
        {
          moduleId: 'vehicle-operation',
          moduleName: 'Vehicle Operation',
          category: 'vehicle_operation',
          passingScore: 85,
          maxAttempts: 3
        },
        {
          moduleId: 'compliance',
          moduleName: 'Compliance & Regulations',
          category: 'compliance',
          passingScore: 90,
          maxAttempts: 3
        },
        {
          moduleId: 'emergency-procedures',
          moduleName: 'Emergency Procedures',
          category: 'emergency',
          passingScore: 90,
          maxAttempts: 3
        }
      ];

      onboarding = new DriverOnboarding({
        driver: driverId,
        onboardingStatus: 'in_progress',
        onboardingStartedAt: new Date(),
        totalSteps: 10,
        checklist: defaultChecklist,
        training: {
          modules: defaultTrainingModules,
          modulesTotal: defaultTrainingModules.length
        },
        tutorial: {
          steps: [],
          tutorialVersion: '1.0'
        },
        ...onboardingData
      });

      await onboarding.save();

      await ActivityLog.create({
        user: driverId,
        action: 'driver_onboarding_started',
        target: 'DriverOnboarding',
        targetId: onboarding._id,
        details: 'Driver onboarding process initiated'
      });

      return { success: true, onboarding };
    } catch (error) {
      throw new Error(`Failed to initialize onboarding: ${error.message}`);
    }
  }

  /**
   * Complete a tutorial step
   */
  async completeTutorialStep(driverId, stepData) {
    try {
      const onboarding = await DriverOnboarding.findOne({ driver: driverId });
      if (!onboarding) {
        throw new Error('Onboarding not found');
      }

      // Add or update tutorial step
      const existingStep = onboarding.tutorial.steps.find(s => s.stepId === stepData.stepId);
      
      if (existingStep) {
        existingStep.completed = true;
        existingStep.completedAt = new Date();
        existingStep.timeSpent = stepData.timeSpent || 0;
      } else {
        onboarding.tutorial.steps.push({
          stepNumber: stepData.stepNumber,
          stepId: stepData.stepId,
          stepName: stepData.stepName,
          completed: true,
          completedAt: new Date(),
          timeSpent: stepData.timeSpent || 0,
          skipped: false
        });
      }

      // Update total time spent
      onboarding.tutorial.totalTimeSpent = onboarding.tutorial.steps.reduce(
        (total, step) => total + (step.timeSpent || 0),
        0
      );

      // Check if all tutorial steps completed
      const tutorialStepsRequired = 5; // Adjust based on your tutorial
      const completedSteps = onboarding.tutorial.steps.filter(s => s.completed).length;
      
      if (completedSteps >= tutorialStepsRequired) {
        onboarding.tutorial.completed = true;
        onboarding.tutorial.completedAt = new Date();
        
        // Mark checklist item as complete
        const tutorialChecklistItem = onboarding.checklist.find(
          item => item.itemName.includes('tutorial')
        );
        if (tutorialChecklistItem) {
          tutorialChecklistItem.completed = true;
          tutorialChecklistItem.completedAt = new Date();
        }
      }

      await onboarding.save();

      return onboarding;
    } catch (error) {
      throw new Error(`Failed to complete tutorial step: ${error.message}`);
    }
  }

  /**
   * Start or update training module
   */
  async updateTrainingModule(driverId, moduleId, updateData) {
    try {
      const onboarding = await DriverOnboarding.findOne({ driver: driverId });
      if (!onboarding) {
        throw new Error('Onboarding not found');
      }

      const module = onboarding.training.modules.find(m => m.moduleId === moduleId);
      if (!module) {
        throw new Error('Training module not found');
      }

      // Update module
      Object.assign(module, updateData);

      if (updateData.status === 'in_progress' && !module.startedAt) {
        module.startedAt = new Date();
      }

      if (updateData.status === 'completed') {
        module.completedAt = new Date();
        
        // Issue certificate if passed
        if (module.score >= module.passingScore) {
          module.certificateIssued = true;
          module.certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
      }

      onboarding.training.lastActivityAt = new Date();
      await onboarding.save();

      return module;
    } catch (error) {
      throw new Error(`Failed to update training module: ${error.message}`);
    }
  }

  /**
   * Add certification
   */
  async addCertification(driverId, certData) {
    try {
      const onboarding = await DriverOnboarding.findOne({ driver: driverId });
      if (!onboarding) {
        throw new Error('Onboarding not found');
      }

      await onboarding.addCertification(certData);

      await ActivityLog.create({
        user: driverId,
        action: 'driver_certification_added',
        target: 'DriverOnboarding',
        targetId: onboarding._id,
        details: `Added certification: ${certData.certificationType}`,
        metadata: { certificationType: certData.certificationType }
      });

      return onboarding;
    } catch (error) {
      throw new Error(`Failed to add certification: ${error.message}`);
    }
  }

  /**
   * Upload and add document
   */
  async uploadDocument(driverId, documentData, fileInfo) {
    try {
      const onboarding = await DriverOnboarding.findOne({ driver: driverId });
      if (!onboarding) {
        throw new Error('Onboarding not found');
      }

      const docData = {
        ...documentData,
        fileName: fileInfo.filename,
        fileUrl: fileInfo.path,
        fileSize: fileInfo.size,
        uploadedAt: new Date()
      };

      await onboarding.addDocument(docData);

      // Update checklist if document upload completes an item
      if (documentData.documentType === 'drivers_license' || documentData.documentType === 'insurance_certificate') {
        const checklistItem = onboarding.checklist.find(
          item => item.itemName.toLowerCase().includes(documentData.documentType.replace('_', ' '))
        );
        if (checklistItem && !checklistItem.completed) {
          checklistItem.completed = true;
          checklistItem.completedAt = new Date();
          await onboarding.save();
        }
      }

      await ActivityLog.create({
        user: driverId,
        action: 'driver_document_uploaded',
        target: 'DriverOnboarding',
        targetId: onboarding._id,
        details: `Uploaded document: ${documentData.documentType}`,
        metadata: { documentType: documentData.documentType }
      });

      return onboarding;
    } catch (error) {
      throw new Error(`Failed to upload document: ${error.message}`);
    }
  }

  /**
   * Verify document
   */
  async verifyDocument(driverId, documentId, verifiedBy, approved = true, rejectionReason = null) {
    try {
      const onboarding = await DriverOnboarding.findOne({ driver: driverId });
      if (!onboarding) {
        throw new Error('Onboarding not found');
      }

      if (approved) {
        await onboarding.verifyDocument(documentId, verifiedBy);
      } else {
        await onboarding.rejectDocument(documentId, rejectionReason, verifiedBy);
      }

      await ActivityLog.create({
        user: verifiedBy,
        action: approved ? 'driver_document_verified' : 'driver_document_rejected',
        target: 'DriverOnboarding',
        targetId: onboarding._id,
        details: `Document ${approved ? 'verified' : 'rejected'}`,
        metadata: { documentId, rejectionReason }
      });

      return onboarding;
    } catch (error) {
      throw new Error(`Failed to verify document: ${error.message}`);
    }
  }

  /**
   * Initiate background check
   */
  async initiateBackgroundCheck(driverId, provider, initiatedBy) {
    try {
      const onboarding = await DriverOnboarding.findOne({ driver: driverId });
      if (!onboarding) {
        throw new Error('Onboarding not found');
      }

      const requestId = `BGC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await onboarding.initiateBackgroundCheck(provider, requestId);

      // Update checklist
      const checklistItem = onboarding.checklist.find(
        item => item.itemName.toLowerCase().includes('background check')
      );
      if (checklistItem) {
        checklistItem.completed = false; // Will be completed when check completes
        await onboarding.save();
      }

      await ActivityLog.create({
        user: initiatedBy,
        action: 'driver_background_check_initiated',
        target: 'DriverOnboarding',
        targetId: onboarding._id,
        details: `Background check initiated with ${provider}`,
        metadata: { provider, requestId }
      });

      return { requestId, onboarding };
    } catch (error) {
      throw new Error(`Failed to initiate background check: ${error.message}`);
    }
  }

  /**
   * Complete background check
   */
  async completeBackgroundCheck(driverId, result, reportUrl, completedBy) {
    try {
      const onboarding = await DriverOnboarding.findOne({ driver: driverId });
      if (!onboarding) {
        throw new Error('Onboarding not found');
      }

      await onboarding.completeBackgroundCheck(result, reportUrl);

      // Update checklist
      const checklistItem = onboarding.checklist.find(
        item => item.itemName.toLowerCase().includes('background check')
      );
      if (checklistItem && result === 'clear') {
        checklistItem.completed = true;
        checklistItem.completedAt = new Date();
        await onboarding.save();
      }

      await ActivityLog.create({
        user: completedBy,
        action: 'driver_background_check_completed',
        target: 'DriverOnboarding',
        targetId: onboarding._id,
        details: `Background check completed with result: ${result}`,
        metadata: { result }
      });

      return onboarding;
    } catch (error) {
      throw new Error(`Failed to complete background check: ${error.message}`);
    }
  }

  /**
   * Add emergency contact
   */
  async addEmergencyContact(driverId, contactData) {
    try {
      const onboarding = await DriverOnboarding.findOne({ driver: driverId });
      if (!onboarding) {
        throw new Error('Onboarding not found');
      }

      await onboarding.addEmergencyContact(contactData);

      // Update checklist
      const checklistItem = onboarding.checklist.find(
        item => item.itemName.toLowerCase().includes('emergency contact')
      );
      if (checklistItem && !checklistItem.completed) {
        checklistItem.completed = true;
        checklistItem.completedAt = new Date();
        await onboarding.save();
      }

      return onboarding;
    } catch (error) {
      throw new Error(`Failed to add emergency contact: ${error.message}`);
    }
  }

  /**
   * Acknowledge handbook
   */
  async acknowledgeHandbook(driverId, version, ipAddress, signature) {
    try {
      const onboarding = await DriverOnboarding.findOne({ driver: driverId });
      if (!onboarding) {
        throw new Error('Onboarding not found');
      }

      await onboarding.acknowledgeHandbook(version, ipAddress, signature);

      // Update checklist
      const checklistItem = onboarding.checklist.find(
        item => item.itemName.toLowerCase().includes('handbook')
      );
      if (checklistItem) {
        checklistItem.completed = true;
        checklistItem.completedAt = new Date();
        await onboarding.save();
      }

      await ActivityLog.create({
        user: driverId,
        action: 'driver_handbook_acknowledged',
        target: 'DriverOnboarding',
        targetId: onboarding._id,
        details: `Driver handbook v${version} acknowledged`,
        metadata: { version }
      });

      return onboarding;
    } catch (error) {
      throw new Error(`Failed to acknowledge handbook: ${error.message}`);
    }
  }

  /**
   * Set preferred routes and areas
   */
  async setPreferences(driverId, preferences) {
    try {
      const onboarding = await DriverOnboarding.findOne({ driver: driverId });
      if (!onboarding) {
        throw new Error('Onboarding not found');
      }

      onboarding.preferences = {
        ...onboarding.preferences,
        ...preferences
      };

      await onboarding.save();

      return onboarding;
    } catch (error) {
      throw new Error(`Failed to set preferences: ${error.message}`);
    }
  }

  /**
   * Approve driver onboarding
   */
  async approveOnboarding(driverId, approvedBy, notes) {
    try {
      const onboarding = await DriverOnboarding.findOne({ driver: driverId });
      if (!onboarding) {
        throw new Error('Onboarding not found');
      }

      // Check if all required items are completed
      const incompleteRequired = onboarding.checklist.filter(
        item => item.required && !item.completed
      );

      if (incompleteRequired.length > 0) {
        return {
          success: false,
          message: 'Cannot approve - required items incomplete',
          incompleteItems: incompleteRequired.map(i => i.itemName)
        };
      }

      await onboarding.approve(approvedBy, notes);

      // Update driver user role/status
      await User.findByIdAndUpdate(driverId, {
        status: 'active',
        onboardingCompleted: true
      });

      await ActivityLog.create({
        user: approvedBy,
        action: 'driver_onboarding_approved',
        target: 'DriverOnboarding',
        targetId: onboarding._id,
        details: 'Driver onboarding approved',
        metadata: { notes }
      });

      return { success: true, onboarding };
    } catch (error) {
      throw new Error(`Failed to approve onboarding: ${error.message}`);
    }
  }

  /**
   * Get drivers with expiring certifications
   */
  async getExpiringCertifications(daysAhead = 30) {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const onboardings = await DriverOnboarding.find({
        'certifications.expirationDate': {
          $gte: new Date(),
          $lte: futureDate
        }
      }).populate('driver', 'firstName lastName email phoneNumber');

      const expiring = [];

      onboardings.forEach(onboarding => {
        onboarding.certifications.forEach(cert => {
          if (cert.expirationDate >= new Date() && cert.expirationDate <= futureDate) {
            expiring.push({
              driver: onboarding.driver,
              certification: cert,
              daysUntilExpiration: Math.ceil(
                (cert.expirationDate - new Date()) / (1000 * 60 * 60 * 24)
              )
            });
          }
        });
      });

      return expiring.sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);
    } catch (error) {
      throw new Error(`Failed to get expiring certifications: ${error.message}`);
    }
  }

  /**
   * Get onboarding statistics
   */
  async getOnboardingStatistics() {
    try {
      const stats = {
        total: 0,
        byStatus: {},
        averageCompletionPercentage: 0,
        completedThisMonth: 0,
        pendingApproval: 0
      };

      const onboardings = await DriverOnboarding.find({});

      stats.total = onboardings.length;

      // Count by status
      onboardings.forEach(ob => {
        stats.byStatus[ob.onboardingStatus] = (stats.byStatus[ob.onboardingStatus] || 0) + 1;
      });

      // Calculate average completion
      if (onboardings.length > 0) {
        const totalCompletion = onboardings.reduce((sum, ob) => sum + ob.completionPercentage, 0);
        stats.averageCompletionPercentage = Math.round(totalCompletion / onboardings.length);
      }

      // Completed this month
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      stats.completedThisMonth = onboardings.filter(
        ob => ob.onboardingCompletedAt >= monthStart
      ).length;

      // Pending approval
      stats.pendingApproval = onboardings.filter(
        ob => ob.approval.status === 'pending' && ob.completionPercentage === 100
      ).length;

      return stats;
    } catch (error) {
      throw new Error(`Failed to get onboarding statistics: ${error.message}`);
    }
  }
}

export default new DriverOnboardingService();
