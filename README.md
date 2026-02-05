# IDSMS - Inphora Driving School Management System

A production-ready Driving School Management System for Kenya, built with FastAPI, PostgreSQL, and React.

## Features

- **User Management**: Admin, Instructor, Student, Manager roles.
- **Course Management**: Create courses, enroll students.
- **Scheduling**: Lesson booking (Theory & Practical).
- **Vehicles**: Fleet management and maintenance tracking.
- **Payments**: M-Pesa integration abstraction.
- **Compliance**: NTSA-ready data structure.

## Tech Stack

- **Backend**: FastAPI (Python), SQLModel, Alembic, AsyncPG.
- **Database**: PostgreSQL.
- **Frontend**: React, Vite (Coming soon).
- **Infrastructure**: Docker, Docker Compose.

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Python 3.11+ (for local backend dev)
- Node.js 20+ (for local frontend dev)

### Quick Start (Docker)

1.  Clone the repository.
2.  Run `docker compose up --build`.
3.  Access the API at `http://localhost:8000/docs`.
4.  Access the Frontend at `http://localhost:5173`.

### Local Development (Backend)

1.  Navigate to `backend/`.
2.  Create a virtual environment: `python -m venv venv`.
3.  Activate it: `.\venv\Scripts\Activate` (Windows) or `source venv/bin/activate`.
4.  Install dependencies: `pip install -r requirements.txt`.
5.  Set up `.env`: `cp .env.example .env`.
6.  Start DB (using Docker): `docker compose up -d db`.
7.  Run migrations: `alembic upgrade head`.
8.  Start server: `uvicorn app.main:app --reload`.

### Migrations

- Create new migration: `alembic revision --autogenerate -m "message"`
- Apply migrations: `alembic upgrade head`
