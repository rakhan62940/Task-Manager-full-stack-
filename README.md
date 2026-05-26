# Team Task Manager

A full-stack **Team Task Manager** built with **React, Express.js, Node.js, SQLite, and Sequelize**. Features JWT authentication, role-based access control (Admin/Member), project management, project membership, and task tracking.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite, React Router v6, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | SQLite + Sequelize (can use PostgreSQL/MySQL) |
| Auth | JSON Web Tokens (JWT), bcryptjs |
| Validation | express-validator |
| HTTP Client | Axios |

---

## Folder Structure

```
Assessment/
├── server/                    # Backend (Node.js + Express)
│   ├── config/
│   │   └── db.js             # Sequelize SQLite config
│   ├── src/
│   │   ├── models/           # User, Project, Task, ProjectMember
│   │   ├── modules/
│   │   │   ├── auth/         # Signup, login, JWT
│   │   │   ├── projects/     # Project CRUD
│   │   │   └── tasks/        # Task CRUD
│   │   └── middlewares/      # auth, role, error
│   ├── server.js
│   └── package.json
├── client/                   # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/            # Login, Signup, Dashboard, Projects, Tasks
│   │   ├── components/       # Navbar, PrivateRoute
│   │   ├── context/          # AuthContext
│   │   └── services/         # Axios API instance
│   └── package.json
├── railway.json
├── README.md
└── SPEC.md
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- npm

### Install Everything

Run from the project root:

```powershell
npm run install:all
```

### Start Full App

Run from the project root:

```powershell
npm run dev
```

This starts:

- Backend API: **http://localhost:5000**
- Frontend app: **http://localhost:5173**

### Start Backend Only

```powershell
cd server
npm install
$env:JWT_SECRET="dev-secret"
npm run dev
```

### Start Frontend Only

```powershell
cd client
npm install
npm run dev
```

### Environment Variables

| Variable | Used By | Default | Purpose |
|----------|---------|---------|---------|
| `PORT` | Backend | `5000` | API server port |
| `JWT_SECRET` | Backend | Required for production | JWT signing secret |
| `JWT_EXPIRES_IN` | Backend | `7d` | Token lifetime |
| `DB_STORAGE` | Backend | `database.sqlite` in the project root | SQLite file path |
| `VITE_API_URL` | Frontend | `/api` | API base URL for deployed frontend |

For local development, Vite proxies `/api` to `http://localhost:5000`, so `VITE_API_URL` is usually not needed.

---

## Commands

### Root Commands

| Command | Description |
|---------|-------------|
| `npm run install:all` | Install root, backend, and frontend dependencies |
| `npm run dev` | Start backend and frontend together |
| `npm run server` | Start backend dev server from root |
| `npm run client` | Start frontend dev server from root |

### Backend Commands

Run from `server/`:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Express with Node watch mode |
| `npm start` | Start Express normally |
| `node --check server.js` | Check backend entrypoint syntax |
| `node --check src/modules/projects/projects.service.js` | Check project service syntax |
| `node --check src/modules/tasks/tasks.service.js` | Check task service syntax |
| `node test-api.js` | Run API verification against a running server |

### Frontend Commands

Run from `client/`:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite development server |
| `npm run build` | Build production frontend bundle |
| `npm run preview` | Preview the production build locally |

### API Test Commands

Use two terminals.

Terminal 1, start backend with an isolated SQLite database:

```powershell
cd server
$env:JWT_SECRET="test-secret"
$env:DB_STORAGE="$env:TEMP\team-task-manager-test.sqlite"
npm start
```

Terminal 2, run the API suite:

```powershell
cd server
$env:API_BASE_URL="http://localhost:5000"
node test-api.js
```

Expected result:

```text
Results: 73 passed, 0 failed, 73 total
```

### Reset Local SQLite Database

Run from the project root:

```powershell
Remove-Item -LiteralPath ".\database.sqlite" -Force
```

The backend recreates the database on the next start.

---

## API Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

---

## API Endpoints

### Auth

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login and receive JWT |

### Projects

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/projects` | Authenticated | List accessible projects |
| POST | `/api/projects` | Admin | Create project |
| GET | `/api/projects/:id` | Authenticated | Get accessible project details |
| PUT | `/api/projects/:id` | Admin | Update project |
| DELETE | `/api/projects/:id` | Admin | Delete project |
| POST | `/api/projects/:id/members` | Admin | Add member |
| DELETE | `/api/projects/:id/members/:userId` | Admin | Remove member |

### Tasks

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/tasks` | Authenticated | List accessible tasks |
| POST | `/api/tasks` | Project member/Admin | Create task |
| GET | `/api/tasks/:id` | Authenticated | Get accessible task details |
| PUT | `/api/tasks/:id` | Creator/Assignee/Admin | Update task |
| PATCH | `/api/tasks/:id/status` | Creator/Assignee/Admin | Update task status |
| DELETE | `/api/tasks/:id` | Creator/Assignee/Admin | Delete task |

### Dashboard

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/dashboard` | Get task/project counts |

---

## Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Create/delete projects, manage members, full task CRUD |
| **Member** | View joined projects, create tasks in joined projects, assign project members, update/delete tasks they created or are assigned to |

**Note:** First user to signup becomes Admin automatically.

---

## Railway Deployment

1. Push to GitHub
2. Connect repo to Railway
3. Deploy - SQLite works out of the box for assignment/demo use (set `DB_STORAGE` if you need a custom SQLite path)

---

## License

MIT
