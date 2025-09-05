# Frontend-Backend Integration Guide

## Your Current Situation & Recommendations

### 1. **User Authentication: Do You Need It?**

**For Rural Northeast India - Anonymous Reporting is BETTER:**

✅ **Advantages of Anonymous Reporting:**
- **No barriers** - immediate reporting without registration
- **Privacy protection** - sensitive health data stays private
- **Works offline** - no authentication means better offline capability
- **Lower tech literacy required** - elderly/less tech-savvy can use easily
- **Cultural acceptance** - some communities prefer anonymity for health issues

❌ **Disadvantages of requiring login:**
- **Friction** - people might not report due to registration hassle
- **Connectivity issues** - authentication requires stable internet
- **Digital literacy barriers** - rural users may struggle with accounts

### 2. **Recommended Approach: Hybrid System**

```
📱 USER SIDE (Current): Anonymous reporting ✅
👩‍⚕️ HEALTH WORKER SIDE: Login required ✅  
🏥 DASHBOARD SIDE: Admin login required ✅
```

## Integration Setup

### Step 1: Update Your Frontend to Use Backend

Replace your current form submission in `get-started/page.tsx`:

```tsx
// In your existing get-started/page.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  try {
    const response = await fetch('http://localhost:5000/api/reports/anonymous', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        patientInfo: {
          name: formData.name,
          age: parseInt(formData.age) || 0,
          gender: formData.gender || 'other'
        },
        symptoms: [{
          name: formData.symptoms,
          severity: 'moderate',
          duration: formData.duration || 'unknown'
        }],
        location: {
          state: formData.state,
          district: formData.district,
          village: formData.village
        },
        urgency: 'medium',
        notes: formData.additionalInfo
      })
    })

    if (response.ok) {
      alert('Report submitted successfully!')
      // Reset form or redirect
    } else {
      alert('Error submitting report. Please try again.')
    }
  } catch (error) {
    console.error('Submission error:', error)
    alert('Network error. Please check your connection.')
  }
}
```

### Step 2: MongoDB Connection

**You NEED MongoDB for:**
- ✅ **Storing health reports** from users
- ✅ **Dashboard analytics** for health officials  
- ✅ **Outbreak pattern detection**
- ✅ **Water quality tracking**
- ✅ **Alert system data**

**Setup MongoDB:**

```bash
# Option 1: Local MongoDB
# Install MongoDB locally and run:
mongod

# Option 2: MongoDB Atlas (Recommended)
# Sign up at mongodb.com/atlas (free tier available)
# Get connection string and update backend/.env:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nirogya
```

### Step 3: Start Both Services

```bash
# Terminal 1 - Backend
cd backend
npm run dev    # Runs on port 5000

# Terminal 2 - Frontend  
cd frontend
npm run dev    # Runs on port 3000
```

### Step 4: Connect Frontend to Backend

Update your frontend API calls:

```tsx
// In frontend/app/get-started/page.tsx
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const submitHealthReport = async (reportData: any) => {
  const response = await fetch(`${API_BASE_URL}/api/reports/anonymous`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reportData)
  })
  return response.json()
}
```

## Dashboard Integration (For Your Team)

When your friends push the dashboard code, they can use these APIs:

```javascript
// Dashboard Overview
const getDashboardData = async () => {
  const response = await fetch('/api/dashboard/overview', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })
  return response.json()
}

// Map Data
const getMapData = async () => {
  const response = await fetch('/api/dashboard/map-data?type=all', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })
  return response.json()
}

// Alerts
const getAlerts = async () => {
  const response = await fetch('/api/dashboard/alerts', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })
  return response.json()
}
```

## Testing Your Setup

### 1. Test Backend APIs
```bash
# Test anonymous report submission
curl -X POST http://localhost:5000/api/reports/anonymous \
  -H "Content-Type: application/json" \
  -d '{
    "patientInfo": {"name": "Test Patient", "age": 30, "gender": "male"},
    "symptoms": [{"name": "fever", "severity": "moderate", "duration": "2 days"}],
    "location": {"state": "Assam", "district": "Guwahati"},
    "urgency": "medium"
  }'
```

### 2. Test Frontend Integration
- Submit a report through your form
- Check browser network tab for API calls
- Verify data appears in MongoDB

## Environment Variables

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Update `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/nirogya
# OR for Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nirogya
```

## Summary

✅ **Keep anonymous reporting** - it's perfect for rural areas
✅ **Use MongoDB** - essential for data analytics and dashboards  
✅ **Your current approach is good** - just needs backend connection
❌ **Don't force user authentication** - creates barriers to reporting
