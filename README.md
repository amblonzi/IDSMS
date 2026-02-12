# IDSMS - Inphora Driving School Management System

A comprehensive web-based management system for driving schools, built with FastAPI (backend) and React (frontend).

## 🚀 Features

- **User Management**: Multi-role system (Admin, Manager, Instructor, Student)
- **Course Management**: Create and manage driving courses
- **Scheduling**: Lesson scheduling and calendar management
- **Payment Processing**: Track payments and invoices
- **Vehicle Management**: Manage fleet and maintenance
- **Assessments**: Student progress tracking and evaluations
- **Security**: JWT authentication with refresh tokens, RBAC, audit logging
- **Monitoring**: Health checks, structured logging, rate limiting

## 🏗️ Architecture

### Backend
- **Framework**: FastAPI with async/await support
- **Database**: PostgreSQL with SQLModel ORM
- **Authentication**: JWT tokens (access + refresh)
- **Security**: Password hashing, RBAC, account lockout, audit logs
- **API Docs**: Auto-generated OpenAPI/Swagger docs

### Frontend
- **Framework**: React 18 with Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **State**: Context API
- **HTTP Client**: Axios with interceptors

## 📋 Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

## 🛠️ Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd driving-school-management-system
```

### 2. Set Up Environment Variables

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env and set your SECRET_KEY and REFRESH_SECRET_KEY
# Generate secure keys: openssl rand -hex 32
```

**Frontend:**
```bash
cd frontend
cp .env.example .env
# Edit .env if needed (defaults should work for development)
```

### 3. Start with Docker Compose

```bash
# From project root
docker compose up -d
```

This will start:
- **Backend**: http://localhost:8000
- **Frontend**: http://localhost:5173
- **PostgreSQL**: localhost:5432
- **API Docs**: http://localhost:8000/docs

### 4. Run Database Migrations

```bash
docker compose exec backend alembic upgrade head
```

### 5. Create Initial Admin User (Optional)

```bash
docker compose exec backend python -m app.scripts.create_admin
```

## 🔧 Development Setup

### Backend Development

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Running Tests

**Backend:**
```bash
cd backend
pytest --cov=app --cov-report=term-missing
```

**Frontend:**
```bash
cd frontend
npm test
```

### Code Quality

**Backend:**
```bash
# Linting
ruff check app/

# Formatting
black app/

# Security check
bandit -r app/ -ll
```

**Frontend:**
```bash
# Linting
npm run lint

# Type checking
npm run type-check
```

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔐 Environment Variables

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `SECRET_KEY` | JWT access token secret (min 32 chars) | Required |
| `REFRESH_SECRET_KEY` | JWT refresh token secret (min 32 chars) | Required |
| `ENVIRONMENT` | Environment (development/staging/production) | development |
| `CORS_ORIGINS` | Comma-separated allowed origins | localhost:5173 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token expiry | 30 |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token expiry | 7 |
| `PASSWORD_MIN_LENGTH` | Minimum password length | 8 |
| `MAX_LOGIN_ATTEMPTS` | Failed attempts before lockout | 5 |
| `LOCKOUT_DURATION_MINUTES` | Account lockout duration | 15 |
| `RATE_LIMIT_PER_MINUTE` | Global rate limit | 60 |
| `RATE_LIMIT_LOGIN_PER_MINUTE` | Login rate limit | 5 |

### Frontend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | http://localhost:8000/api/v1 |
| `VITE_ENVIRONMENT` | Environment | development |

## 🗄️ Database Schema

Key tables:
- `user` - User accounts with roles and authentication
- `profile` - Extended user profiles
- `course` - Driving courses
- `enrollment` - Student course enrollments
- `lesson` - Scheduled lessons
- `payment` - Payment records
- `vehicle` - Fleet management
- `tokenblacklist` - Invalidated JWT tokens
- `auditlog` - Security audit trail

All tables include:
- `created_at`, `updated_at` - Automatic timestamps
- `deleted_at` - Soft delete support

## 🔒 Security Features

- **Password Policy**: Configurable complexity requirements
- **JWT Authentication**: Separate access and refresh tokens
- **Token Blacklisting**: Secure logout implementation
- **Account Lockout**: Protection against brute-force attacks
- **RBAC**: Role-based access control with decorators
- **Audit Logging**: Comprehensive security event tracking
- **Rate Limiting**: Per-IP request throttling
- **CORS**: Configurable cross-origin policies
- **Error Handling**: Environment-aware error messages

## 📊 Monitoring

### Health Checks

- `GET /health` - Basic health status
- `GET /ready` - Readiness check (includes DB connectivity)

### Logging

- Structured JSON logging in production
- Human-readable logs in development
- Correlation IDs for request tracing

## 🚢 Deployment

### Production Checklist

1. **Environment Variables**:
   - Generate strong `SECRET_KEY` and `REFRESH_SECRET_KEY` (min 32 chars)
   - Set `ENVIRONMENT=production`
   - Configure proper `CORS_ORIGINS`
   - Use secure `DATABASE_URL`

2. **Database**:
   - Run migrations: `alembic upgrade head`
   - Set up regular backups
   - Configure connection pooling

3. **Security**:
   - Enable HTTPS
   - Set up firewall rules
   - Configure rate limiting (consider Redis)
   - Review CORS settings

4. **Monitoring**:
   - Set up log aggregation (e.g., ELK, Datadog)
   - Configure health check monitoring
   - Set up error tracking (e.g., Sentry)

5. **Performance**:
   - Use production ASGI server (Gunicorn + Uvicorn workers)
   - Enable response compression
   - Configure CDN for frontend assets
   - Set up database indexes

### Docker Production Build

```bash
# Build production images
docker compose -f docker-compose.prod.yml build

# Start production stack
docker compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Backend: Follow PEP 8, use Black formatter, pass Ruff linting
- Frontend: Follow ESLint rules, use Prettier
- Write tests for new features
- Update documentation

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Inphora Systems Team

## 🙏 Acknowledgments

- FastAPI for the excellent web framework
- React team for the frontend library
- SQLModel for the intuitive ORM
- All contributors and users

## 📞 Support

For support, email support@inphora.com or open an issue in the repository.

---

**Version**: 1.0.0  
**Last Updated**: February 2026
