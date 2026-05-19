# 🚀 TaskApp — Enterprise Azure CI/CD Lab Project

> Production-grade full-stack application deployed on Azure with containerization, Azure DevOps Pipelines, and DevSecOps practices.

## 📋 Architecture

| Layer | Technology | Azure Service |
|-------|-----------|---------------|
| Frontend | React.js (Static Build) | Azure Static Web App |
| Backend API | Node.js + Express (Dockerized) | Azure App Service (Container) |
| Database | SQL Server | Azure SQL (Serverless) |
| Container Registry | Docker Images | Azure Container Registry (Basic) |
| CI/CD | YAML Pipelines | Azure DevOps |
| Source Control | Git (Git Flow) | Azure Repos |

## 🏗️ Project Structure

```
taskapp/
├── frontend/                    # React application
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── backend/                     # Node.js + Express REST API
│   ├── src/
│   │   ├── config/database.js
│   │   ├── routes/tasks.js
│   │   ├── routes/health.js
│   │   └── index.js
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
├── db/
│   └── schema.sql               # Database initialization
├── terraform/                   # Infrastructure as Code
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── azure-pipelines/             # CI/CD Pipeline Definitions
│   ├── backend-pipeline.yml
│   ├── frontend-pipeline.yml
│   └── security-pipeline.yml
└── README.md
```

## 🚀 Quick Start (Local Development)

```bash
# 1. Clone the repository
git clone https://github.com/<YOUR-USERNAME>/taskapp.git
cd taskapp

# 2. Install backend dependencies
cd backend && npm install && cd ..

# 3. Install frontend dependencies
cd frontend && npm install && cd ..

# 4. Start the backend (runs on port 3001)
cd backend && npm run dev

# 5. Start the frontend (runs on port 3000, in another terminal)
cd frontend && npm start
```

## 🐳 Docker Commands

```bash
# Build backend image
docker build -t taskapp-backend:local ./backend

# Build frontend image
docker build --build-arg REACT_APP_API_URL=http://localhost:3001 -t taskapp-frontend:local ./frontend

# Run backend
docker run -p 3001:3001 --env-file ./backend/.env taskapp-backend:local

# Run frontend
docker run -p 8080:80 taskapp-frontend:local
```

## ☁️ Azure Resources Provisioned

- **Resource Group**: `rg-taskapp-student-yourname`
- **Container Registry**: `acrtaskappyourname`
- **SQL Server**: `sql-taskapp-yourname`
- **App Service**: `app-taskapp-backend-yourname`
- **Static Web App**: `stapp-taskapp-frontend`

## 🔐 Security Pipeline

| Stage | Tool | Purpose |
|-------|------|---------|
| SAST | SonarQube | Static code analysis for vulnerabilities |
| SCA | Snyk | Dependency vulnerability scanning |
| DAST | OWASP ZAP | Dynamic application security testing |

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/tasks` | List all tasks |
| GET | `/api/tasks/stats` | Task statistics |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/:id` | Update a task |
| PATCH | `/api/tasks/:id/status` | Quick status change |
| DELETE | `/api/tasks/:id` | Delete a task |

## 🌿 Git Flow Branching

```
main ────────────────────────────────── Production
  └── develop ───────────────────────── Integration
       ├── feature/dockerize-app ────── Feature work
       ├── feature/azure-pipeline ───── Feature work
       └── release/v1.0.0 ──────────── Release prep
```

---

**Built for**: DevOps Training Lab — Enterprise Azure CI/CD Project
