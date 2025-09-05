# Nirogya Backend

Express.js backend API for the Nirogya health monitoring system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Copy `.env` file and update with your values:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `CHATBOT_API_URL`: URL of your Python chatbot API

3. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Health Reports
- `POST /api/reports` - Submit health report
- `GET /api/reports` - Get health reports (filtered)
- `GET /api/reports/:id` - Get specific report
- `PATCH /api/reports/:id/status` - Update report status
- `GET /api/reports/area/nearby` - Get nearby reports

### Water Quality
- `POST /api/water-quality` - Submit water test results
- `GET /api/water-quality` - Get water quality data
- `GET /api/water-quality/location` - Get location-based data
- `GET /api/water-quality/stats` - Get statistics

### Chatbot
- `POST /api/chatbot/chat` - Chat with AI assistant
- `GET /api/chatbot/diseases/:name` - Get disease info
- `GET /api/chatbot/history` - Get chat history

### Diseases
- `GET /api/diseases` - Get disease information
- `GET /api/diseases/:name` - Get specific disease
- `POST /api/diseases/search-by-symptoms` - Search by symptoms
- `GET /api/diseases/prevention/guidelines` - Get prevention tips

### Dashboard (Admin/Health Workers)
- `GET /api/dashboard/overview` - Dashboard statistics
- `GET /api/dashboard/map-data` - Geographic data for maps
- `GET /api/dashboard/alerts` - Active alerts
- `GET /api/dashboard/users` - User management

## Authentication

Include JWT token in requests:
```
Authorization: Bearer <your_jwt_token>
```

## User Roles

- `user`: General public, can submit reports
- `asha_worker`: Community health worker
- `health_worker`: Healthcare professional
- `admin`: System administrator

## MongoDB Models

### User
- Personal information and authentication
- Location and role-based access
- Contact details and language preference

### HealthReport
- Symptom reporting and patient info
- Location and water source details
- Status tracking and verification

### WaterQuality
- Water test results and parameters
- Source information and testing method
- Quality assessment and recommendations
