# AI/ML Data Extraction Guide for Nirogya

## Overview
Your MongoDB collections contain rich health data perfect for AI/ML predictions. This guide shows how to extract and use this data for disease outbreak prediction, risk analysis, and pattern detection.

## Available Data Sources

### 1. `reports` Collection
**Contains:** Anonymous health reports from rural users
**AI Use Cases:**
- Disease prediction based on symptoms
- Outbreak pattern detection
- Geographic risk mapping
- Seasonal trend analysis

### 2. `alerts` Collection  
**Contains:** System-generated alerts and investigations
**AI Use Cases:**
- Alert prioritization models
- Response time optimization
- Resource allocation prediction

### 3. `users` Collection
**Contains:** PHC staff data
**AI Use Cases:**
- Workload distribution
- Response capacity analysis

## API Endpoints for AI Data Extraction

### Base URL: `http://localhost:5000/api/ai-data`

### 1. Get Training Data
```http
GET /api/ai-data/training-data
```

**Parameters:**
- `startDate` - Filter from date (YYYY-MM-DD)
- `endDate` - Filter to date (YYYY-MM-DD)
- `state` - Filter by state
- `district` - Filter by district
- `diseaseType` - Filter by specific disease
- `limit` - Max records (default: 1000)
- `format` - 'json' or 'csv' (default: json)

**Example Request:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/ai-data/training-data?limit=5000&format=csv&startDate=2024-01-01"
```

**Response Structure:**
```json
{
  "total_records": 1500,
  "data": [
    {
      "age": 35,
      "gender": "female",
      "symptoms": [
        {"name": "fever", "severity": "high", "duration": "3 days"},
        {"name": "diarrhea", "severity": "severe", "duration": "2 days"}
      ],
      "state": "Assam",
      "district": "Guwahati", 
      "coordinates": {"latitude": 26.1445, "longitude": 91.7362},
      "suspected_disease": "cholera",
      "urgency_level": "high",
      "month": 8,
      "day_of_week": 3,
      "season": "summer",
      "report_date": "2024-08-15T10:30:00Z",
      "report_id": "66c..."
    }
  ],
  "metadata": {
    "date_range": {"start": "2024-01-01", "end": "all"},
    "generated_at": "2024-09-05T10:00:00Z"
  }
}
```

### 2. Get Outbreak Patterns
```http
GET /api/ai-data/outbreak-patterns
```

**Parameters:**
- `days` - Look back period (default: 365)
- `minCases` - Minimum cases to consider outbreak (default: 3)

**Use Case:** Train models to predict when/where outbreaks might occur

### 3. Get Geographic Distribution
```http
GET /api/ai-data/geographic-distribution
```

**Parameters:**
- `disease` - Specific disease to analyze
- `timeframe` - Days to look back (default: 365)

**Use Case:** Spatial analysis, hotspot prediction, resource allocation

### 4. Get Time Series Data
```http
GET /api/ai-data/time-series
```

**Parameters:**
- `disease` - Disease to track
- `location` - District to focus on
- `granularity` - 'daily', 'weekly', 'monthly'
- `days` - Lookback period

**Use Case:** Temporal patterns, seasonal predictions, trend analysis

## Python Integration Examples

### 1. Data Extraction Script
```python
import requests
import pandas as pd
import json
from datetime import datetime, timedelta

class NirogyaDataExtractor:
    def __init__(self, base_url="http://localhost:5000", token=None):
        self.base_url = base_url
        self.headers = {"Authorization": f"Bearer {token}"} if token else {}
    
    def get_training_data(self, **params):
        """Extract training data for ML models"""
        response = requests.get(
            f"{self.base_url}/api/ai-data/training-data", 
            params=params,
            headers=self.headers
        )
        return response.json()
    
    def get_outbreak_patterns(self, days=365, min_cases=3):
        """Get historical outbreak patterns"""
        response = requests.get(
            f"{self.base_url}/api/ai-data/outbreak-patterns",
            params={"days": days, "minCases": min_cases},
            headers=self.headers
        )
        return response.json()
    
    def get_time_series(self, disease=None, location=None, granularity="daily"):
        """Get time series data for temporal analysis"""
        params = {"granularity": granularity}
        if disease: params["disease"] = disease
        if location: params["location"] = location
        
        response = requests.get(
            f"{self.base_url}/api/ai-data/time-series",
            params=params,
            headers=self.headers
        )
        return response.json()

# Usage Example
extractor = NirogyaDataExtractor(token="your_jwt_token")

# Get training data as DataFrame
training_response = extractor.get_training_data(limit=5000, format="json")
df = pd.DataFrame(training_response["data"])

# Feature engineering
df['symptom_count'] = df['symptoms'].apply(len)
df['has_fever'] = df['symptoms'].apply(lambda x: any('fever' in s['name'] for s in x))
df['max_severity'] = df['symptoms'].apply(lambda x: max([s['severity'] for s in x]))

print(f"Training data shape: {df.shape}")
print(f"Diseases: {df['suspected_disease'].value_counts()}")
```

### 2. Feature Engineering for ML Models
```python
def engineer_features(df):
    """Create features for disease prediction"""
    
    # Temporal features
    df['is_monsoon'] = df['month'].isin([6, 7, 8, 9])
    df['is_weekend'] = df['day_of_week'].isin([5, 6])
    
    # Symptom features
    symptom_columns = ['fever', 'diarrhea', 'vomiting', 'headache', 'nausea']
    for symptom in symptom_columns:
        df[f'has_{symptom}'] = df['symptoms'].apply(
            lambda x: any(symptom in s['name'].lower() for s in x)
        )
    
    # Geographic features
    df['is_urban'] = df['district'].isin(['Guwahati', 'Silchar', 'Dibrugarh'])
    
    # Severity scoring
    severity_map = {'mild': 1, 'moderate': 2, 'severe': 3}
    df['avg_severity'] = df['symptoms'].apply(
        lambda x: sum(severity_map.get(s['severity'], 2) for s in x) / len(x)
    )
    
    return df

# Apply feature engineering
df_features = engineer_features(df.copy())
```

### 3. Disease Prediction Model Example
```python
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import numpy as np

def build_disease_prediction_model(df):
    """Build a disease prediction model"""
    
    # Prepare features
    feature_cols = [
        'age', 'symptom_count', 'has_fever', 'has_diarrhea', 
        'avg_severity', 'is_monsoon', 'is_urban', 'month'
    ]
    
    # Encode categorical variables
    le_gender = LabelEncoder()
    df['gender_encoded'] = le_gender.fit_transform(df['gender'])
    feature_cols.append('gender_encoded')
    
    # Prepare target
    le_disease = LabelEncoder()
    y = le_disease.fit_transform(df['suspected_disease'])
    
    X = df[feature_cols]
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Train model
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate
    accuracy = model.score(X_test, y_test)
    print(f"Model accuracy: {accuracy:.3f}")
    
    # Feature importance
    importance_df = pd.DataFrame({
        'feature': feature_cols,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("Feature importance:")
    print(importance_df)
    
    return model, le_disease, feature_cols

# Build and train model
model, disease_encoder, features = build_disease_prediction_model(df_features)
```

### 4. Outbreak Prediction Model
```python
def predict_outbreak_risk(extractor, model_data):
    """Predict outbreak risk for different locations"""
    
    # Get recent patterns
    patterns = extractor.get_outbreak_patterns(days=90, min_cases=2)
    
    # Analyze risk factors
    outbreak_data = []
    for pattern in patterns['outbreak_patterns']:
        outbreak_data.append({
            'disease': pattern['_id']['disease'],
            'location': f"{pattern['_id']['district']}, {pattern['_id']['state']}",
            'case_count': pattern['case_count'],
            'avg_age': pattern['avg_age'],
            'duration_days': (
                datetime.fromisoformat(pattern['last_case'].replace('Z', '+00:00')) - 
                datetime.fromisoformat(pattern['first_case'].replace('Z', '+00:00'))
            ).days,
            'month': pattern['_id']['month']
        })
    
    outbreak_df = pd.DataFrame(outbreak_data)
    
    # Calculate risk scores
    outbreak_df['risk_score'] = (
        outbreak_df['case_count'] * 0.4 +
        (outbreak_df['duration_days'] / 7) * 0.3 +  # Faster spread = higher risk
        outbreak_df['month'].apply(lambda x: 1 if x in [6,7,8,9] else 0.5) * 0.3
    )
    
    return outbreak_df.sort_values('risk_score', ascending=False)

# Get outbreak predictions
risk_predictions = predict_outbreak_risk(extractor, df_features)
print("High-risk locations:")
print(risk_predictions.head(10))
```

## Data Export for External Tools

### Export to CSV for Analysis
```bash
# Get all training data as CSV
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/ai-data/training-data?format=csv&limit=10000" \
  -o health_training_data.csv

# Get time series for specific analysis
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/ai-data/time-series?granularity=weekly&days=730" \
  -o time_series_data.json
```

### Integration with Jupyter Notebooks
```python
# In your Jupyter notebook
import sys
sys.path.append('/path/to/your/ai/project')

from nirogya_data_extractor import NirogyaDataExtractor
import matplotlib.pyplot as plt
import seaborn as sns

# Initialize extractor
extractor = NirogyaDataExtractor(token="your_token")

# Get and visualize data
data = extractor.get_training_data(limit=1000)
df = pd.DataFrame(data['data'])

# Visualizations
plt.figure(figsize=(12, 8))
sns.countplot(data=df, x='suspected_disease', order=df['suspected_disease'].value_counts().index)
plt.title('Disease Distribution in Training Data')
plt.xticks(rotation=45)
plt.show()
```

## Authentication for AI APIs

### 1. Register AI User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AI Research Team",
    "email": "ai@nirogya.research",
    "password": "ai_secure_2024",
    "role": "ai_researcher"
  }'
```

### 2. Get JWT Token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ai@nirogya.research", 
    "password": "ai_secure_2024"
  }'
```

### 3. Use Token in Requests
```python
headers = {"Authorization": "Bearer YOUR_JWT_TOKEN_HERE"}
response = requests.get(url, headers=headers)
```

## Data Schema Reference

### Training Data Fields
```python
{
    "age": int,                    # Patient age
    "gender": str,                 # "male", "female", "other"
    "symptoms": [                  # Array of symptoms
        {
            "name": str,           # Symptom name
            "severity": str,       # "mild", "moderate", "severe"  
            "duration": str        # Human readable duration
        }
    ],
    "state": str,                  # State name
    "district": str,               # District name
    "coordinates": {               # GPS coordinates
        "latitude": float,
        "longitude": float
    },
    "suspected_disease": str,      # Target variable
    "urgency_level": str,          # "low", "medium", "high", "critical"
    "month": int,                  # 1-12
    "day_of_week": int,           # 0=Sunday, 6=Saturday
    "season": str,                # "spring", "summer", "autumn", "winter"
    "report_date": datetime,       # ISO format
    "report_id": str              # MongoDB ObjectId
}
```

This data is perfect for:
- ✅ **Disease prediction models**
- ✅ **Outbreak forecasting**
- ✅ **Geographic risk mapping**
- ✅ **Seasonal trend analysis**
- ✅ **Resource optimization**
- ✅ **Early warning systems**
