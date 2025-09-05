# Nirogya AI Toolkit

Python toolkit for extracting and analyzing health data from the Nirogya backend for AI/ML research.

## Quick Start

```python
from nirogya_data_extractor import NirogyaDataExtractor

# Initialize
extractor = NirogyaDataExtractor()

# Authenticate
token = extractor.authenticate("your_email", "your_password")

# Get training data
data = extractor.get_training_data(limit=5000)
df = extractor.to_dataframe(data)

# Engineer features
df_features = extractor.engineer_features(df)

# Prepare for ML
X, y, feature_names, encoder = extractor.prepare_ml_data(df_features)
```

## Installation

```bash
pip install pandas numpy scikit-learn requests
```

## Files

- `nirogya_data_extractor.py` - Main data extraction class
- `examples/` - Example notebooks and scripts
- `models/` - Pre-trained models (when available)

## Features

- ✅ Data extraction from MongoDB
- ✅ Feature engineering for health data
- ✅ ML-ready data preparation
- ✅ Outbreak pattern analysis
- ✅ Time series analysis
- ✅ Geographic distribution analysis
