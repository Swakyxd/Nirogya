# Dashboard API Guide

## How Dashboard APIs Work

The dashboard APIs are designed to provide health officials and administrators with comprehensive data visualization and management capabilities. Here's how they work:

### 1. Overview API (`GET /api/dashboard/overview`)
**Purpose:** Provides summary statistics for the dashboard homepage

**Sample Response:**
```json
{
  "healthReports": {
    "total": 150,
    "pending": 25,
    "critical": 8,
    "resolved": 120,
    "recent": [/* array of recent reports */]
  },
  "waterQuality": {
    "totalTests": 75,
    "unsafeSources": 12,
    "recentTests": [/* array of recent tests */]
  },
  "diseasePatterns": [
    {
      "_id": "Cholera",
      "count": 15,
      "locations": ["Guwahati", "Silchar"]
    }
  ],
  "hotspots": [/* areas with high report counts */]
}
```

### 2. Map Data API (`GET /api/dashboard/map-data`)
**Purpose:** Provides geographic data for map visualization

**Query Parameters:**
- `type`: 'reports', 'water', or 'all'
- `state`: Filter by state
- `district`: Filter by district

**Sample Response:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [91.7362, 26.1445]
      },
      "properties": {
        "dataType": "health_report",
        "urgency": "high",
        "diseases": ["Cholera"],
        "location": "Guwahati, Assam"
      }
    }
  ]
}
```

### 3. Alerts API (`GET /api/dashboard/alerts`)
**Purpose:** Shows critical alerts requiring immediate attention

**Sample Response:**
```json
{
  "critical": {
    "healthReports": [/* critical reports */],
    "unsafeWater": [/* contaminated water sources */],
    "outbreaks": [/* potential disease outbreaks */]
  },
  "summary": {
    "totalCritical": 5,
    "unsafeWaterSources": 3,
    "potentialOutbreaks": 1
  }
}
```

## Frontend Integration Examples

### React/Next.js Usage:

```javascript
// Dashboard Overview Component
const DashboardOverview = () => {
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetch('/api/dashboard/overview', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => setDashboardData(data));
  }, []);

  return (
    <div>
      <h2>Health Reports: {dashboardData?.healthReports.total}</h2>
      <p>Critical: {dashboardData?.healthReports.critical}</p>
      {/* Render charts, maps, etc. */}
    </div>
  );
};
```

### Map Integration:
```javascript
// Map Component
const HealthMap = () => {
  const [mapData, setMapData] = useState(null);

  useEffect(() => {
    fetch('/api/dashboard/map-data?type=all', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setMapData(data));
  }, []);

  // Use with Leaflet, Google Maps, or Mapbox
  return <MapComponent data={mapData} />;
};
```

## Testing Without Dashboard Frontend

You can test these APIs using:

### 1. Postman/Thunder Client
```
GET http://localhost:5000/api/dashboard/overview
Headers: Authorization: Bearer YOUR_JWT_TOKEN
```

### 2. Curl Commands
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/dashboard/overview
```

### 3. Simple HTML Test Page
Create a test file to see the API responses in your browser.

## Required Authentication

All dashboard APIs require:
- Valid JWT token in Authorization header
- User role: 'admin' or 'health_worker'

## Sample Test Data

To populate your database with test data for dashboard testing, you can use the health reports and water quality submission APIs with sample data.
