const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['disease_outbreak', 'critical_report', 'water_contamination', 'resource_shortage'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  location: {
    state: String,
    district: String,
    village: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  relatedReports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report'
  }],
  status: {
    type: String,
    enum: ['active', 'investigating', 'resolved', 'false_alarm'],
    default: 'active'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  priority: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  metadata: {
    affectedPopulation: Number,
    estimatedRisk: String,
    recommendedActions: [String]
  },
  createdBy: {
    type: String,
    default: 'system' // Can be 'system' for auto-generated or user ID
  },
  resolvedAt: Date,
  notes: String
}, {
  timestamps: true
});

// Index for efficient querying
alertSchema.index({ status: 1, severity: 1, createdAt: -1 });
alertSchema.index({ "location.state": 1, "location.district": 1 });

module.exports = mongoose.model('Alert', alertSchema, 'alerts');
