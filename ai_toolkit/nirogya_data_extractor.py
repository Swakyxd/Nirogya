import requests
import pandas as pd
import json
from datetime import datetime, timedelta
import numpy as np

class NirogyaDataExtractor:
    """
    Python class to extract health data from Nirogya backend for AI/ML analysis
    """
    
    def __init__(self, base_url="http://localhost:5000", token=None):
        self.base_url = base_url
        self.headers = {"Authorization": f"Bearer {token}"} if token else {}
    
    def authenticate(self, email, password):
        """Login and get JWT token"""
        response = requests.post(
            f"{self.base_url}/api/auth/login",
            json={"email": email, "password": password}
        )
        if response.status_code == 200:
            token = response.json()["token"]
            self.headers = {"Authorization": f"Bearer {token}"}
            return token
        else:
            raise Exception(f"Authentication failed: {response.text}")
    
    def get_training_data(self, **params):
        """
        Extract training data for ML models
        
        Parameters:
        - startDate: Start date (YYYY-MM-DD)
        - endDate: End date (YYYY-MM-DD)  
        - state: State filter
        - district: District filter
        - diseaseType: Disease filter
        - limit: Max records (default: 1000)
        - format: 'json' or 'csv'
        """
        response = requests.get(
            f"{self.base_url}/api/ai-data/training-data", 
            params=params,
            headers=self.headers
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"API Error: {response.text}")
    
    def get_outbreak_patterns(self, days=365, min_cases=3):
        """Get historical outbreak patterns for prediction models"""
        response = requests.get(
            f"{self.base_url}/api/ai-data/outbreak-patterns",
            params={"days": days, "minCases": min_cases},
            headers=self.headers
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"API Error: {response.text}")
    
    def get_geographic_distribution(self, disease=None, timeframe=365):
        """Get geographic distribution for spatial analysis"""
        params = {"timeframe": timeframe}
        if disease:
            params["disease"] = disease
            
        response = requests.get(
            f"{self.base_url}/api/ai-data/geographic-distribution",
            params=params,
            headers=self.headers
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"API Error: {response.text}")
    
    def get_time_series(self, disease=None, location=None, granularity="daily", days=365):
        """Get time series data for temporal analysis"""
        params = {"granularity": granularity, "days": days}
        if disease: 
            params["disease"] = disease
        if location: 
            params["location"] = location
        
        response = requests.get(
            f"{self.base_url}/api/ai-data/time-series",
            params=params,
            headers=self.headers
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"API Error: {response.text}")
    
    def to_dataframe(self, api_response, data_key="data"):
        """Convert API response to pandas DataFrame"""
        if data_key in api_response:
            return pd.DataFrame(api_response[data_key])
        else:
            return pd.DataFrame(api_response)
    
    def engineer_features(self, df):
        """
        Perform feature engineering on health data
        
        Args:
            df: DataFrame with raw health data
            
        Returns:
            DataFrame with engineered features
        """
        df = df.copy()
        
        # Temporal features
        df['is_monsoon'] = df['month'].isin([6, 7, 8, 9])
        df['is_weekend'] = df['day_of_week'].isin([5, 6])
        df['is_winter'] = df['season'] == 'winter'
        
        # Symptom features
        common_symptoms = ['fever', 'diarrhea', 'vomiting', 'headache', 'nausea', 'cough']
        for symptom in common_symptoms:
            df[f'has_{symptom}'] = df['symptoms'].apply(
                lambda x: any(symptom in str(s.get('name', '')).lower() for s in x) if isinstance(x, list) else False
            )
        
        # Symptom severity and count
        df['symptom_count'] = df['symptoms'].apply(lambda x: len(x) if isinstance(x, list) else 0)
        
        severity_map = {'mild': 1, 'moderate': 2, 'severe': 3}
        df['avg_severity'] = df['symptoms'].apply(
            lambda x: np.mean([severity_map.get(s.get('severity', 'moderate'), 2) for s in x]) if isinstance(x, list) and len(x) > 0 else 2
        )
        df['max_severity'] = df['symptoms'].apply(
            lambda x: max([severity_map.get(s.get('severity', 'moderate'), 2) for s in x]) if isinstance(x, list) and len(x) > 0 else 2
        )
        
        # Geographic features
        major_cities = ['Guwahati', 'Silchar', 'Dibrugarh', 'Tezpur', 'Jorhat']
        df['is_urban'] = df['district'].isin(major_cities)
        
        # Age groups
        df['age_group'] = pd.cut(df['age'], 
                                bins=[0, 5, 18, 40, 60, 100], 
                                labels=['infant', 'child', 'adult', 'middle_age', 'elderly'])
        
        # Risk scoring
        df['risk_score'] = (
            df['max_severity'] * 0.3 +
            df['symptom_count'] * 0.2 +
            (df['age'] > 60).astype(int) * 0.3 +
            (df['age'] < 5).astype(int) * 0.2
        )
        
        return df
    
    def prepare_ml_data(self, df, target_col='suspected_disease'):
        """
        Prepare data for machine learning
        
        Args:
            df: DataFrame with engineered features
            target_col: Column name for target variable
            
        Returns:
            X (features), y (target), feature_names
        """
        from sklearn.preprocessing import LabelEncoder
        
        # Select feature columns
        feature_cols = [
            'age', 'symptom_count', 'avg_severity', 'max_severity', 'risk_score',
            'is_monsoon', 'is_weekend', 'is_winter', 'is_urban', 'month'
        ]
        
        # Add symptom features
        symptom_features = [col for col in df.columns if col.startswith('has_')]
        feature_cols.extend(symptom_features)
        
        # Encode categorical variables
        if 'gender' in df.columns:
            le_gender = LabelEncoder()
            df['gender_encoded'] = le_gender.fit_transform(df['gender'].fillna('unknown'))
            feature_cols.append('gender_encoded')
        
        if 'age_group' in df.columns:
            le_age_group = LabelEncoder()
            df['age_group_encoded'] = le_age_group.fit_transform(df['age_group'].astype(str))
            feature_cols.append('age_group_encoded')
        
        # Prepare features and target
        X = df[feature_cols].fillna(0)
        
        if target_col in df.columns:
            le_target = LabelEncoder()
            y = le_target.fit_transform(df[target_col].fillna('unknown'))
            return X, y, feature_cols, le_target
        else:
            return X, None, feature_cols, None

# Example usage and testing
if __name__ == "__main__":
    # Initialize extractor
    extractor = NirogyaDataExtractor()
    
    try:
        # Authenticate (replace with actual credentials)
        # token = extractor.authenticate("ai@nirogya.research", "ai_secure_2024")
        # print(f"Authenticated successfully!")
        
        # Get training data
        print("Fetching training data...")
        training_response = extractor.get_training_data(limit=100)
        print(f"Retrieved {training_response.get('total_records', 0)} records")
        
        # Convert to DataFrame
        df = extractor.to_dataframe(training_response)
        print(f"DataFrame shape: {df.shape}")
        print(f"Columns: {list(df.columns)}")
        
        # Engineer features
        print("\nEngineering features...")
        df_features = extractor.engineer_features(df)
        print(f"Features added. New shape: {df_features.shape}")
        
        # Prepare for ML
        print("\nPreparing for ML...")
        X, y, feature_names, label_encoder = extractor.prepare_ml_data(df_features)
        print(f"Feature matrix shape: {X.shape}")
        if y is not None:
            print(f"Target classes: {label_encoder.classes_}")
        
        # Get outbreak patterns
        print("\nFetching outbreak patterns...")
        outbreak_data = extractor.get_outbreak_patterns(days=90)
        print(f"Found {len(outbreak_data.get('outbreak_patterns', []))} outbreak patterns")
        
        # Get time series
        print("\nFetching time series data...")
        ts_data = extractor.get_time_series(granularity="weekly", days=180)
        print(f"Time series periods: {ts_data.get('total_periods', 0)}")
        
        print("\n✅ Data extraction successful! Ready for AI/ML analysis.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nMake sure:")
        print("1. Backend server is running (npm run dev)")
        print("2. You have valid authentication credentials")
        print("3. Database contains some sample data")
