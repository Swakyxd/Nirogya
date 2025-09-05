# Nirogya

## Smart Community Health Monitoring and Early Warning System for Water-Borne Diseases in Rural Northeast India

### Problem Statement

Water-borne diseases such as diarrhea, cholera, typhoid, and hepatitis A are widespread in rural and tribal areas of Northeast India, especially during the monsoon season. These outbreaks are often caused by contaminated water sources, poor sanitation, and delayed medical response. The region's challenging terrain and remoteness make timely health monitoring and intervention difficult.

### Background

The Northeastern Region (NER) faces unique challenges in healthcare delivery due to its geography and infrastructure. Nirogya aims to bridge these gaps by leveraging technology for proactive health surveillance and community empowerment.

### Solution Overview

Nirogya is a digital health platform designed to detect, monitor, and help prevent outbreaks of water-borne diseases in vulnerable communities. The system features:

- **Data Collection:** Health data from local clinics, ASHA workers, and community volunteers via web app reports.
- **AI/ML Outbreak Prediction:** Models analyze symptoms and seasonal trends to predict potential outbreaks.
- **Real-Time Alerts:** Notifications for district health officials and local governance bodies.
- **Multilingual Mobile Interface:** Community reporting and awareness campaigns in local languages.
- **Dashboards:** Visualization tools for health departments to track hotspots, interventions, and resource allocation.
- **Educational Modules:** Hygiene awareness and disease prevention content.
- **Offline Support:** Functionality for areas with limited connectivity and support for tribal languages.

### Features

- Web app for data collection and health reporting
- AI-powered outbreak prediction engine
- Alert system for authorities and local leaders
- Educational modules for communities
- Multilingual support

## 🏗️ Project Structure

```
SIH/
├── frontend/                 # Next.js user interface
├── backend/                  # Express.js API server
├── AI chatbot/              # Python AI chatbot
├── data/                    # ML models and datasets
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- MongoDB
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/Swakyxd/SIH.git
cd SIH
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Configure your environment variables
npm run dev          # Start development server on port 5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev          # Start development server on port 3000
```

### 4. AI Chatbot Setup
```bash
cd "AI chatbot"
pip install -r requirements.txt  # Create requirements.txt if needed
python chatbot.py               # Start chatbot server
```

### 5. Database Setup
- Install MongoDB or use MongoDB Atlas (recommended)
- Create 3 collections: `reports`, `alerts`, `users`
- Update `MONGODB_URI` in backend/.env with your connection string
- The application will use these specific collection names

## 🔧 Configuration

### Backend Environment Variables (.env)
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nirogya
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
CHATBOT_API_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
DASHBOARD_URL=http://localhost:3001
```

## 📱 Usage

1. **User Registration:** Anonymous reporting for rural users, account-based access for PHC staff
2. **Report Health Issues:** Submit symptoms and location data anonymously
3. **AI Assistance:** Chat with the AI for disease information
4. **Alert Management:** PHC staff can monitor and manage health alerts
5. **Dashboard:** Health officials can monitor trends and critical situations

## 🛠️ Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express.js, MongoDB, Mongoose
- **AI/ML:** Python, SQLite, Natural Language Processing
- **Authentication:** JWT tokens
- **Deployment:** Ready for cloud deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
