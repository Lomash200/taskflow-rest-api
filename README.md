# TaskFlow — REST API with Auth & Role-Based Access

A full-stack application with a **FastAPI** backend and **React** frontend, featuring JWT authentication, role-based access control, and full task management.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Backend    | FastAPI, Python 3.11+               |
| Database   | PostgreSQL + SQLAlchemy ORM         |
| Auth       | JWT (python-jose) + bcrypt          |
| Frontend   | React 18, React Router v6, Vite     |
| API Docs   | Swagger UI (auto-generated)         |

---

## Project Structure

```
taskflow/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # auth.py, tasks.py, users.py
│   │   ├── core/               # config.py, security.py
│   │   ├── db/                 # database.py
│   │   ├── models/             # user.py, task.py (SQLAlchemy)
│   │   ├── schemas/            # user.py, task.py (Pydantic)
│   │   ├── services/           # user_service.py, task_service.py
│   │   └── main.py             # App entry point, CORS, startup
│   ├── .env.example
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/         # Sidebar, ProtectedRoute
    │   ├── context/            # AuthContext (JWT state)
    │   ├── pages/              # Login, Register, Dashboard, Tasks, AdminUsers
    │   ├── services/           # api.js (Axios + interceptors)
    │   └── App.jsx             # Router setup
    ├── index.html
    └── package.json
```

---

## Setup & Run

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL running locally

### 1. Database

```sql
CREATE DATABASE taskflow_db;
```

### 2. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set your DATABASE_URL and a strong SECRET_KEY

# Run server (tables are auto-created on startup)
uvicorn app.main:app --reload --port 8000
```

Backend runs at: **http://localhost:8000**
Swagger docs: **http://localhost:8000/docs**

### 3. Frontend

```bash
cd frontend

npm install
npm run dev
```

Frontend runs at: **http://localhost:3000**

---

## API Reference (v1)

All endpoints are prefixed with `/api/v1`. Full interactive docs at `/docs`.

### Authentication

| Method | Endpoint              | Auth     | Description              |
|--------|-----------------------|----------|--------------------------|
| POST   | `/auth/register`      | Public   | Register new user        |
| POST   | `/auth/login`         | Public   | Login, returns JWT token |

### Tasks

| Method | Endpoint          | Auth     | Description                              |
|--------|-------------------|----------|------------------------------------------|
| POST   | `/tasks/`         | User+    | Create task                              |
| GET    | `/tasks/`         | User+    | List tasks (own for user, all for admin) |
| GET    | `/tasks/{id}`     | User+    | Get single task                          |
| PUT    | `/tasks/{id}`     | User+    | Update task                              |
| DELETE | `/tasks/{id}`     | User+    | Delete task (soft delete)                |

Query filters: `?status=todo&priority=high&skip=0&limit=20`

### Users (Admin Only)

| Method | Endpoint          | Auth     | Description         |
|--------|-------------------|----------|---------------------|
| GET    | `/users/me`       | User+    | Get own profile     |
| GET    | `/users/`         | Admin    | List all users      |
| GET    | `/users/{id}`     | Admin    | Get user by ID      |
| PUT    | `/users/{id}`     | Admin    | Update user         |
| DELETE | `/users/{id}`     | Admin    | Delete user         |

### Using the JWT Token

After login, add to all protected requests:
```
Authorization: Bearer <your_token>
```

---

## Role-Based Access Control

| Feature                    | User | Admin |
|----------------------------|------|-------|
| Register / Login           | ✅   | ✅    |
| Create / manage own tasks  | ✅   | ✅    |
| View all tasks             | ❌   | ✅    |
| Manage users               | ❌   | ✅    |
| Change user roles          | ❌   | ✅    |

---

## Security Practices

- Passwords hashed with **bcrypt** (via passlib)
- JWT tokens signed with **HS256**, configurable expiry
- **OAuth2PasswordBearer** scheme for token transport
- Pydantic **input validation** on all request bodies
- Username regex-validated; password minimum length enforced
- Tasks use **soft delete** (is_active flag) — no data lost
- CORS locked to `localhost:3000` / `localhost:5173` (update for production)
- Admin cannot delete their own account (self-protection guard)

---

## Scalability Note

See [`SCALABILITY.md`](./SCALABILITY.md) for the full breakdown.

**TL;DR:**
- Stateless JWT enables horizontal scaling (multiple backend instances)
- Service layer separates business logic from API routes (clean modularization)
- API versioning (`/api/v1`) allows zero-downtime evolution
- PostgreSQL connection pooling via SQLAlchemy (`pool_pre_ping=True`)
- Redis caching can be added for frequent read endpoints
- The project structure supports extracting auth/tasks into microservices

---

## Environment Variables

| Variable                      | Default                        | Description               |
|-------------------------------|--------------------------------|---------------------------|
| `DATABASE_URL`                | postgresql://...               | PostgreSQL connection URL |
| `SECRET_KEY`                  | (change this!)                 | JWT signing secret        |
| `ALGORITHM`                   | HS256                          | JWT algorithm             |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 30                             | Token lifetime            |
