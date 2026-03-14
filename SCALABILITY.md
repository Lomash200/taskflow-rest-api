# Scalability & Architecture Notes

## Current Architecture

```
Client (React)
    │
    ▼
FastAPI (uvicorn)  ──►  PostgreSQL
    │
    └── JWT Auth (stateless)
```

---

## How This Project Scales

### 1. Stateless JWT Authentication
JWT tokens are **self-contained and stateless** — the server holds no session state. This means you can run **multiple FastAPI instances** behind a load balancer without sticky sessions. Every instance can independently verify a token using the shared `SECRET_KEY`.

```
                  ┌─► FastAPI Instance 1 ─┐
Load Balancer ───►├─► FastAPI Instance 2 ─┼──► PostgreSQL (shared)
                  └─► FastAPI Instance 3 ─┘
```

### 2. API Versioning (`/api/v1`)
All routes are under `/api/v1`. When breaking changes are needed, a `/api/v2` router is added **alongside** v1 — no downtime, no forced client upgrades.

### 3. Service Layer Pattern
Business logic lives in `services/` (not in route handlers). This separation makes it easy to:
- Extract a service into its own **microservice** later
- Replace the database without touching API logic
- Unit test business logic independently

```
api/v1/endpoints/tasks.py  →  services/task_service.py  →  models/task.py
      (HTTP layer)                (business logic)             (DB layer)
```

### 4. Database Connection Pooling
SQLAlchemy is configured with `pool_pre_ping=True` which validates connections before use — critical under high concurrency. For production, tune `pool_size` and `max_overflow`:

```python
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)
```

### 5. Caching Layer (Redis — Optional Next Step)
High-read endpoints like `GET /tasks` can be cached:

```python
# Example: cache task list for 60s per user
@router.get("/tasks")
def get_tasks(current_user, redis=Depends(get_redis)):
    key = f"tasks:user:{current_user.id}"
    cached = redis.get(key)
    if cached:
        return json.loads(cached)
    tasks = TaskService(db).get_by_owner(current_user.id)
    redis.setex(key, 60, json.dumps(tasks))
    return tasks
```

### 6. Background Tasks
FastAPI's `BackgroundTasks` (or Celery + Redis) can offload:
- Email notifications on task assignment
- Audit log writes
- Scheduled task reminders

### 7. Future Microservices Split
The current monolith can be split along service boundaries:

| Service          | Responsibility              |
|------------------|-----------------------------|
| `auth-service`   | Register, login, JWT        |
| `task-service`   | CRUD for tasks              |
| `user-service`   | User management (admin)     |
| `api-gateway`    | Route, auth-check, rate limit |

Services communicate via REST or a message broker (RabbitMQ / Kafka).

### 8. Containerization (Docker — Ready to Add)
The project structure is container-ready. Adding a `Dockerfile` and `docker-compose.yml` enables:
- One-command local setup: `docker compose up`
- Identical dev/prod environments
- Kubernetes deployment with horizontal pod autoscaling

---

## Production Checklist

- [ ] Set `SECRET_KEY` to a cryptographically random 32+ character string
- [ ] Set `ACCESS_TOKEN_EXPIRE_MINUTES` to appropriate value (e.g., 15–60 min)
- [ ] Use environment variables (never commit `.env` to git)
- [ ] Enable HTTPS (TLS termination at load balancer or nginx)
- [ ] Restrict `allow_origins` in CORS to production domain only
- [ ] Add rate limiting middleware (e.g., `slowapi`)
- [ ] Set up structured logging (e.g., `loguru` or Python `logging` to JSON)
- [ ] Add database migrations via Alembic for schema changes
- [ ] Monitor with Prometheus + Grafana or a managed APM
