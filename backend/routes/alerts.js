const express = require('express');
const { body, validationResult } = require('express-validator');
const Alert = require('../models/Alert');
const HealthReport = require('../models/HealthReport');
const auth = require('../middleware/auth');

const router = express.Router();

// Middleware to check admin/health worker access
const requireStaffAccess = (req, res, next) => {
  if (!['admin', 'health_worker', 'asha_worker'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied. Staff role required.' });
  }
  next();
};

// Get all alerts with filtering
router.get('/', auth, requireStaffAccess, async (req, res) => {
  try {
    const { status, severity, type, state, district, page = 1, limit = 20 } = req.query;
    
    let query = {};
    
    // Add filters
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (type) query.type = type;
    if (state) query['location.state'] = state;
    if (district) query['location.district'] = district;

    const alerts = await Alert.find(query)
      .populate('relatedReports', 'patientInfo location symptoms urgency')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Alert.countDocuments(query);

    res.json({
      alerts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ message: 'Error fetching alerts' });
  }
});

// Create new alert
router.post('/', auth, requireStaffAccess, [
  body('type').isIn(['disease_outbreak', 'critical_report', 'water_contamination', 'resource_shortage']),
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('severity').isIn(['low', 'medium', 'high', 'critical'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const alertData = {
      ...req.body,
      createdBy: req.user.userId
    };

    const alert = new Alert(alertData);
    await alert.save();

    await alert.populate('relatedReports', 'patientInfo location symptoms');

    res.status(201).json({
      message: 'Alert created successfully',
      alert
    });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ message: 'Error creating alert' });
  }
});

// Update alert status
router.patch('/:id/status', auth, requireStaffAccess, async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    alert.status = status;
    if (notes) alert.notes = notes;
    
    if (status === 'investigating') {
      alert.assignedTo = req.user.userId;
    }
    
    if (status === 'resolved') {
      alert.resolvedAt = new Date();
    }

    await alert.save();
    await alert.populate('assignedTo', 'name email');

    res.json({
      message: 'Alert status updated successfully',
      alert
    });
  } catch (error) {
    console.error('Update alert error:', error);
    res.status(500).json({ message: 'Error updating alert' });
  }
});

// Get alert statistics
router.get('/stats', auth, requireStaffAccess, async (req, res) => {
  try {
    const { state, district, days = 30 } = req.query;
    
    let query = {};
    if (state) query['location.state'] = state;
    if (district) query['location.district'] = district;
    
    const dateFilter = {
      createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
    };

    const [
      totalAlerts,
      activeAlerts,
      resolvedAlerts,
      criticalAlerts,
      alertsByType,
      alertsBySeverity
    ] = await Promise.all([
      Alert.countDocuments({ ...query }),
      Alert.countDocuments({ ...query, status: 'active' }),
      Alert.countDocuments({ ...query, status: 'resolved', ...dateFilter }),
      Alert.countDocuments({ ...query, severity: 'critical', status: 'active' }),
      Alert.aggregate([
        { $match: { ...query, ...dateFilter } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Alert.aggregate([
        { $match: { ...query, ...dateFilter } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      summary: {
        total: totalAlerts,
        active: activeAlerts,
        resolved: resolvedAlerts,
        critical: criticalAlerts
      },
      distribution: {
        byType: alertsByType,
        bySeverity: alertsBySeverity
      },
      timeframe: `${days} days`,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Alert stats error:', error);
    res.status(500).json({ message: 'Error fetching alert statistics' });
  }
});

// Auto-generate alerts based on report patterns
router.post('/auto-generate', auth, requireStaffAccess, async (req, res) => {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Check for potential disease outbreaks (3+ similar cases in same area)
    const outbreakPatterns = await HealthReport.aggregate([
      {
        $match: {
          createdAt: { $gte: last24Hours },
          urgency: { $in: ['high', 'critical'] }
        }
      },
      {
        $group: {
          _id: {
            disease: { $arrayElemAt: ['$suspectedDiseases', 0] },
            district: '$location.district',
            state: '$location.state'
          },
          count: { $sum: 1 },
          reports: { $push: '$_id' }
        }
      },
      {
        $match: { count: { $gte: 3 } }
      }
    ]);

    const newAlerts = [];

    for (const pattern of outbreakPatterns) {
      // Check if alert already exists for this pattern
      const existingAlert = await Alert.findOne({
        type: 'disease_outbreak',
        'location.district': pattern._id.district,
        'location.state': pattern._id.state,
        status: 'active',
        createdAt: { $gte: last24Hours }
      });

      if (!existingAlert) {
        const alert = new Alert({
          type: 'disease_outbreak',
          title: `Potential ${pattern._id.disease} Outbreak`,
          description: `${pattern.count} cases of ${pattern._id.disease} reported in ${pattern._id.district}, ${pattern._id.state} in the last 24 hours`,
          severity: pattern.count >= 5 ? 'critical' : 'high',
          location: {
            state: pattern._id.state,
            district: pattern._id.district
          },
          relatedReports: pattern.reports,
          metadata: {
            affectedPopulation: pattern.count,
            estimatedRisk: pattern.count >= 5 ? 'High' : 'Medium',
            recommendedActions: [
              'Investigate water sources',
              'Deploy medical team',
              'Issue public health advisory'
            ]
          },
          priority: pattern.count >= 5 ? 9 : 7,
          createdBy: 'system'
        });

        await alert.save();
        newAlerts.push(alert);
      }
    }

    res.json({
      message: `Generated ${newAlerts.length} new alerts`,
      alerts: newAlerts
    });
  } catch (error) {
    console.error('Auto-generate alerts error:', error);
    res.status(500).json({ message: 'Error auto-generating alerts' });
  }
});

module.exports = router;
