const express = require('express');
const HealthReport = require('../models/HealthReport');
const Alert = require('../models/Alert');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Middleware to check admin/health worker access
const requireAdminAccess = (req, res, next) => {
  if (!['admin', 'health_worker'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied. Admin or health worker role required.' });
  }
  next();
};

// Dashboard overview statistics
router.get('/overview', auth, requireAdminAccess, async (req, res) => {
  try {
    const { state, district, days = 30 } = req.query;
    
    const dateFilter = {
      createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
    };
    
    let locationFilter = {};
    if (state) locationFilter['location.state'] = state;
    if (district) locationFilter['location.district'] = district;

    // Health Reports Statistics
    const [
      totalReports,
      pendingReports,
      criticalReports,
      resolvedReports,
      recentReports,
      totalAlerts,
      activeAlerts
    ] = await Promise.all([
      HealthReport.countDocuments({ ...locationFilter }),
      HealthReport.countDocuments({ ...locationFilter, status: 'pending' }),
      HealthReport.countDocuments({ ...locationFilter, urgency: 'critical' }),
      HealthReport.countDocuments({ ...locationFilter, status: 'resolved', ...dateFilter }),
      HealthReport.find({ ...locationFilter, ...dateFilter })
        .populate('reporter', 'name location')
        .sort({ createdAt: -1 })
        .limit(10),
      Alert.countDocuments({ ...locationFilter }),
      Alert.countDocuments({ ...locationFilter, status: 'active' })
    ]);

    // Disease outbreak patterns
    const diseasePatterns = await HealthReport.aggregate([
      { $match: { ...locationFilter, ...dateFilter } },
      { $unwind: '$suspectedDiseases' },
      {
        $group: {
          _id: '$suspectedDiseases',
          count: { $sum: 1 },
          locations: { $addToSet: '$location.district' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Geographic hotspots
    const hotspots = await HealthReport.aggregate([
      { $match: { ...locationFilter, ...dateFilter } },
      {
        $group: {
          _id: {
            state: '$location.state',
            district: '$location.district'
          },
          reportCount: { $sum: 1 },
          criticalCount: {
            $sum: { $cond: [{ $eq: ['$urgency', 'critical'] }, 1, 0] }
          }
        }
      },
      { $sort: { reportCount: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      healthReports: {
        total: totalReports,
        pending: pendingReports,
        critical: criticalReports,
        resolved: resolvedReports,
        recent: recentReports
      },
      alerts: {
        total: totalAlerts,
        active: activeAlerts
      },
      diseasePatterns,
      hotspots,
      timeframe: `${days} days`,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
});

// Geographic data for map visualization
router.get('/map-data', auth, requireAdminAccess, async (req, res) => {
  try {
    const { state, district, type = 'reports' } = req.query;
    
    let locationFilter = {};
    if (state) locationFilter['location.state'] = state;
    if (district) locationFilter['location.district'] = district;

    let mapData = [];

    if (type === 'reports' || type === 'all') {
      const reports = await HealthReport.find({
        ...locationFilter,
        'location.coordinates.latitude': { $exists: true },
        'location.coordinates.longitude': { $exists: true }
      }).select('location urgency status suspectedDiseases createdAt');

      mapData = mapData.concat(reports.map(report => ({
        type: 'health_report',
        coordinates: [
          report.location.coordinates.longitude,
          report.location.coordinates.latitude
        ],
        properties: {
          urgency: report.urgency,
          status: report.status,
          diseases: report.suspectedDiseases,
          date: report.createdAt,
          location: `${report.location.district}, ${report.location.state}`
        }
      })));
    }

    if (type === 'alerts' || type === 'all') {
      const alerts = await Alert.find({
        ...locationFilter,
        status: 'active',
        'location.coordinates.latitude': { $exists: true },
        'location.coordinates.longitude': { $exists: true }
      }).select('location type severity title createdAt');

      mapData = mapData.concat(alerts.map(alert => ({
        type: 'alert',
        coordinates: [
          alert.location.coordinates.longitude,
          alert.location.coordinates.latitude
        ],
        properties: {
          alertType: alert.type,
          severity: alert.severity,
          title: alert.title,
          date: alert.createdAt,
          location: `${alert.location.district}, ${alert.location.state}`
        }
      })));
    }

    res.json({
      type: 'FeatureCollection',
      features: mapData.map(item => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: item.coordinates
        },
        properties: {
          ...item.properties,
          dataType: item.type
        }
      }))
    });
  } catch (error) {
    console.error('Map data error:', error);
    res.status(500).json({ message: 'Error fetching map data' });
  }
});

// Alert system - get active alerts
router.get('/alerts', auth, requireAdminAccess, async (req, res) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Critical health reports in last 24 hours
    const criticalReports = await HealthReport.find({
      urgency: 'critical',
      status: { $in: ['pending', 'investigating'] },
      createdAt: { $gte: last24Hours }
    }).populate('reporter', 'name location');

    // Active alerts
    const activeAlerts = await Alert.find({
      status: 'active',
      createdAt: { $gte: last7Days }
    });

    // Disease outbreak patterns (multiple cases in same area)
    const outbreakAlerts = await HealthReport.aggregate([
      {
        $match: {
          createdAt: { $gte: last7Days },
          status: { $ne: 'resolved' }
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
        $match: { count: { $gte: 3 } } // 3 or more cases in same area
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      critical: {
        healthReports: criticalReports,
        activeAlerts: activeAlerts,
        outbreaks: outbreakAlerts
      },
      summary: {
        totalCritical: criticalReports.length,
        activeAlerts: activeAlerts.length,
        potentialOutbreaks: outbreakAlerts.length
      },
      generatedAt: now
    });
  } catch (error) {
    console.error('Alerts error:', error);
    res.status(500).json({ message: 'Error fetching alerts' });
  }
});

// User management for admins
router.get('/users', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { role, state, page = 1, limit = 50 } = req.query;
    
    let query = {};
    if (role) query.role = role;
    if (state) query['location.state'] = state;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    // User statistics
    const userStats = await User.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      userStats
    });
  } catch (error) {
    console.error('User management error:', error);
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

module.exports = router;
