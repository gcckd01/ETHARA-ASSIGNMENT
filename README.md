# ⚡ Ethara – Team Task Manager

A full-stack, premium project management application built for speed and collaboration. Manage projects, assign tasks, and track progress with role-based access control.

## 🚀 Key Features

- **Authentication**: Secure Signup/Login with JWT-based sessions.
- **Role-Based Access (RBAC)**:
  - **Admin**: Create projects, manage members, create and assign tasks, view all users.
  - **Member**: View assigned projects, track tasks, update status of assigned tasks.
- **Interactive Dashboard**: Real-time stats on project completion, task status distribution, and overdue alerts.
- **Kanban Board**: Drag-and-drop-ready status columns (Todo, In Progress, Done) within project details.
- **Responsive Design**: Modern, glassmorphism-inspired UI that works on desktop and mobile.

## ⚙️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Vanilla CSS (Design System).
- **Backend**: Next.js API Routes (RESTful).
- **Database**: Prisma ORM with PostgreSQL (Production) / SQLite (Local).
- **Auth**: JWT (Jose) with HTTP-only cookies.
- **Deployment**: Optimized for Railway.

## 🛠️ Local Setup

1. **Clone the repo**:
   ```bash
   git clone <your-repo-url>
   cd team-task-manager
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env` file in the root:
   ```env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your-32-character-secret-key"
   ```

4. **Initialize Database**:
   ```bash
   npx prisma migrate dev --name init
   npm run seed
   ```

5. **Run the app**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

### 🔑 Demo Credentials
- **Admin**: `admin@ethara.io` / `admin123`
- **Member**: `member@ethara.io` / `member123`

## 🌐 Railway Deployment Guide

Ethara is designed to be deployed seamlessly on Railway.

### Step 1: Push to GitHub
Ensure your code is committed and pushed to a GitHub repository.

### Step 2: Create a Railway Project
1. Go to [Railway.app](https://railway.app/) and log in.
2. Click **+ New Project** -> **Deploy from GitHub repo**.
3. Select your repository.

### Step 3: Add PostgreSQL
1. In your Railway project, click **+ Add** -> **Database** -> **Add PostgreSQL**.
2. Railway will automatically provision the database and provide a `DATABASE_URL`.

### Step 4: Configure Environment Variables
In your Railway service settings, add the following:
- `DATABASE_URL`: (Railway will likely set this automatically if you link the Postgres plugin).
- `JWT_SECRET`: A long random string.
- `NODE_ENV`: `production`

### Step 5: Deployment Settings
Railway will detect the Next.js project. Ensure the build command is:
```bash
npm run build
```
The build script in `package.json` is already configured to run `prisma generate` before building.

### Step 6: Initial Migration & Seed (Optional)
To seed the production database:
1. Go to the **Variables** tab in Railway.
2. Run the seed command via the Railway CLI or by temporarily adding a post-build script.
3. Alternatively, use the Railway Console to run:
   ```bash
   npx prisma migrate deploy
   npm run seed
   ```

## 📄 License
MIT
