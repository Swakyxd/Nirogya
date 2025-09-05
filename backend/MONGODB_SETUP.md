# MongoDB Atlas Connection Guide

## Your MongoDB Setup

You have 3 collections:
- `reports` - Health reports from rural users
- `alerts` - System-generated alerts for PHC dashboard  
- `users` - PHC staff who use the dashboard

## Connection Steps

### 1. Get Your MongoDB Atlas Connection String

1. Go to your MongoDB Atlas cluster
2. Click "Connect" → "Connect your application"
3. Copy the connection string (looks like this):
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database_name?retryWrites=true&w=majority
```

### 2. Update Backend Environment Variables

Update your `backend/.env` file:

```env
# Replace with your actual MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/your_database_name?retryWrites=true&w=majority

# Other settings
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
CHATBOT_API_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
DASHBOARD_URL=http://localhost:3001
```

### 3. Test the Connection

```bash
cd backend
npm run dev
```

You should see: `Connected to MongoDB` in the console.

## Collection Schema Mapping

Your collections will automatically use these schemas:

### `reports` Collection
```javascript
{
  patientInfo: {
    name: String,
    age: Number,
    gender: String,
    phoneNumber: String
  },
  symptoms: [{
    name: String,
    severity: String,
    duration: String
  }],
  location: {
    state: String,
    district: String,
    village: String,
    coordinates: { latitude: Number, longitude: Number }
  },
  urgency: String,
  status: String,
  reportType: String,
  createdAt: Date,
  updatedAt: Date
}
```

### `alerts` Collection
```javascript
{
  type: String, // 'disease_outbreak', 'critical_report', etc.
  title: String,
  description: String,
  severity: String, // 'low', 'medium', 'high', 'critical'
  location: {
    state: String,
    district: String,
    village: String
  },
  status: String, // 'active', 'investigating', 'resolved'
  relatedReports: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

### `users` Collection (PHC Staff)
```javascript
{
  name: String,
  email: String,
  password: String, // hashed
  role: String, // 'health_worker', 'admin', 'asha_worker'
  location: {
    state: String,
    district: String
  },
  phoneNumber: String,
  isVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints That Work With Your Collections

### For Rural Users (Anonymous Reports)
```
POST /api/reports/anonymous
```

### For PHC Dashboard Users
```
POST /api/auth/register    # Register PHC staff
POST /api/auth/login       # Login PHC staff
GET  /api/dashboard/overview   # Dashboard statistics
GET  /api/dashboard/alerts     # Active alerts
GET  /api/dashboard/map-data   # Map visualization data
```

## Testing Your Setup

### 1. Test Anonymous Report Submission
```bash
curl -X POST http://localhost:5000/api/reports/anonymous \
  -H "Content-Type: application/json" \
  -d '{
    "patientInfo": {
      "name": "Test Patient",
      "age": 30,
      "gender": "male"
    },
    "symptoms": [{
      "name": "fever",
      "severity": "moderate", 
      "duration": "2 days"
    }],
    "location": {
      "state": "Assam",
      "district": "Guwahati"
    },
    "urgency": "medium"
  }'
```

### 2. Test PHC User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Smith",
    "email": "dr.smith@phc.gov.in",
    "password": "secure123",
    "role": "health_worker",
    "location": {
      "state": "Assam",
      "district": "Guwahati"
    }
  }'
```

## Common Issues & Solutions

### ❌ Connection Failed
- Check your IP is whitelisted in MongoDB Atlas
- Verify username/password in connection string
- Ensure network access is configured

### ❌ Authentication Failed  
- Double-check username and password
- Make sure the database user has read/write permissions

### ❌ Database Not Found
- MongoDB Atlas will create the database automatically when first data is inserted
- Make sure database name in connection string matches your setup

## Security Notes

- ✅ Connection string is encrypted (SSL/TLS)
- ✅ IP whitelisting enabled in Atlas
- ✅ Strong password for database user
- ❌ Never commit `.env` file to git
