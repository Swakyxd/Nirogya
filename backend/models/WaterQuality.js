const mongoose = require('mongoose');

const waterQualitySchema = new mongoose.Schema({
  location: {
    state: {
      type: String,
      required: true
    },
    district: {
      type: String,
      required: true
    },
    village: String,
    coordinates: {
      latitude: {
        type: Number,
        required: true
      },
      longitude: {
        type: Number,
        required: true
      }
    }
  },
  waterSource: {
    type: {
      type: String,
      enum: ['well', 'borehole', 'river', 'pond', 'piped', 'other'],
      required: true
    },
    name: String,
    depth: Number // for wells/boreholes
  },
  testResults: {
    pH: {
      value: Number,
      status: {
        type: String,
        enum: ['safe', 'caution', 'unsafe']
      }
    },
    turbidity: {
      value: Number,
      unit: {
        type: String,
        default: 'NTU'
      },
      status: {
        type: String,
        enum: ['safe', 'caution', 'unsafe']
      }
    },
    coliform: {
      value: Number,
      unit: {
        type: String,
        default: 'CFU/100ml'
      },
      status: {
        type: String,
        enum: ['safe', 'caution', 'unsafe']
      }
    },
    chlorine: {
      value: Number,
      unit: {
        type: String,
        default: 'mg/L'
      },
      status: {
        type: String,
        enum: ['safe', 'caution', 'unsafe']
      }
    },
    tds: {
      value: Number,
      unit: {
        type: String,
        default: 'mg/L'
      },
      status: {
        type: String,
        enum: ['safe', 'caution', 'unsafe']
      }
    }
  },
  overallQuality: {
    type: String,
    enum: ['safe', 'caution', 'unsafe'],
    required: true
  },
  testedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  testDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  testMethod: {
    type: String,
    enum: ['manual_kit', 'laboratory'],
    required: true
  },
  notes: String,
  recommendations: [String]
}, {
  timestamps: true
});

// Index for geospatial queries
waterQualitySchema.index({ "location.coordinates": "2dsphere" });

module.exports = mongoose.model('WaterQuality', waterQualitySchema);
