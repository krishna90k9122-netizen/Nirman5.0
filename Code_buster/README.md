# LokAI - AI for Smarter Cities

A full-stack AI-powered citizen complaint system with OTP verification, NLP processing, and predictive analytics for smarter city management.

## 🌟 Features

### 🏙️ Smart City Management
- **AI-Powered Complaint Processing**: Automatic sentiment analysis, urgency detection, and category prediction
- **Real-time Dashboard**: Comprehensive analytics with charts, trends, and heatmaps
- **Predictive Analytics**: 7-day trend forecasting for resource planning
- **Geographic Visualization**: Interactive heatmap showing complaint hotspots



### 📱 User Experience
- **Mobile-First Design**: Responsive interface optimized for all devices
- **Real-Time Updates**: Live status updates and notifications
- **Intuitive Navigation**: Clean, modern UI with Tailwind CSS
- **Progressive Enhancement**: Graceful degradation for older browsers

## 🏗️ Architecture

### Backend (FastAPI)
```
backend/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration management
│   ├── database/
│   │   ├── mongo.py         # MongoDB connection and utilities
│   │   └── models.py        # Pydantic models and schemas
│   ├── api/
│   │   ├── dependencies.py  # API dependencies
│   │   └── routes/
│   │       ├── otp.py       # OTP verification endpoints
│   │       ├── complaints.py # Complaint management
│   │       ├── dashboard.py  # Analytics and dashboard
│   │       └── sentiment.py # Sentiment analysis
│   ├── services/
│   │   ├── nlp_service.py   # NLP processing engine
│   │   ├── otp_service.py   # OTP management service
│   │   └── prediction_service.py # Trend forecasting
│   ├── utils/
│   │   ├── logger.py        # Logging configuration
│   │   ├── data_cleaning.py # Text preprocessing
│   │   └── helpers.py       # Utility functions
│   └── tests/               # Test suite
├── requirements.txt         # Python dependencies
├── .env.example            # Environment variables template
└── README.md               # Backend documentation
```

### Frontend (React + Tailwind)
```
frontend/
├── public/                 # Static assets
├── src/
│   ├── pages/
│   │   ├── SubmitComplaint.jsx  # Citizen complaint submission
│   │   ├── VerifyOtp.jsx         # OTP verification
│   │   ├── Dashboard.jsx         # Admin dashboard
│   │   └── Heatmap.jsx           # Geographic visualization
│   ├── components/
│   │   ├── Navbar.jsx            # Navigation component
│   │   ├── ComplaintCard.jsx     # Complaint display card
│   │   ├── StatsBox.jsx          # Statistics display
│   │   └── Loader.jsx            # Loading component
│   ├── services/
│   │   └── api.js                # API client with axios
│   ├── App.jsx                   # Main application component
│   ├── main.jsx                  # React entry point
│   ├── index.css                 # Global styles
│   └── App.css                   # App-specific styles
├── package.json            # Node.js dependencies
├── tailwind.config.js      # Tailwind CSS configuration
└── README.md               # Frontend documentation
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB 4.4+
- Redis 6.0+ (optional, fallback to in-memory)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start MongoDB and Redis**
   ```bash
   # MongoDB
   mongod

   # Redis (optional)
   redis-server
   ```

6. **Run the application**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

## 📊 API Documentation

### OTP Endpoints
- `POST /api/otp/send` - Send OTP to phone number
- `POST /api/otp/verify` - Verify OTP code
- `GET /api/otp/status/{phone}` - Get OTP status

### Complaint Endpoints
- `POST /api/complaints/submit` - Submit new complaint
- `GET /api/complaints/` - List complaints with filters
- `GET /api/complaints/{id}` - Get specific complaint
- `PUT /api/complaints/{id}` - Update complaint status
- `DELETE /api/complaints/{id}` - Delete complaint

### Dashboard Endpoints
- `GET /api/dashboard/summary` - Dashboard summary statistics
- `GET /api/dashboard/heatmap` - Geographic heatmap data
- `GET /api/dashboard/trends` - Trend analysis data
- `GET /api/dashboard/predictions` - 7-day predictions

Visit `http://localhost:8000/docs` for interactive API documentation.

## 🤖 NLP Features

### Sentiment Analysis
- **Positive**: Happy, satisfied, resolved complaints
- **Negative**: Angry, frustrated, urgent issues
- **Neutral**: Information requests, general inquiries

### Urgency Detection
- **High**: Emergency situations, safety hazards
- **Medium**: Standard complaints requiring attention
- **Low**: Suggestions, minor issues

### Category Prediction
- **Road**: Potholes, traffic signals, street maintenance
- **Water**: Supply issues, leaks, drainage problems
- **Electricity**: Power outages, wiring issues
- **Garbage**: Collection, disposal, sanitation
- **Safety**: Security, lighting, public safety
- **Health**: Medical facilities, public health

## 📈 Predictive Analytics

The system uses machine learning to predict complaint trends:
- **Linear Regression**: For trend prediction
- **Feature Engineering**: Time-based features, lag variables
- **Confidence Scoring**: Reliability assessment
- **7-Day Forecast**: Short-term planning support

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database Configuration
MONGODB_URL=mongodb://localhost:27017/lokai
REDIS_URL=redis://localhost:6379

# Application Configuration
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Environment
ENVIRONMENT=development
DEBUG=True

# CORS Configuration
ALLOWED_ORIGINS=["http://localhost:3000", "http://localhost:5173"]

# Rate Limiting
OTP_RATE_LIMIT_PER_HOUR=3

# Logging
LOG_LEVEL=INFO
```

#### Frontend
```env
REACT_APP_API_URL=http://localhost:8000
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest app/tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📦 Deployment

### Backend (Render/Heroku)
1. Set environment variables
2. Configure MongoDB Atlas
4. Deploy the application

### Frontend (Netlify/Vercel)
1. Build the application: `npm run build`
2. Deploy the `build/` directory
3. Configure environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Email: support@lokai.com
- Documentation: [Wiki](https://github.com/your-username/lokai/wiki)

## 🌟 Acknowledgments

- FastAPI for the amazing web framework
- React for the frontend library
- Tailwind CSS for the utility-first CSS framework
- MongoDB for the database
- Redis for caching
- OpenStreetMap for map tiles

---

**LokAI - Making Cities Smarter, One Complaint at a Time** 🏙️
