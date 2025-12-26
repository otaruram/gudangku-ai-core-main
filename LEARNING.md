# 📚 LEARNING.md - Comprehensive Learning Guide

> **Deep dive into Gudangku AI's technology stack, architecture patterns, and best practices**

Welcome to the complete learning guide for the Gudangku AI project! This document will teach you everything you need to know about the technologies, patterns, and concepts used in this application.

---

## 📖 Table of Contents

1. [Backend Technologies](#backend-technologies)
   - [FastAPI Framework](#fastapi-framework)
   - [Prisma ORM](#prisma-orm)
   - [Prophet ML](#prophet-ml)
   - [LangChain & RAG](#langchain--rag)
   - [Groq LLM](#groq-llm)
2. [Frontend Technologies](#frontend-technologies)
   - [React & TypeScript](#react--typescript)
   - [Vite Build Tool](#vite-build-tool)
   - [Ant Design](#ant-design)
   - [State Management](#state-management)
3. [Architecture Patterns](#architecture-patterns)
4. [Database Design](#database-design)
5. [Authentication & Security](#authentication--security)
6. [Deployment & DevOps](#deployment--devops)
7. [Best Practices](#best-practices)
8. [Troubleshooting Guide](#troubleshooting-guide)

---

## Backend Technologies

### FastAPI Framework

FastAPI is a modern, high-performance Python web framework for building APIs.

#### Key Concepts

**1. Async/Await Pattern**
```python
# app/main.py
from fastapi import FastAPI
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to database
    await connect_db()
    yield  # Application runs
    # Shutdown: Disconnect from database
    await disconnect_db()

app = FastAPI(lifespan=lifespan)
```

**Why async?**
- Non-blocking I/O operations
- Better performance with database queries
- Handle multiple requests concurrently

**2. Dependency Injection**
```python
from fastapi import Depends, HTTPException
from app.core.db import db

async def get_current_user(token: str = Depends(oauth2_scheme)):
    # Validate token and return user
    user = await db.user.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user

# Use in route
@app.get("/api/profile")
async def get_profile(user = Depends(get_current_user)):
    return user
```

**3. Request Validation with Pydantic**
```python
from pydantic import BaseModel, Field
from typing import Optional

class PredictRequest(BaseModel):
    periods: int = Field(default=30, ge=1, le=365, description="Days to forecast")
    include_history: bool = Field(default=False)
    
    class Config:
        json_schema_extra = {
            "example": {
                "periods": 90,
                "include_history": True
            }
        }
```

**4. Automatic OpenAPI Documentation**
FastAPI automatically generates:
- `/docs` - Swagger UI
- `/redoc` - ReDoc UI
- `/openapi.json` - OpenAPI schema

**5. CORS Middleware**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://gudangku-steel.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],  # Accept, Content-Type, Authorization, etc.
)
```

**Learning Resources:**
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Async Python Tutorial](https://realpython.com/async-io-python/)
- [Pydantic Models](https://docs.pydantic.dev/)

---

### Prisma ORM

Prisma is a next-generation ORM (Object-Relational Mapping) tool for Python.

#### Key Concepts

**1. Schema Definition**
```prisma
// prisma/schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // For migrations (bypasses connection pooler)
}

generator client {
  provider             = "prisma-client-py"
  interface            = "asyncio"
  recursive_type_depth = 5  // For nested relations
  binaryTargets        = ["native", "debian-openssl-3.0.x"]  // For deployment
}

model Product {
  id           String     @id @default(uuid())
  name         String
  sku          String     @unique
  stockLevel   Int        @default(0)
  forecasts    Forecast[]  // One-to-many relation
  
  @@map("products")  // Table name in database
}

model Forecast {
  id        String   @id @default(uuid())
  productId String?
  product   Product? @relation(fields: [productId], references: [id])
  
  @@map("forecasts")
}
```

**2. Database Operations**

**Create:**
```python
from app.core.db import db

# Create single record
product = await db.product.create(
    data={
        "name": "Laptop Dell XPS 13",
        "sku": "DELL-XPS-13",
        "stockLevel": 50
    }
)

# Create with relations
product = await db.product.create(
    data={
        "name": "ThinkPad",
        "sku": "TP-X1",
        "forecasts": {
            "create": [
                {"forecastDate": "2024-01-01", "predictedValue": 100},
                {"forecastDate": "2024-01-02", "predictedValue": 105}
            ]
        }
    }
)
```

**Read:**
```python
# Find unique
product = await db.product.find_unique(where={"id": "123"})

# Find many with filters
products = await db.product.find_many(
    where={
        "stockLevel": {"lt": 10},  # Less than 10
        "category": {"in": ["Electronics", "Gadgets"]}  # In list
    },
    order={"createdAt": "desc"},
    take=20,  # Limit
    skip=0    # Offset for pagination
)

# Include relations
product = await db.product.find_unique(
    where={"id": "123"},
    include={"forecasts": True}  # Include all forecasts
)
```

**Update:**
```python
# Update single
product = await db.product.update(
    where={"id": "123"},
    data={"stockLevel": {"increment": 10}}  # Atomic increment
)

# Update many
count = await db.product.update_many(
    where={"category": "Electronics"},
    data={"reorderPoint": 20}
)
```

**Delete:**
```python
# Delete single
await db.product.delete(where={"id": "123"})

# Delete many
count = await db.product.delete_many(
    where={"stockLevel": {"equals": 0}}
)
```

**3. Migrations**

```bash
# Push schema changes to database (dev only)
prisma db push --schema=prisma/schema.prisma

# Generate Prisma Client
prisma generate --schema=prisma/schema.prisma

# Create migration (production)
prisma migrate dev --name add_forecasts_table
```

**4. Binary Targets**

Prisma uses platform-specific query engine binaries:
- `native` - Your local machine
- `debian-openssl-3.0.x` - Render, most cloud platforms
- `darwin-arm64` - macOS M1/M2
- `windows` - Windows

```prisma
generator client {
  binaryTargets = ["native", "debian-openssl-3.0.x"]
}
```

**Learning Resources:**
- [Prisma Python Docs](https://prisma-client-py.readthedocs.io/)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

---

### Prophet ML

Facebook Prophet is a time series forecasting library.

#### Key Concepts

**1. Time Series Forecasting**

Prophet decomposes time series into:
- **Trend** - Long-term increase/decrease
- **Seasonality** - Repeating patterns (daily, weekly, yearly)
- **Holidays** - Special events affecting data
- **Noise** - Random variation

**2. Data Format**

Prophet requires two columns:
- `ds` - Date (datetime)
- `y` - Value to forecast (numeric)

```python
import pandas as pd

# Example data
df = pd.DataFrame({
    'ds': ['2023-01-01', '2023-01-02', '2023-01-03'],
    'y': [100, 120, 115]
})
df['ds'] = pd.to_datetime(df['ds'])
```

**3. Basic Forecasting**

```python
from prophet import Prophet

# Initialize model
model = Prophet(
    yearly_seasonality=True,   # Detect yearly patterns
    weekly_seasonality=True,   # Detect weekly patterns
    daily_seasonality=False,   # Disable daily patterns
    changepoint_prior_scale=0.05  # Flexibility of trend changes
)

# Fit model
model.fit(df)

# Make future dataframe
future = model.make_future_dataframe(periods=30)  # 30 days ahead

# Predict
forecast = model.predict(future)

# forecast contains:
# - yhat: predicted value
# - yhat_lower: lower confidence bound
# - yhat_upper: upper confidence bound
```

**4. Handling Seasonality**

```python
# Add custom seasonality
model.add_seasonality(
    name='monthly',
    period=30.5,
    fourier_order=5
)

# Add holidays
from prophet.make_holidays import make_holidays_df
holidays = make_holidays_df(
    year_list=[2023, 2024],
    country='ID'  # Indonesia
)
model = Prophet(holidays=holidays)
```

**5. Visualization**

```python
import matplotlib.pyplot as plt

# Plot forecast
fig1 = model.plot(forecast)
plt.title('Sales Forecast')
plt.show()

# Plot components
fig2 = model.plot_components(forecast)
plt.show()
```

**6. Integration in Gudangku AI**

```python
# app/api/endpoints/forecasting.py
from fastapi import APIRouter, UploadFile, File
import pandas as pd
from prophet import Prophet
import json

router = APIRouter()

@router.post("/predict")
async def predict_sales(file: UploadFile = File(...)):
    # Read uploaded file
    if file.filename.endswith('.csv'):
        df = pd.read_csv(file.file)
    elif file.filename.endswith('.xlsx'):
        df = pd.read_excel(file.file)
    
    # Validate columns
    if 'ds' not in df.columns or 'y' not in df.columns:
        raise HTTPException(400, "File must have 'ds' and 'y' columns")
    
    # Clean data
    df['ds'] = pd.to_datetime(df['ds'])
    df = df[['ds', 'y']].dropna()
    
    # Train model
    model = Prophet()
    model.fit(df)
    
    # Forecast 90 days
    future = model.make_future_dataframe(periods=90)
    forecast = model.predict(future)
    
    # Convert to JSON for API response
    forecast_json = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].to_dict('records')
    
    # Create plotly chart
    import plotly.graph_objects as go
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=df['ds'], 
        y=df['y'],
        name='Historical',
        mode='markers'
    ))
    fig.add_trace(go.Scatter(
        x=forecast['ds'],
        y=forecast['yhat'],
        name='Forecast',
        line=dict(color='blue')
    ))
    
    return {
        "forecast": forecast_json,
        "plot": fig.to_json()
    }
```

**Learning Resources:**
- [Prophet Documentation](https://facebook.github.io/prophet/)
- [Time Series Analysis Tutorial](https://www.kaggle.com/learn/time-series)

---

### LangChain & RAG

LangChain is a framework for building LLM-powered applications. RAG (Retrieval-Augmented Generation) enhances LLM responses with external knowledge.

#### Key Concepts

**1. What is RAG?**

Traditional LLM:
```
User Question → LLM → Answer
```

RAG Pattern:
```
User Question → Retrieve Relevant Documents → LLM + Context → Better Answer
```

**2. Document Loading**

```python
from langchain_community.document_loaders import PyPDFLoader

# Load PDF
loader = PyPDFLoader("inventory_guide.pdf")
documents = loader.load()

# documents is a list of Document objects
# Each has: page_content (text) and metadata (page number, source)
```

**3. Text Splitting**

LLMs have token limits, so we split documents into chunks:

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,        # Characters per chunk
    chunk_overlap=200,      # Overlap between chunks (preserves context)
    separators=["\n\n", "\n", " ", ""]
)

chunks = splitter.split_documents(documents)
```

**4. Embeddings**

Convert text to vectors for semantic search:

```python
from langchain_community.embeddings import HuggingFaceEmbeddings

embeddings = HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2"  # Small, fast model
)

# Convert text to vector
vector = embeddings.embed_query("What is inventory turnover?")
# Returns: [0.123, -0.456, 0.789, ...]  (384 dimensions)
```

**5. Vector Stores**

Store and search document embeddings:

```python
from langchain_community.vectorstores import Chroma

# Create vector store
vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./chroma_db"
)

# Search for relevant chunks
results = vectorstore.similarity_search(
    "How to calculate reorder point?",
    k=3  # Return top 3 results
)

for doc in results:
    print(doc.page_content)
```

**6. Chains**

Combine components into workflows:

```python
from langchain.chains import RetrievalQA
from langchain_groq import ChatGroq

# Initialize LLM
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.3,
    groq_api_key="your_key"
)

# Create RAG chain
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",  # "stuff" = put all context in prompt
    retriever=vectorstore.as_retriever(search_kwargs={"k": 3})
)

# Ask question
answer = qa_chain.run("What is safety stock?")
```

**7. Custom Prompts**

```python
from langchain.prompts import PromptTemplate

template = """
You are a logistics assistant. Use the following context to answer the question.
If you don't know the answer, say so - don't make things up.

Context:
{context}

Question: {question}

Answer:"""

prompt = PromptTemplate(
    template=template,
    input_variables=["context", "question"]
)

qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=vectorstore.as_retriever(),
    chain_type_kwargs={"prompt": prompt}
)
```

**8. Integration in Gudangku AI**

```python
# app/services/groq_service.py
from langchain_groq import ChatGroq
from langchain.chains import ConversationalRetrievalChain
from app.core.db import db

class GroqService:
    def __init__(self):
        self.llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0.3
        )
        # Initialize vectorstore from uploaded documents
        
    async def ask_question(self, question: str, chat_history: list):
        # Get relevant context
        relevant_docs = self.vectorstore.similarity_search(question, k=3)
        
        # Build context
        context = "\n\n".join([doc.page_content for doc in relevant_docs])
        
        # Generate answer
        response = self.llm.invoke(
            f"Context:\n{context}\n\nQuestion: {question}\n\nAnswer:"
        )
        
        # Save to database
        await db.chatlog.create(data={
            "question": question,
            "answer": response.content
        })
        
        return response.content
```

**Learning Resources:**
- [LangChain Docs](https://python.langchain.com/)
- [RAG Tutorial](https://www.pinecone.io/learn/retrieval-augmented-generation/)

---

### Groq LLM

Groq provides ultra-fast LLM inference (10x faster than OpenAI).

#### Key Concepts

**1. Why Groq?**

| Feature | Groq | OpenAI GPT-4 |
|---------|------|--------------|
| Speed | 500+ tokens/sec | 30-50 tokens/sec |
| Cost | $0.10/1M tokens | $10/1M tokens |
| Latency | <100ms | 500-1000ms |
| Models | LLaMA, Mixtral | GPT-4, GPT-3.5 |

**2. Available Models**

```python
# Fast for simple tasks
model = "llama-3.1-8b-instant"

# Better quality
model = "llama-3.3-70b-versatile"

# Best for coding
model = "llama-3.1-70b-versatile"

# Mixture of Experts (fast + quality)
model = "mixtral-8x7b-32768"
```

**3. Basic Usage**

```python
from groq import Groq

client = Groq(api_key="your_api_key")

response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[
        {"role": "system", "content": "You are a logistics expert."},
        {"role": "user", "content": "What is EOQ formula?"}
    ],
    temperature=0.3,  # Lower = more focused, Higher = more creative
    max_tokens=1000,
    top_p=1,
    stream=False
)

print(response.choices[0].message.content)
```

**4. Streaming Responses**

```python
stream = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[{"role": "user", "content": "Explain forecasting"}],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```

**5. With LangChain**

```python
from langchain_groq import ChatGroq

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.3,
    groq_api_key="your_key"
)

# Simple invoke
response = llm.invoke("What is inventory turnover?")

# With chat history
from langchain.schema import HumanMessage, AIMessage, SystemMessage

messages = [
    SystemMessage(content="You are a helpful assistant"),
    HumanMessage(content="What is ABC analysis?"),
    AIMessage(content="ABC analysis categorizes inventory..."),
    HumanMessage(content="Tell me more about category A")
]

response = llm.invoke(messages)
```

**Learning Resources:**
- [Groq Docs](https://console.groq.com/docs)
- [LangChain Groq Integration](https://python.langchain.com/docs/integrations/chat/groq)

---

## Frontend Technologies

### React & TypeScript

React is a JavaScript library for building user interfaces. TypeScript adds type safety.

#### Key Concepts

**1. Functional Components**

```typescript
// src/components/ProductCard.tsx
import React from 'react';

interface ProductCardProps {
  name: string;
  sku: string;
  stock: number;
  onEdit: (sku: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ name, sku, stock, onEdit }) => {
  return (
    <div className="product-card">
      <h3>{name}</h3>
      <p>SKU: {sku}</p>
      <p>Stock: {stock}</p>
      <button onClick={() => onEdit(sku)}>Edit</button>
    </div>
  );
};

export default ProductCard;
```

**2. Hooks**

**useState** - Manage component state:
```typescript
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState<number>(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

**useEffect** - Side effects (API calls, subscriptions):
```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Runs after component mounts
    const fetchProducts = async () => {
      try {
        const response = await axios.get('/api/products');
        setProducts(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
    
    // Cleanup function (runs on unmount)
    return () => {
      // Cancel requests, clear timers, etc.
    };
  }, []); // Empty dependency array = run once
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <ul>
      {products.map(p => <li key={p.id}>{p.name}</li>)}
    </ul>
  );
}
```

**useContext** - Global state:
```typescript
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext<{
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
} | null>(null);

export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  
  const login = async (email, password) => {
    const response = await supabase.auth.signInWithPassword({ email, password });
    setUser(response.data.user);
  };
  
  const logout = () => {
    supabase.auth.signOut();
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Use in components
function Profile() {
  const { user, logout } = useContext(AuthContext)!;
  
  return (
    <div>
      <p>Welcome, {user?.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

**Custom Hooks:**
```typescript
// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);
  
  return { user, loading };
};

// Usage
function Dashboard() {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <Redirect to="/login" />;
  
  return <DashboardContent user={user} />;
}
```

**3. TypeScript Types**

```typescript
// Define types for your data
type Product = {
  id: string;
  name: string;
  sku: string;
  stockLevel: number;
  category?: string;  // Optional
};

type Forecast = {
  ds: string;  // Date string
  yhat: number;
  yhat_lower: number;
  yhat_upper: number;
};

type ApiResponse<T> = {
  data: T;
  message: string;
  success: boolean;
};

// Use in components
const [products, setProducts] = useState<Product[]>([]);
const [forecast, setForecast] = useState<Forecast[]>([]);

const fetchProducts = async (): Promise<ApiResponse<Product[]>> => {
  const response = await axios.get('/api/products');
  return response.data;
};
```

**Learning Resources:**
- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

---

### Vite Build Tool

Vite is a fast build tool for modern web development.

#### Key Concepts

**1. Why Vite?**

| Feature | Vite | Create React App |
|---------|------|------------------|
| Dev Server Start | <1s | 5-10s |
| HMR (Hot Reload) | Instant | 1-3s |
| Build Time | 30s | 2-3min |
| Bundle Size | Optimized | Larger |

**2. Configuration**

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  // Path aliases
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
    }
  },
  
  // Dev server
  server: {
    port: 5173,
    proxy: {
      // Proxy API requests to backend
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },
  
  // Build options
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['recharts', 'plotly.js-dist'],
        }
      }
    }
  },
  
  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  }
});
```

**3. Environment Variables**

```bash
# .env
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

```typescript
// Access in code
const apiUrl = import.meta.env.VITE_API_BASE_URL;
const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;
```

**4. Lazy Loading**

```typescript
import { lazy, Suspense } from 'react';

// Code splitting - only load when needed
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Forecaster = lazy(() => import('./pages/Forecaster'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/forecast" element={<Forecaster />} />
      </Routes>
    </Suspense>
  );
}
```

**Learning Resources:**
- [Vite Documentation](https://vitejs.dev/)
- [Vite Performance Guide](https://vitejs.dev/guide/performance.html)

---

### Ant Design

Ant Design is a comprehensive UI component library.

#### Key Components

**1. Layout**

```typescript
import { Layout, Menu } from 'antd';
const { Header, Sider, Content } = Layout;

function DashboardLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider>
        <Menu theme="dark" mode="inline">
          <Menu.Item key="1" icon={<DashboardOutlined />}>
            Dashboard
          </Menu.Item>
          <Menu.Item key="2" icon={<LineChartOutlined />}>
            Forecasting
          </Menu.Item>
        </Menu>
      </Sider>
      
      <Layout>
        <Header style={{ background: '#fff', padding: 0 }} />
        <Content style={{ margin: '24px 16px 0' }}>
          {/* Your content here */}
        </Content>
      </Layout>
    </Layout>
  );
}
```

**2. Forms**

```typescript
import { Form, Input, Button, message } from 'antd';

function LoginForm() {
  const [form] = Form.useForm();
  
  const onFinish = async (values) => {
    try {
      await login(values.email, values.password);
      message.success('Login successful!');
    } catch (error) {
      message.error('Login failed');
    }
  };
  
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
    >
      <Form.Item
        label="Email"
        name="email"
        rules={[
          { required: true, message: 'Please enter email' },
          { type: 'email', message: 'Invalid email' }
        ]}
      >
        <Input placeholder="admin@example.com" />
      </Form.Item>
      
      <Form.Item
        label="Password"
        name="password"
        rules={[{ required: true, message: 'Please enter password' }]}
      >
        <Input.Password />
      </Form.Item>
      
      <Form.Item>
        <Button type="primary" htmlType="submit" block>
          Login
        </Button>
      </Form.Item>
    </Form>
  );
}
```

**3. Tables**

```typescript
import { Table, Tag, Space, Button } from 'antd';

function ProductTable() {
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
    },
    {
      title: 'Stock',
      dataIndex: 'stockLevel',
      key: 'stock',
      render: (stock) => (
        <Tag color={stock < 10 ? 'red' : 'green'}>
          {stock}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record.id)}>
            Edit
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];
  
  return (
    <Table
      columns={columns}
      dataSource={products}
      rowKey="id"
      pagination={{ pageSize: 10 }}
    />
  );
}
```

**Learning Resources:**
- [Ant Design Docs](https://ant.design/components/overview/)
- [Ant Design Charts](https://charts.ant.design/)

---

### State Management

**1. Local State (useState)**

For component-specific data:
```typescript
const [count, setCount] = useState(0);
const [user, setUser] = useState<User | null>(null);
```

**2. Context API (useContext)**

For app-wide state:
```typescript
// Create context
const ThemeContext = createContext<{
  theme: 'light' | 'dark';
  toggleTheme: () => void;
} | null>(null);

// Provider
export const ThemeProvider: React.FC = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Usage
function App() {
  return (
    <ThemeProvider>
      <YourApp />
    </ThemeProvider>
  );
}
```

**3. URL State (useSearchParams)**

For shareable state:
```typescript
import { useSearchParams } from 'react-router-dom';

function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';
  
  const changeTab = (newTab: string) => {
    setSearchParams({ tab: newTab });
  };
  
  return <Tabs activeKey={tab} onChange={changeTab} />;
}
// URL: /dashboard?tab=analytics
```

---

## Architecture Patterns

### 1. **Layered Architecture**

```
┌─────────────────────────────────┐
│     Presentation Layer          │  (React Components)
│  - UI Components                │
│  - Pages                        │
│  - Hooks                        │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│     API Layer                   │  (FastAPI Endpoints)
│  - Route Handlers               │
│  - Request Validation           │
│  - Response Formatting          │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│     Business Logic Layer        │  (Services)
│  - Prophet Service              │
│  - Groq Service                 │
│  - Authentication Logic         │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│     Data Access Layer           │  (Prisma ORM)
│  - Database Operations          │
│  - Query Building               │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│     Database                    │  (PostgreSQL)
│  - Tables                       │
│  - Indexes                      │
│  - Constraints                  │
└─────────────────────────────────┘
```

### 2. **Repository Pattern**

```python
# app/repositories/product_repository.py
from app.core.db import db
from typing import List, Optional

class ProductRepository:
    @staticmethod
    async def find_all() -> List:
        return await db.product.find_many()
    
    @staticmethod
    async def find_by_id(product_id: str) -> Optional:
        return await db.product.find_unique(where={"id": product_id})
    
    @staticmethod
    async def create(data: dict):
        return await db.product.create(data=data)
    
    @staticmethod
    async def update(product_id: str, data: dict):
        return await db.product.update(where={"id": product_id}, data=data)
    
    @staticmethod
    async def delete(product_id: str):
        return await db.product.delete(where={"id": product_id})

# Usage in endpoint
@router.get("/products")
async def get_products():
    products = await ProductRepository.find_all()
    return products
```

### 3. **Dependency Injection**

```python
# app/core/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    
    # Verify token with Supabase
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    user = supabase.auth.get_user(token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    return user

# Use in endpoints
@router.get("/profile")
async def get_profile(user = Depends(get_current_user)):
    return {"email": user.email, "id": user.id}
```

---

## Database Design

### 1. **Schema Design Principles**

**Normalization:**
- Eliminate redundancy
- Use foreign keys for relationships
- Separate concerns into different tables

**Example:**
```prisma
// ❌ Bad: Denormalized
model Order {
  id            String
  customerName  String
  customerEmail String
  customerPhone String
  // Customer data repeated in every order!
}

// ✅ Good: Normalized
model Customer {
  id     String @id
  name   String
  email  String
  phone  String
  orders Order[]
}

model Order {
  id         String
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id])
}
```

### 2. **Indexing**

```prisma
model Product {
  id   String @id
  sku  String @unique  // Automatic index
  name String
  
  @@index([name])  // Manual index for search
  @@index([category, stockLevel])  // Composite index
}
```

### 3. **Data Types**

```prisma
model Example {
  // IDs
  id        String   @id @default(uuid())  // UUID
  
  // Strings
  title     String   // VARCHAR(191)
  content   String   @db.Text  // TEXT (unlimited)
  
  // Numbers
  count     Int      // 32-bit integer
  price     Float    // Decimal
  quantity  BigInt   // 64-bit integer
  
  // Dates
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Boolean
  isActive  Boolean  @default(true)
  
  // JSON
  metadata  Json
}
```

### 4. **Relationships**

```prisma
// One-to-Many
model User {
  id       String
  products Product[]
}

model Product {
  id     String
  userId String
  user   User   @relation(fields: [userId], references: [id])
}

// Many-to-Many
model Post {
  id   String
  tags Tag[]  @relation("PostTags")
}

model Tag {
  id    String
  posts Post[] @relation("PostTags")
}
```

---

## Authentication & Security

### 1. **Supabase Authentication**

```typescript
// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Sign up
const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

// Sign in
const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

// Sign out
const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Get current session
const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};
```

### 2. **Protected Routes**

```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  
  return children;
}

// Usage
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### 3. **JWT Token in API Requests**

```typescript
import axios from 'axios';
import { supabase } from './supabaseClient';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Add token to every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  
  return config;
});

export default api;
```

### 4. **Row-Level Security (RLS)**

```sql
-- Enable RLS on table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own products
CREATE POLICY "Users view own products"
  ON products
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own products
CREATE POLICY "Users insert own products"
  ON products
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own products
CREATE POLICY "Users update own products"
  ON products
  FOR UPDATE
  USING (auth.uid() = user_id);
```

---

## Deployment & DevOps

### 1. **Environment Variables**

**Backend (.env):**
```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname?pgbouncer=true
DIRECT_URL=postgresql://user:password@host:5432/dbname

# API Keys
GROQ_API_KEY=gsk_...

# CORS
BACKEND_DOMAINS=http://localhost:5173,https://yourdomain.com

# Server
PORT=8000
```

**Frontend (.env):**
```env
VITE_SUPABASE_URL=https://abc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_API_BASE_URL=https://api.yourdomain.com
```

### 2. **Docker (Optional)**

```dockerfile
# Dockerfile (Backend)
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN prisma generate

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 3. **Render Deployment**

```bash
# build.sh
#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
prisma py fetch
prisma generate --schema=prisma/schema.prisma
# Copy binaries (see current build.sh for full logic)
```

### 4. **Vercel Deployment**

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### 5. **CI/CD with GitHub Actions**

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Render
        run: |
          # Trigger Render deployment
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK_URL }}
  
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: |
          npm install -g vercel
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## Best Practices

### 1. **Code Organization**

```
be/
├── app/
│   ├── api/
│   │   └── endpoints/      # Group by feature
│   ├── core/               # Core functionality
│   ├── services/           # Business logic
│   ├── repositories/       # Data access
│   ├── models/             # Pydantic models
│   └── utils/              # Helper functions
```

### 2. **Error Handling**

**Backend:**
```python
from fastapi import HTTPException, status

@router.post("/products")
async def create_product(data: ProductCreate):
    try:
        product = await ProductRepository.create(data.dict())
        return product
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
```

**Frontend:**
```typescript
const fetchProducts = async () => {
  try {
    setLoading(true);
    const response = await api.get('/products');
    setProducts(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      message.error(error.response?.data?.detail || 'Failed to fetch products');
    } else {
      message.error('Unexpected error occurred');
    }
  } finally {
    setLoading(false);
  }
};
```

### 3. **Performance Optimization**

**Database:**
- Use indexes on frequently queried fields
- Paginate large result sets
- Use `select` to only fetch needed fields

```python
# Good - only fetch needed fields
products = await db.product.find_many(
    select={"id": True, "name": True, "stockLevel": True},
    take=20
)

# Bad - fetch all fields and all records
products = await db.product.find_many()
```

**Frontend:**
- Lazy load routes
- Memoize expensive computations
- Debounce search inputs

```typescript
import { useMemo, useCallback } from 'react';
import { debounce } from 'lodash';

function ProductSearch() {
  const [query, setQuery] = useState('');
  
  // Debounce search - only search after user stops typing
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      searchProducts(value);
    }, 500),
    []
  );
  
  // Memoize filtered results
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [products, query]);
  
  return (
    <Input
      placeholder="Search products..."
      onChange={(e) => {
        setQuery(e.target.value);
        debouncedSearch(e.target.value);
      }}
    />
  );
}
```

### 4. **Security Best Practices**

- ✅ Never commit `.env` files
- ✅ Use HTTPS in production
- ✅ Validate all user inputs
- ✅ Sanitize data before displaying
- ✅ Use parameterized queries (Prisma does this automatically)
- ✅ Implement rate limiting
- ✅ Keep dependencies updated

```python
# Rate limiting
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/predict")
@limiter.limit("10/minute")  # Max 10 requests per minute
async def predict(request: Request):
    ...
```

---

## Troubleshooting Guide

### Common Issues

#### 1. **Prisma Binary Not Found** ✅ SOLVED

**Problem:** `Expected prisma-query-engine-debian-openssl-3.0.x to exist`

**Solution:** 
- Run `prisma py fetch` before `prisma generate`
- Ensure `binaryTargets` includes `"debian-openssl-3.0.x"`
- Copy binaries to deployment directory (see `build.sh`)

#### 2. **CORS Errors**

**Problem:** `Access to XMLHttpRequest blocked by CORS policy`

**Solution:**
```python
# Backend: Add frontend URL to CORS origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 3. **401 Unauthorized**

**Problem:** API returns 401 even with valid token

**Solution:**
```typescript
// Ensure token is in Authorization header
const { data: { session } } = await supabase.auth.getSession();
axios.defaults.headers.common['Authorization'] = `Bearer ${session?.access_token}`;
```

#### 4. **Prophet Forecasting Fails**

**Problem:** "Not enough data points"

**Solution:**
- Ensure at least 2 data points (Prophet minimum)
- For meaningful forecasts, use 30+ historical data points
- Check data format: `ds` must be datetime, `y` must be numeric

#### 5. **Build Failures on Render**

**Problem:** Deployment fails during build

**Solutions:**
- Check build logs for specific error
- Ensure `build.sh` has execute permissions (`chmod +x build.sh`)
- Verify all environment variables are set in Render dashboard
- Check Python version matches `requirements.txt`

---

## ¡Recommended Learning Path

### Week 1-2: Foundations
1. Learn Python async/await
2. Complete FastAPI tutorial
3. Understand REST API design
4. Practice Prisma basic operations

### Week 3-4: Advanced Backend
1. Learn Prophet time series forecasting
2. Understand LangChain and RAG
3. Practice with Groq API
4. Implement authentication

### Week 5-6: Frontend Mastery
1. Master React hooks
2. Learn TypeScript fundamentals
3. Practice Ant Design components
4. Build responsive layouts

### Week 7-8: Integration & Deployment
1. Connect frontend to backend
2. Implement error handling
3. Deploy to Render + Vercel
4. Set up monitoring and logging

---

## 📚 Additional Resources

### Books
- "Designing Data-Intensive Applications" by Martin Kleppmann
- "Clean Architecture" by Robert C. Martin
- "The Pragmatic Programmer" by Hunt & Thomas

### Online Courses
- [FastAPI Full Course](https://www.youtube.com/watch?v=7t2alSnE2-I)
- [React TypeScript Course](https://www.youtube.com/watch?v=30LWjhZzg50)
- [Time Series Forecasting](https://www.coursera.org/learn/time-series-forecasting)

### Communities
- [FastAPI Discord](https://discord.com/invite/VQjSZaeJmf)
- [React Discord](https://discord.gg/reactiflux)
- [r/learnprogramming](https://www.reddit.com/r/learnprogramming/)

---

**Happy Learning! 🎓**

Remember: The best way to learn is by building. Start small, break things, fix them, and iterate!
