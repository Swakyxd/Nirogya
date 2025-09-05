const express = require('express');
const { body, validationResult } = require('express-validator');
const HealthReport = require('../models/HealthReport');
const Alert = require('../models/Alert');
const auth = require('../middleware/auth');

const router = express.Router();

// Create anonymous health report (no authentication required)
router.post('/anonymous', [
  body('symptoms').isArray({ min: 1 }).withMessage('At least one symptom is required'),
  body('location.state').notEmpty().withMessage('State is required'),
  body('location.district').notEmpty().withMessage('District is required'),
  body('patientInfo.name').notEmpty().withMessage('Patient name is required'),
  body('patientInfo.age').isInt({ min: 0, max: 120 }).withMessage('Valid age is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Create anonymous report without reporter reference
    const reportData = {
      ...req.body,
      // No reporter field for anonymous submissions
      reportType: 'anonymous',
      status: 'pending'
    };

    const report = new HealthReport(reportData);
    await report.save();

    res.status(201).json({
      message: 'Anonymous health report submitted successfully',
      reportId: report._id,
      status: 'pending'
    });
  } catch (error) {
    console.error('Anonymous report creation error:', error);
    res.status(500).json({ message: 'Error creating health report' });
  }
});

// Create a new health report (authenticated)
router.post('/', auth, [
  body('symptoms').isArray({ min: 1 }).withMessage('At least one symptom is required'),
  body('location.state').notEmpty().withMessage('State is required'),
  body('location.district').notEmpty().withMessage('District is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const reportData = {
      ...req.body,
      reporter: req.user.userId
    };

    const report = new HealthReport(reportData);
    await report.save();

    // Populate reporter info
    await report.populate('reporter', 'name email role');

    res.status(201).json({
      message: 'Health report submitted successfully',
      report
    });
  } catch (error) {
    console.error('Report creation error:', error);
    res.status(500).json({ message: 'Error creating health report' });
  }
});

// Get all reports (with filtering)
router.get('/', auth, async (req, res) => {
  try {
    const { status, urgency, state, district, page = 1, limit = 20 } = req.query;
    
    let query = {};
    
    // Role-based filtering
    if (req.user.role === 'user') {
      query.reporter = req.user.userId;
    }
    
    // Add filters
    if (status) query.status = status;
    if (urgency) query.urgency = urgency;
    if (state) query['location.state'] = state;
    if (district) query['location.district'] = district;

    const reports = await HealthReport.find(query)
      .populate('reporter', 'name email role')
      .populate('verifiedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await HealthReport.countDocuments(query);

    res.json({
      reports,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Error fetching reports' });
  }
});

// Get a specific report
router.get('/:id', auth, async (req, res) => {
  try {
    const report = await HealthReport.findById(req.params.id)
      .populate('reporter', 'name email role location')
      .populate('verifiedBy', 'name email');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if user can access this report
    if (req.user.role === 'user' && report.reporter._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(report);
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ message: 'Error fetching report' });
  }
});

// Update report status (for health workers/admins)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (!['health_worker', 'admin', 'asha_worker'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, notes } = req.body;
    
    const report = await HealthReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    report.status = status;
    if (notes) report.notes = notes;
    
    if (status === 'investigating' || status === 'resolved') {
      report.verifiedBy = req.user.userId;
      report.verifiedAt = new Date();
    }

    await report.save();
    await report.populate('verifiedBy', 'name email');

    res.json({
      message: 'Report status updated successfully',
      report
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ message: 'Error updating report' });
  }
});

// Get reports in a geographic area
router.get('/area/nearby', auth, async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query; // radius in km

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const reports = await HealthReport.find({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      }
    })
    .populate('reporter', 'name email role')
    .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error('Nearby reports error:', error);
    res.status(500).json({ message: 'Error fetching nearby reports' });
  }
});

module.exports = router;
