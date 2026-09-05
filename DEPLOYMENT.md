# PeoplePay360 — Production Deployment Guide

This guide covers deploying PeoplePay360 as a **Full-Stack Monorepo** where the Node.js / Express backend serves both the deterministic payroll REST API (`/api/*`) and the high-performance Vite React frontend (`/*`) from a single unified service.

---

## 🚀 Option 1: Deploy to Render (1-Click Blueprint)

Render provides free web hosting and managed PostgreSQL databases.

### Steps:
1. Push this repository to GitHub (or use your branch `aakif`).
2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Blueprint**.
3. Connect your GitHub repository `Rajkishore25/odoo-24hrs-hackathon-2026` (branch `aakif`).
4. Render will automatically detect [`render.yaml`](file:///c:/odoo-24hrs-hackathon-2026/render.yaml) and provision:
   - **PostgreSQL Database** (`peoplepay360-db`)
   - **Node.js Web Service** (`peoplepay360`)
5. Click **Apply**.
6. Render builds the backend, builds the frontend, runs Prisma migrations, seeds hackathon demo data, and serves the live application at `https://peoplepay360.onrender.com`.

---

## 🚂 Option 2: Deploy to Railway

1. Go to [Railway.app](https://railway.app/) and create a **New Project**.
2. Click **Deploy from GitHub repo** and select this repository.
3. In your Railway project, click **+ New** -> **Database** -> **Add PostgreSQL**.
4. Railway automatically sets the `DATABASE_URL` environment variable.
5. In your web service Settings -> Variables, add:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: `your-secure-random-jwt-secret-key-32-chars`
6. Railway uses [`railway.json`](file:///c:/odoo-24hrs-hackathon-2026/railway.json) to automatically build the monorepo, apply migrations, seed demo records, and start the app.

---

## 🐳 Option 3: Deploy with Docker Compose (Any VPS / Local)

Deploy the entire stack with PostgreSQL in isolated containers with a single command:

```bash
# Clone the repository
git clone https://github.com/Rajkishore25/odoo-24hrs-hackathon-2026.git
cd odoo-24hrs-hackathon-2026
git checkout aakif

# Start PostgreSQL and Full-Stack App
docker compose up --build -d

# Verify containers are running
docker compose ps
```

The application is immediately accessible at `http://localhost:5000` (or `http://YOUR_SERVER_IP:5000`).

---

## 🛠️ Option 4: Manual Production Build & Run (Self-Hosted Node.js)

### Prerequisites
- Node.js >= 18.x
- PostgreSQL instance running

### Commands:
```bash
# 1. Install dependencies
npm install
npm install --prefix backend
npm install --prefix frontend

# 2. Configure environment
cp .env.example backend/.env
# Edit backend/.env with your production DATABASE_URL and JWT_SECRET

# 3. Build backend & frontend
npm run build

# 4. Run database migrations & seed initial demo data
cd backend
npx prisma migrate deploy
npm run seed
cd ..

# 5. Start production server
npm start
```

Your service is now running in production at `http://localhost:5000`.

---

## 🔍 Verification & Health Check

After deployment, verify that the service is operational:

| Endpoint | Method | Expected Result |
| :--- | :--- | :--- |
| `/` | `GET` | Loads PeoplePay360 React application |
| `/api/health` | `GET` | `{"status":"ok","timestamp":"..."}` |
| `/api` | `GET` | API welcome sitemap & documentation |
| `/api/dashboard/summary` | `GET` | Real-time payroll & employee KPIs |
| `/api/employees` | `GET` | Seeded employees (Rahul, Priya, Amit) |

---

## 👥 Hackathon Demo Credentials

- **HR Manager**: `hr@peoplepay360.com` / `admin123`
- **Payroll Admin**: `payroll@peoplepay360.com` / `admin123`
- **Employee (Rahul Sharma)**: `rahul.sharma@example.com` / `admin123`
- **Employee (Priya Patel)**: `priya.patel@example.com` / `admin123`
