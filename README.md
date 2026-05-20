# Team Task Manager

A full-stack web application for team task management with role-based access control (Admin/Member).

## Features

- **Authentication**: Signup/Login with JWT
- **Project Management**: Create, view, and delete projects (Admin only)
- **Task Management**: Create, assign, and track tasks with status updates
- **Dashboard**: Overview of tasks, projects, and overdue items
- **Role-Based Access**: Admin/Member roles with appropriate permissions

## Tech Stack

- **Backend**: Node.js + Express + MongoDB (Mongoose)
- **Frontend**: React + Vite + Tailwind CSS
- **Authentication**: JWT + bcryptjs

## Project Structure

```
Assessment/
├── server/           # Backend API
│   ├── models/       # User, Project, Task models
│   ├── routes/       # API routes (auth, projects, tasks)
│   ├── middleware/   # Auth middleware
│   ├── server.js     # Main server file
│   └── package.json
├── client/           # Frontend React app
│   ├── src/
│   │   ├── pages/    # Login, Signup, Dashboard, Projects, Tasks
│   │   ├── components/  # Navbar, PrivateRoute
│   │   ├── context/  # AuthContext
│   │   └── services/ # API service
│   ├── package.json
│   └── vite.config.js
├── railway.json      # Railway deployment config
├── package.json      # Root package.json
└── SPEC.md           # Project specification
```

## Local Development

### Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)

### Setup

1. Install dependencies:
```bash
npm install
cd server && npm install
cd ../client && npm install
```

2. Configure environment:
```bash
# Edit server/.env
PORT=5000
MONGO_URI=mongodb://localhost:27017/team-task-manager
JWT_SECRET=your_secret_key_here
```

3. Start development:
```bash
# From root directory
npm run dev
```

- Backend: http://localhost:5000
- Frontend: http://localhost:5173

## Railway Deployment

1. Connect your GitHub repository to Railway
2. Add environment variables:
   - `MONGO_URI`: Your MongoDB connection string (use MongoDB Atlas or Railway's database)
   - `JWT_SECRET`: A secure random string
3. Deploy - Railway will auto-detect and build

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/signup | Register user | No |
| POST | /api/auth/login | Login user | No |
| GET | /api/projects | List projects | Yes |
| POST | /api/projects | Create project | Yes (Admin) |
| DELETE | /api/projects/:id | Delete project | Yes (Admin) |
| GET | /api/tasks | List tasks | Yes |
| POST | /api/tasks | Create task | Yes |
| PUT | /api/tasks/:id | Update task | Yes |
| DELETE | /api/tasks/:id | Delete task | Yes |
| GET | /api/dashboard | Dashboard stats | Yes |

## First User

The first user to signup becomes **Admin**. Subsequent users become **Members**.

## License

MIT