# 📦 Gudangku AI - Intelligent Logistics & Document Management System

> **AI-Powered Logistics Suite** with Sales Forecasting, Document Assistant, and Smart Analytics

[![FastAPI](https://img.shields.io/badge/FastAPI-0.127.1-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-0.15.0-2D3748?logo=prisma)](https://www.prisma.io/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com/)
[![Deploy](https://img.shields.io/badge/Deploy-Render%20%2B%20Vercel-00A98F)](https://gudangku-ai.onrender.com)

---

## 🚀 Features

### 📊 **Sales Forecasting (Prophet ML)**
- **Time Series Analysis** using Facebook Prophet algorithm
- **Interactive Visualizations** with Plotly.js
- **Automated Predictions** with confidence intervals
- **Excel/CSV Upload** support
- **Historical Tracking** with database persistence

### 🤖 **AI Document Assistant (Groq LLaMA)**
- **Intelligent Q&A** powered by Groq's LLaMA models
- **RAG (Retrieval-Augmented Generation)** with LangChain
- **PDF Document Processing** with context-aware responses
- **Chat History** with feedback system
- **Markdown Formatting** in responses

### 📈 **Analytics Dashboard**
- **Real-time Metrics** for inventory and predictions
- **Interactive Charts** (Line, Bar, Area charts)
- **Date Range Filtering** 
- **Export Capabilities** (PDF, Excel)

### 🔐 **Authentication & Security**
- **Supabase Auth** with Row-Level Security (RLS)
- **JWT Token** validation
- **Role-Based Access Control** (RBAC ready)
- **CORS Protection** with whitelist

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React + TS)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐   │
│  │Dashboard │  │Forecaster│  │Assistant │  │  Auth   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘   │
│       │             │              │             │         │
│       └─────────────┴──────────────┴─────────────┘         │
│                         │                                   │
│                    Axios Client                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                      HTTPS/REST
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  Backend (FastAPI + Python)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  API Layer (FastAPI)                 │  │
│  │  /api/forecasting  │  /api/assistant  │  /api/history│  │
│  └─────────┬─────────────────┬─────────────────┬────────┘  │
│            │                 │                 │            │
│  ┌─────────▼─────┐  ┌────────▼────────┐  ┌────▼──────┐   │
│  │Prophet Service│  │  Groq Service   │  │Prisma ORM │   │
│  │  (ML Model)   │  │ (LLM + RAG)     │  │ (Database)│   │
│  └───────────────┘  └─────────────────┘  └───────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                   ┌────────▼────────┐
                   │  Supabase DB    │
                   │  (PostgreSQL)   │
                   │  + RLS Policies │
                   └─────────────────┘
```

---

## 📁 Project Structure

```
gudangku-ai-core/
├── be/                          # Backend (FastAPI)
│   ├── app/
│   │   ├── api/
│   │   │   └── endpoints/       # API route handlers
│   │   │       ├── forecasting.py  # Prophet forecasting endpoints
│   │   │       └── assistant.py    # AI assistant endpoints
│   │   ├── core/
│   │   │   ├── config.py        # Environment config
│   │   │   └── db.py            # Prisma database connection
│   │   ├── routers/
│   │   │   └── history.py       # History tracking endpoints
│   │   ├── services/
│   │   │   └── groq_service.py  # Groq LLM integration
│   │   └── main.py              # FastAPI app initialization
│   ├── prisma/
│   │   └── schema.prisma        # Database schema
│   ├── build.sh                 # Render build script
│   ├── requirements.txt         # Python dependencies
│   └── .env                     # Backend environment variables
│
├── fe/                          # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── auth/            # Authentication components
│   │   │   ├── charts/          # Chart visualizations
│   │   │   └── layout/          # Layout components
│   │   ├── pages/
│   │   │   ├── auth/            # Login/Register pages
│   │   │   └── dashboard/       # Dashboard pages
│   │   │       ├── DashboardHome.tsx  # Main dashboard
│   │   │       ├── Forecaster.tsx     # Forecasting interface
│   │   │       └── Assistant.tsx      # AI chat interface
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/
│   │   │   └── supabaseClient.ts  # Supabase client config
│   │   └── App.tsx              # Root component
│   ├── package.json             # Node dependencies
│   ├── vite.config.ts           # Vite configuration
│   └── vercel.json              # Vercel deployment config
│
├── LEARNING.md                  # 📚 Learning guide (comprehensive)
├── DEPLOYMENT_GUIDE.md          # 🚀 Deployment instructions
└── README.md                    # This file
```

---

## 🛠️ Tech Stack

### **Backend**
| Technology | Version | Purpose |
|------------|---------|---------|
| **FastAPI** | 0.127.1 | High-performance async web framework |
| **Prisma Python** | 0.15.0 | Type-safe ORM for PostgreSQL |
| **Prophet** | 1.2.1 | Facebook's time series forecasting |
| **LangChain** | 1.2.5 | LLM orchestration framework |
| **Groq** | 0.37.1 | Ultra-fast LLM inference API |
| **Pandas** | 2.3.3 | Data manipulation |
| **Matplotlib/Plotly** | 3.10.8 / 6.5.0 | Data visualization |
| **Uvicorn** | 0.40.0 | ASGI server |

### **Frontend**
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI library |
| **TypeScript** | 5.6.2 | Type safety |
| **Vite** | 5.4.11 | Build tool |
| **Ant Design** | 5.22.6 | UI component library |
| **Recharts** | 2.15.0 | Chart library |
| **Supabase JS** | 2.47.10 | Authentication client |
| **Axios** | 1.7.9 | HTTP client |

### **Database & Infrastructure**
- **Supabase** - Managed PostgreSQL with RLS
- **Render** - Backend hosting (Docker containers)
- **Vercel** - Frontend hosting (Edge Network)
- **ImageKit** - CDN for media assets

---

## 🚦 Getting Started

### **Prerequisites**
```bash
# Required software
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ (or Supabase account)
- Git
```

### **1. Clone Repository**
```bash
git clone https://github.com/otaruram/Logistic-Dokumen.git
cd gudangku-ai-core-main
```

### **2. Backend Setup**

#### Install Python Dependencies
```bash
cd be
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

#### Configure Environment Variables
Create `be/.env`:
```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"
DIRECT_URL="postgresql://user:password@host:5432/dbname"

# API Keys
GROQ_API_KEY="your_groq_api_key"

# Server Config
BACKEND_DOMAINS="http://localhost:8000,https://gudangku-ai.onrender.com"
PROJECT_NAME="Gudangku AI"
VERSION="1.0.0"
API_V1_STR="/api"
PORT=8000
```

#### Initialize Prisma Database
```bash
prisma generate --schema=prisma/schema.prisma
prisma db push --schema=prisma/schema.prisma
```

#### Run Backend Server
```bash
uvicorn app.main:app --reload --port 8000
```

Backend will be available at: http://localhost:8000

### **3. Frontend Setup**

#### Install Node Dependencies
```bash
cd fe
npm install
```

#### Configure Environment Variables
Create `fe/.env`:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:8000
```

#### Run Frontend Dev Server
```bash
npm run dev
```

Frontend will be available at: http://localhost:5173

---

## 🔑 API Documentation

### **Forecasting Endpoints**

#### **POST** `/api/predict`
Upload CSV/Excel for sales forecasting
```bash
curl -X POST "http://localhost:8000/api/predict" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@sales_data.csv"
```

**Response:**
```json
{
  "forecast": [
    {"ds": "2024-01-01", "yhat": 1250.5, "yhat_lower": 1100, "yhat_upper": 1400}
  ],
  "plot_json": "{...plotly_chart_data...}"
}
```

### **Assistant Endpoints**

#### **POST** `/api/chat`
Ask questions to AI assistant
```bash
curl -X POST "http://localhost:8000/api/chat" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is inventory turnover?"}'
```

**Response:**
```json
{
  "answer": "Inventory turnover is a metric that shows...",
  "sources": ["document_1.pdf"]
}
```

### **History Endpoints**

#### **GET** `/api/history/predictions`
Get prediction history
```bash
curl -X GET "http://localhost:8000/api/history/predictions" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Full API docs available at: http://localhost:8000/docs (Swagger UI)

---

## 🌐 Deployment

### **Backend (Render)**
1. Connect GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy using `be/build.sh` script
4. Auto-deploys on push to `main` branch

### **Frontend (Vercel)**
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Build command: `npm run build`
4. Output directory: `dist`
5. Auto-deploys on push to `main` branch

**Live URLs:**
- Backend: https://gudangku-ai.onrender.com
- Frontend: https://gudangku-steel.vercel.app

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

---

## 🧪 Testing

### Backend Tests
```bash
cd be
pytest tests/
```

### Frontend Tests
```bash
cd fe
npm run test
```

---

## 📊 Database Schema

```prisma
model Product {
  id           String   @id @default(uuid())
  name         String
  sku          String   @unique
  category     String?
  stockLevel   Int      @default(0)
  reorderPoint Int      @default(10)
  forecasts    Forecast[]
}

model Forecast {
  id             String   @id @default(uuid())
  productId      String?
  product        Product? @relation(fields: [productId], references: [id])
  forecastDate   DateTime
  predictedValue Float
  lowerBound     Float
  upperBound     Float
}

model Document {
  id       String   @id @default(uuid())
  title    String
  content  String   @db.Text
  category String?
}

model ChatLog {
  id        String   @id @default(uuid())
  question  String
  answer    String   @db.Text
  isHelpful Boolean?
}

model PredictionHistory {
  id       String   @id @default(uuid())
  filename String
  plotData Json
}
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 Environment Variables Reference

### Backend (.env)
| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `DIRECT_URL` | Direct database connection (for migrations) | ✅ |
| `GROQ_API_KEY` | Groq API key for LLM | ✅ |
| `BACKEND_DOMAINS` | Allowed CORS origins | ✅ |
| `PROJECT_NAME` | Project display name | ❌ |
| `VERSION` | API version | ❌ |
| `PORT` | Server port | ❌ |

### Frontend (.env)
| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `VITE_API_BASE_URL` | Backend API URL | ✅ |

---

## 🐛 Troubleshooting

### Common Issues

#### **Problem:** Prisma binary not found on Render
**Solution:** Make sure `build.sh` has execute permissions:
```bash
chmod +x build.sh
```

#### **Problem:** CORS errors in frontend
**Solution:** Add frontend URL to `BACKEND_DOMAINS` in backend `.env`:
```env
BACKEND_DOMAINS="http://localhost:5173,https://gudangku-steel.vercel.app"
```

#### **Problem:** Forecasting fails with "not enough data"
**Solution:** Upload CSV with at least 30 rows of historical data

#### **Problem:** Authentication token expired
**Solution:** Clear browser localStorage and re-login:
```javascript
localStorage.clear()
```

---

## 📚 Learning Resources

For in-depth learning about the technologies used, see:
- **[LEARNING.md](./LEARNING.md)** - Comprehensive learning guide
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Deployment instructions

### External Resources
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Prophet Documentation](https://facebook.github.io/prophet/)
- [LangChain Documentation](https://python.langchain.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [React Documentation](https://react.dev/)

---

## 📄 License

This project is proprietary and confidential. All rights reserved.

---

## 👥 Team

**Developer:** otaruram  
**Repository:** [github.com/otaruram/Logistic-Dokumen](https://github.com/otaruram/Logistic-Dokumen)

---

## 🎯 Roadmap

- [x] Sales forecasting with Prophet
- [x] AI document assistant with RAG
- [x] Authentication with Supabase
- [x] Dashboard analytics
- [ ] Real-time notifications
- [ ] Mobile app (React Native)
- [ ] Inventory management automation
- [ ] Multi-language support
- [ ] Advanced reporting (PDF exports)
- [ ] Integration with ERP systems

---

**⭐ If you find this project useful, please give it a star!**
