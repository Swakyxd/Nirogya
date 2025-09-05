const express = require('express');
const { body, validationResult } = require('express-validator');
const WaterQuality = require('../models/WaterQuality');
const auth = require('../middleware/auth');

const router = express.Router();

// Submit water quality test results
router.post('/', auth, [
  body('location.state').notEmpty().withMessage('State is required'),
  body('location.district').notEmpty().withMessage('District is required'),
  body('location.coordinates.latitude').isFloat().withMessage('Valid latitude is required'),
  body('location.coordinates.longitude').isFloat().withMessage('Valid longitude is required'),
  body('waterSource.type').isIn(['well', 'borehole', 'river', 'pond', 'piped', 'other']).withMessage('Invalid water source type'),
  body('testMethod').isIn(['manual_kit', 'laboratory']).withMessage('Invalid test method'),
  body('overallQuality').isIn(['safe', 'caution', 'unsafe']).withMessage('Invalid quality status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const waterQualityData = {
      ...req.body,
      testedBy: req.user.userId
    };

    const waterQuality = new WaterQuality(waterQualityData);
    await waterQuality.save();

    await waterQuality.populate('testedBy', 'name email role');

    res.status(201).json({
      message: 'Water quality test results submitted successfully',
      waterQuality
    });
  } catch (error) {
    console.error('Water quality submission error:', error);
    res.status(500).json({ message: 'Error submitting water quality data' });
  }
});

// Get water quality data with filtering
router.get('/', auth, async (req, res) => {
  try {
    const { state, district, quality, testMethod, page = 1, limit = 20, startDate, endDate } = req.query;
    
    let query = {};
    
    // Add filters
    if (state) query['location.state'] = state;
    if (district) query['location.district'] = district;
    if (quality) query.overallQuality = quality;
    if (testMethod) query.testMethod = testMethod;
    
    // Date range filter
    if (startDate || endDate) {
      query.testDate = {};
      if (startDate) query.testDate.$gte = new Date(startDate);
      if (endDate) query.testDate.$lte = new Date(endDate);
    }

    const waterQualityData = await WaterQuality.find(query)
      .populate('testedBy', 'name email role')
      .sort({ testDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await WaterQuality.countDocuments(query);

    res.json({
      waterQualityData,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get water quality error:', error);
    res.status(500).json({ message: 'Error fetching water quality data' });
  }
});

// Get water quality data for a specific location
router.get('/location', auth, async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query; // radius in km

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const waterQualityData = await WaterQuality.find({
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
    .populate('testedBy', 'name email role')
    .sort({ testDate: -1 });

    res.json(waterQualityData);
  } catch (error) {
    console.error('Location water quality error:', error);
    res.status(500).json({ message: 'Error fetching location-based water quality data' });
  }
});

// Get water quality statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const { state, district, startDate, endDate } = req.query;
    
    let matchQuery = {};
    if (state) matchQuery['location.state'] = state;
    if (district) matchQuery['location.district'] = district;
    if (startDate || endDate) {
      matchQuery.testDate = {};
      if (startDate) matchQuery.testDate.$gte = new Date(startDate);
      if (endDate) matchQuery.testDate.$lte = new Date(endDate);
    }

    const stats = await WaterQuality.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$overallQuality',
          count: { $sum: 1 },
          avgpH: { $avg: '$testResults.pH.value' },
          avgTurbidity: { $avg: '$testResults.turbidity.value' },
          avgColiform: { $avg: '$testResults.coliform.value' }
        }
      }
    ]);

    const totalTests = await WaterQuality.countDocuments(matchQuery);
    
    res.json({
      totalTests,
      qualityDistribution: stats,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Water quality stats error:', error);
    res.status(500).json({ message: 'Error fetching water quality statistics' });
  }
});

module.exports = router;
