from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.v1 import api_router
from app.db.database import create_tables

app = FastAPI(
    redirect_slashes=False,
    title=settings.APP_NAME,
    description="""
## TaskFlow REST API

A scalable REST API with JWT Authentication and Role-Based Access Control.

### Features
- 🔐 **JWT Authentication** – Secure token-based auth
- 👥 **Role-Based Access** – `user` and `admin` roles
- ✅ **Task CRUD** – Full task management with status/priority
- 📄 **API Versioning** – All endpoints under `/api/v1`
- 🛡️ **Input Validation** – Pydantic schemas with sanitization

### Quick Start
1. **Register** via `POST /api/v1/auth/register`
2. **Login** via `POST /api/v1/auth/login` to get JWT token
3. Use token as `Bearer <token>` in Authorization header
4. Manage tasks via `/api/v1/tasks`
    """,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.on_event("startup")
def on_startup():
    create_tables()


@app.get("/", tags=["Health"])
def root():
    return {"message": "TaskFlow API is running", "docs": "/docs", "version": settings.APP_VERSION}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}