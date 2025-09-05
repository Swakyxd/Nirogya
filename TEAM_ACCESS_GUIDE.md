# Team MongoDB Access Guide

## Database Users Created:

### Development Team Access
- **Username:** `nirogya_dev_team`
- **Password:** `DevTeam2024!`
- **Permissions:** Read and write to any database
- **Use for:** Local development, testing APIs

### Dashboard Team Access  
- **Username:** `nirogya_dashboard`
- **Password:** `Dashboard2024!`
- **Permissions:** Read and write to any database
- **Use for:** Dashboard development

### Testing Access
- **Username:** `nirogya_test`
- **Password:** `TestUser2024!`
- **Permissions:** Read and write to any database
- **Use for:** Running tests, temporary data

## Connection Strings for Each Team:

### Backend Development Team:
```env
MONGODB_URI=mongodb+srv://nirogya_dev_team:DevTeam2024!@cluster0.6wdt0ge.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

### Dashboard Development Team:
```env
MONGODB_URI=mongodb+srv://nirogya_dashboard:Dashboard2024!@cluster0.6wdt0ge.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

### Testing Team:
```env
MONGODB_URI=mongodb+srv://nirogya_test:TestUser2024!@cluster0.6wdt0ge.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

## Setup Instructions for Teammates:

### 1. Clone the Repository
```bash
git clone https://github.com/Swakyxd/SIH.git
cd SIH/backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create .env File
```bash
cp .env.example .env
```

### 4. Update .env with Team Connection String
```env
PORT=5000
MONGODB_URI=mongodb+srv://nirogya_dev_team:DevTeam2024!@cluster0.6wdt0ge.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=team_jwt_secret_key_2024
NODE_ENV=development
CHATBOT_API_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
DASHBOARD_URL=http://localhost:3001
```

### 5. Test Connection
```bash
npm run dev
```

Should see: "Connected to MongoDB" ✅

### 6. Run Connection Test
```bash
node test-connection.js
```

## Collections Structure:

### `reports` Collection
- Health reports from rural users
- Anonymous submissions
- Geographic data for mapping

### `alerts` Collection  
- System-generated alerts
- PHC dashboard notifications
- Outbreak pattern alerts

### `users` Collection
- PHC staff accounts
- Dashboard user authentication
- Role-based access control

## Security Notes:

- ✅ Each team member has individual database access
- ✅ Passwords are team-specific (change for production)
- ✅ IP whitelisting configured for team locations
- ✅ Connection strings use SSL/TLS encryption
- ⚠️ Don't commit .env files to git
- ⚠️ Use different credentials for production

## Troubleshooting:

### Connection Issues:
1. Check IP address is whitelisted in Atlas
2. Verify username/password spelling
3. Ensure internet connectivity
4. Check firewall settings

### Permission Issues:
1. Verify database user has correct permissions
2. Check collection access rights
3. Confirm user is assigned to correct database

## Team Workflow:

1. **Backend Team:** Use dev_team credentials for API development
2. **Dashboard Team:** Use dashboard credentials for frontend work  
3. **Testing:** Use test credentials for running tests
4. **Production:** Will use separate production credentials
