const mongoose = require('mongoose');

const healthReportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow anonymous reports
  },
  patientInfo: {
    name: String,
    age: Number,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    phoneNumber: String
  },
  symptoms: [{
    name: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      default: 'mild'
    },
    duration: String // e.g., "2 days", "1 week"
  }],
  suspectedDiseases: [String],
  location: {
    state: String,
    district: String,
    village: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  waterSource: {
    type: {
      type: String,
      enum: ['well', 'borehole', 'river', 'pond', 'piped', 'other']
    },
    quality: {
      type: String,
      enum: ['good', 'poor', 'contaminated', 'unknown']
    },
    lastTested: Date
  },
  reportType: {
    type: String,
    enum: ['individual', 'community_outbreak', 'suspected_contamination', 'anonymous'],
    default: 'individual'
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'investigating', 'resolved', 'escalated'],
    default: 'pending'
  },
  notes: String,
  attachments: [{
    filename: String,
    url: String,
    type: String
  }],
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date
}, {
  timestamps: true
});

// Index for geospatial queries
healthReportSchema.index({ "location.coordinates": "2dsphere" });

module.exports = mongoose.model('Report', healthReportSchema, 'reports');
