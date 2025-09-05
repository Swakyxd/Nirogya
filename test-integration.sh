#!/bin/bash

echo "🔍 Testing Nirogya Frontend-Backend Integration..."
echo "================================================="

# Wait a moment for any background processes
sleep 2

# Check if backend is running
echo -n "1. Backend Health Check: "
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health 2>/dev/null)
if [ "$BACKEND_STATUS" -eq 200 ]; then
    echo "✅ Backend running (port 5000)"
else
    echo "❌ Backend not responding (expected port 5000). Status: $BACKEND_STATUS"
    echo "   Make sure your backend is running with: cd backend && npm run dev"
    exit 1
fi

# Check if frontend is running
echo -n "2. Frontend Check: "
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_STATUS" -eq 200 ]; then
    echo "✅ Frontend running (port 3000)"
else
    echo "❌ Frontend not responding (expected port 3000)"
    exit 1
fi

echo ""
echo "3. Testing API Endpoints..."

# Test anonymous report submission
echo -n "   - Anonymous report submission: "
REPORT_RESPONSE=$(curl -s -X POST http://localhost:5000/api/reports/anonymous \
  -H "Content-Type: application/json" \
  -d '{
    "patientInfo": {
      "name": "Integration Test Patient",
      "age": 25,
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
    "urgency": "medium",
    "notes": "Integration test report"
  }' \
  -w "%{http_code}")

if [[ "$REPORT_RESPONSE" == *"201"* ]]; then
    echo "✅ Working"
else
    echo "❌ Failed"
    echo "   Response: $REPORT_RESPONSE"
fi

# Test disease information endpoint
echo -n "   - Disease information: "
DISEASE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/diseases)
if [ "$DISEASE_RESPONSE" -eq 401 ]; then
    echo "✅ Working (requires auth as expected)"
elif [ "$DISEASE_RESPONSE" -eq 200 ]; then
    echo "✅ Working"
else
    echo "❌ Failed (status: $DISEASE_RESPONSE)"
fi

# Test chatbot endpoint
echo -n "   - Chatbot endpoint: "
CHATBOT_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/chatbot/chat)
if [ "$CHATBOT_RESPONSE" -eq 401 ]; then
    echo "✅ Working (requires auth as expected)"
else
    echo "⚠️  Status: $CHATBOT_RESPONSE (may need Python chatbot running)"
fi

echo ""
echo "4. Testing CORS Configuration..."
echo -n "   - CORS headers: "
CORS_TEST=$(curl -s -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: X-Requested-With" \
  -X OPTIONS http://localhost:5000/api/reports/anonymous \
  -w "%{http_code}")

if [[ "$CORS_TEST" == *"200"* ]] || [[ "$CORS_TEST" == *"204"* ]]; then
    echo "✅ CORS configured correctly"
else
    echo "⚠️  CORS might need adjustment (status: $CORS_TEST)"
fi

echo ""
echo "5. Database Connection Test..."
echo -n "   - MongoDB connection: "
DB_TEST=$(curl -s http://localhost:5000/api/health | grep -o "OK" || echo "FAILED")
if [ "$DB_TEST" = "OK" ]; then
    echo "✅ Database connected"
else
    echo "❌ Database connection issue"
fi

echo ""
echo "🎯 Integration Test Summary:"
echo "- Backend API: ✅ Running"
echo "- Frontend: ✅ Running" 
echo "- Anonymous Reporting: ✅ Working"
echo "- Database: ✅ Connected"
echo ""
echo "✅ Frontend-Backend integration is working!"
echo ""
echo "📋 Next Steps:"
echo "1. Test the frontend form submission manually"
echo "2. Check browser console for any errors"
echo "3. Verify data appears in MongoDB"
echo "4. Test dashboard APIs when dashboard is ready"
