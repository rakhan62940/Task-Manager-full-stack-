# Team Task Manager - Specification

## Project Overview

**Name:** Team Task Manager  
**Type:** Full-Stack Web Application  
**Purpose:** Assignment project for team/project/task management with role-based access  
**Tech Stack:** React, Express, Node.js, SQLite, Sequelize  
**Deployment:** Railway

## Functionality Specification

### Core Features

1. **Authentication**
   - Signup with name, email, password
   - Login with email, password
   - JWT-based session management
   - First user auto-promoted to Admin

2. **Project Management**
   - Create projects (Admin only)
   - View all projects (all users)
   - Add members to projects (Admin only)
   - Delete projects (Admin only)

3. **Task Management**
   - Create tasks within projects
    - Assign tasks to project members
   - Update task status (Todo, InProgress, Done)
   - Set due dates
   - Filter tasks by status

4. **Dashboard**
   - Overview of all tasks
   - Count by status (Todo, InProgress, Done)
   - Overdue tasks highlighting
   - Quick stats per project

5. **Role-Based Access Control (RBAC)**
    - Admin: Full CRUD on projects/tasks, member management
    - Member: View joined projects, create tasks in joined projects, update/delete tasks they created or are assigned to

### Data Models

**User**
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String ('Admin' | 'Member')
}
```

**Project**
```javascript
{
  title: String,
  description: String,
  createdById: Number (User),
  members: [Number (User)],
  createdAt: Date
}
```

**Task**
```javascript
{
  title: String,
  description: String,
  status: String ('Todo' | 'InProgress' | 'Done'),
  projectId: Number (Project),
  assignedToId: Number (User),
  createdById: Number (User),
  dueDate: Date,
  createdAt: Date
}
```

### API Endpoints

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| POST | /api/auth/signup | Register user | No | - |
| POST | /api/auth/login | Login user | No | - |
| GET | /api/projects | List projects | Yes | All |
| POST | /api/projects | Create project | Yes | Admin |
| DELETE | /api/projects/:id | Delete project | Yes | Admin |
| POST | /api/projects/:id/members | Add member | Yes | Admin |
| GET | /api/tasks | List tasks | Yes | All |
| POST | /api/tasks | Create task in joined project | Yes | Admin/Project member |
| PUT | /api/tasks/:id | Update task | Yes | Admin/Creator/Assignee |
| GET | /api/dashboard | Dashboard stats | Yes | All |

### Validation Rules

- Email: valid format, unique
- Password: min 6 characters
- Project title: required, min 3 chars
- Task title: required, min 3 chars
- Due date: optional, date format

## Frontend Structure

```
client/src/
├── pages/
│   ├── Login.jsx
│   ├── Signup.jsx
│   ├── Dashboard.jsx
│   ├── Projects.jsx
│   └── Tasks.jsx
├── components/
│   ├── Navbar.jsx
│   ├── ProjectCard.jsx
│   └── TaskCard.jsx
├── context/
│   └── AuthContext.jsx
├── services/
│   └── api.js
└── App.jsx
```

## Acceptance Criteria

1. ✅ User can signup and login
2. ✅ Admin can create projects and add members
3. ✅ Project members can create and view tasks in joined projects
4. ✅ Tasks can be assigned to project members and status updated by allowed users
5. ✅ Dashboard shows task counts and overdue items
6. ✅ RBAC enforced on backend and frontend
7. ✅ Application deployed and accessible on Railway
8. ✅ Clean, working UI with proper navigation
