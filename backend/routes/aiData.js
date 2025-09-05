const express = require('express');
const HealthReport = require('../models/HealthReport');
const Alert = require('../models/Alert');
const auth = require('../middleware/auth');

const router = express.Router();

// Middleware for AI/ML team access
const requireAIAccess = (req, res, next) => {
  if (!['admin', 'health_worker', 'ai_researcher'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied. AI research access required.' });
  }
  next();
};

// Get training data for disease prediction models
router.get('/training-data', auth, requireAIAccess, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      state, 
      district, 
      diseaseType,
      limit = 1000,
      format = 'json' 
    } = req.query;

    let query = {};
    
    // Date filtering
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    // Location filtering
    if (state) query['location.state'] = state;
    if (district) query['location.district'] = district;
    
    // Disease filtering
    if (diseaseType) query.suspectedDiseases = { $in: [diseaseType] };

    const reports = await HealthReport.find(query)
      .select('patientInfo symptoms location suspectedDiseases urgency status createdAt')
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Transform data for ML models
    const trainingData = reports.map(report => ({
      // Patient features
      age: report.patientInfo.age,
      gender: report.patientInfo.gender,
      
      // Symptom features
      symptoms: report.symptoms.map(s => ({
        name: s.name.toLowerCase(),
        severity: s.severity,
        duration: s.duration
      })),
      
      // Location features
      state: report.location.state,
      district: report.location.district,
      coordinates: report.location.coordinates,
      
      // Target variables
      suspected_disease: report.suspectedDiseases[0] || 'unknown',
      urgency_level: report.urgency,
      
      // Temporal features
      month: new Date(report.createdAt).getMonth() + 1,
      day_of_week: new Date(report.createdAt).getDay(),
      season: getSeason(new Date(report.createdAt)),
      
      // Metadata
      report_date: report.createdAt,
      report_id: report._id
    }));

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(trainingData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=health_training_data.csv');
      return res.send(csv);
    }

    res.json({
      total_records: trainingData.length,
      data: trainingData,
      metadata: {
        date_range: {
          start: startDate || 'all',
          end: endDate || 'all'
        },
        location_filter: { state, district },
        generated_at: new Date()
      }
    });

  } catch (error) {
    console.error('Training data export error:', error);
    res.status(500).json({ message: 'Error exporting training data' });
  }
});

// Get outbreak pattern data for prediction models
router.get('/outbreak-patterns', auth, requireAIAccess, async (req, res) => {
  try {
    const { days = 365, minCases = 3 } = req.query;
    
    const dateFilter = {
      createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
    };

    // Aggregate outbreak patterns
    const patterns = await HealthReport.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            disease: { $arrayElemAt: ['$suspectedDiseases', 0] },
            state: '$location.state',
            district: '$location.district',
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          case_count: { $sum: 1 },
          avg_age: { $avg: '$patientInfo.age' },
          severity_distribution: {
            $push: '$urgency'
          },
          first_case: { $min: '$createdAt' },
          last_case: { $max: '$createdAt' },
          coordinates: { $push: '$location.coordinates' }
        }
      },
      {
        $match: { case_count: { $gte: parseInt(minCases) } }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1, case_count: -1 }
      }
    ]);

    res.json({
      outbreak_patterns: patterns,
      parameters: { days, minCases },
      total_patterns: patterns.length,
      generated_at: new Date()
    });

  } catch (error) {
    console.error('Outbreak patterns error:', error);
    res.status(500).json({ message: 'Error fetching outbreak patterns' });
  }
});

// Get geographic disease distribution for spatial analysis
router.get('/geographic-distribution', auth, requireAIAccess, async (req, res) => {
  try {
    const { disease, timeframe = 365 } = req.query;
    
    let query = {
      createdAt: { $gte: new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000) }
    };
    
    if (disease) {
      query.suspectedDiseases = { $in: [disease] };
    }

    const distribution = await HealthReport.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            state: '$location.state',
            district: '$location.district'
          },
          total_cases: { $sum: 1 },
          diseases: { $push: { $arrayElemAt: ['$suspectedDiseases', 0] } },
          avg_coordinates: {
            $avg: {
              lat: '$location.coordinates.latitude',
              lng: '$location.coordinates.longitude'
            }
          },
          urgency_levels: { $push: '$urgency' },
          case_dates: { $push: '$createdAt' }
        }
      },
      {
        $project: {
          location: '$_id',
          total_cases: 1,
          disease_frequency: {
            $reduce: {
              input: '$diseases',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  { $arrayToObject: [[ { k: '$$this', v: { $add: [{ $ifNull: [{ $getField: { field: '$$this', input: '$$value' } }, 0] }, 1] } } ]] }
                ]
              }
            }
          },
          coordinates: '$avg_coordinates',
          severity_score: {
            $avg: {
              $switch: {
                branches: [
                  { case: { $eq: ['$$urgency', 'low'] }, then: 1 },
                  { case: { $eq: ['$$urgency', 'medium'] }, then: 2 },
                  { case: { $eq: ['$$urgency', 'high'] }, then: 3 },
                  { case: { $eq: ['$$urgency', 'critical'] }, then: 4 }
                ],
                default: 2
              }
            }
          }
        }
      },
      { $sort: { total_cases: -1 } }
    ]);

    res.json({
      geographic_distribution: distribution,
      parameters: { disease, timeframe },
      total_locations: distribution.length,
      generated_at: new Date()
    });

  } catch (error) {
    console.error('Geographic distribution error:', error);
    res.status(500).json({ message: 'Error fetching geographic distribution' });
  }
});

// Get time series data for temporal analysis
router.get('/time-series', auth, requireAIAccess, async (req, res) => {
  try {
    const { 
      disease, 
      location, 
      granularity = 'daily', // daily, weekly, monthly
      days = 365 
    } = req.query;

    let query = {
      createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
    };
    
    if (disease) query.suspectedDiseases = { $in: [disease] };
    if (location) query['location.district'] = location;

    let groupBy = {};
    if (granularity === 'daily') {
      groupBy = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      };
    } else if (granularity === 'weekly') {
      groupBy = {
        year: { $year: '$createdAt' },
        week: { $week: '$createdAt' }
      };
    } else if (granularity === 'monthly') {
      groupBy = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      };
    }

    const timeSeries = await HealthReport.aggregate([
      { $match: query },
      {
        $group: {
          _id: groupBy,
          case_count: { $sum: 1 },
          avg_age: { $avg: '$patientInfo.age' },
          male_cases: {
            $sum: { $cond: [{ $eq: ['$patientInfo.gender', 'male'] }, 1, 0] }
          },
          female_cases: {
            $sum: { $cond: [{ $eq: ['$patientInfo.gender', 'female'] }, 1, 0] }
          },
          critical_cases: {
            $sum: { $cond: [{ $eq: ['$urgency', 'critical'] }, 1, 0] }
          },
          diseases: { $push: { $arrayElemAt: ['$suspectedDiseases', 0] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
    ]);

    res.json({
      time_series: timeSeries,
      parameters: { disease, location, granularity, days },
      total_periods: timeSeries.length,
      generated_at: new Date()
    });

  } catch (error) {
    console.error('Time series error:', error);
    res.status(500).json({ message: 'Error fetching time series data' });
  }
});

// Helper functions
function getSeason(date) {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      return `"${value}"`;
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
}

module.exports = router;
