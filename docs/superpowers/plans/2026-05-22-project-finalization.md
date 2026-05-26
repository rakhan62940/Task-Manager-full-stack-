# Project Finalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Commit steps are intentionally omitted because the current environment policy forbids commits without explicit user request.

**Goal:** Finalize Team Task Manager by aligning member task permissions, tightening backend edge cases, polishing the existing UI, updating docs, and verifying the project.

**Architecture:** Keep the current Express module structure and React/Vite page structure. Add task creator tracking in the backend, enforce project-member permissions in service methods, and keep the frontend actions aligned with backend permissions.

**Tech Stack:** React 18, Vite, Tailwind CSS, Axios, Express, Sequelize, SQLite, JWT, bcryptjs, express-validator.

---

## File Structure

- Modify `server/config/db.js`: allow a configurable SQLite storage path for isolated verification runs.
- Modify `server/server.js`: sync schema updates safely and keep dashboard scoping consistent.
- Modify `server/src/models/Task.js`: add `createdById` so member task ownership can be enforced.
- Modify `server/src/models/associations.js`: add `Task.creator` and `User.createdTasks` associations.
- Modify `server/src/modules/projects/projects.controller.js`: pass the current user into project service reads.
- Modify `server/src/modules/projects/projects.service.js`: scope projects for members and harden member edge cases.
- Modify `server/src/modules/projects/projects.validation.js`: validate project updates and member IDs.
- Modify `server/src/modules/projects/projects.route.js`: attach validation to update/member routes.
- Modify `server/src/modules/tasks/tasks.route.js`: allow authenticated users through and let service enforce permissions.
- Modify `server/src/modules/tasks/tasks.controller.js`: pass the current user into task service operations.
- Modify `server/src/modules/tasks/tasks.service.js`: enforce project membership, creator/assignee rules, and assignment validation.
- Modify `server/src/modules/tasks/tasks.validation.js`: validate create/update/status payloads.
- Modify `server/test-api.js`: cover the chosen project-member task permission model.
- Modify `client/src/services/api.js`: support deployed API URL and preserve consistent error messages.
- Modify `client/src/components/Navbar.jsx`: improve responsive layout and active navigation styling.
- Modify `client/src/components/PrivateRoute.jsx`: improve loading state polish.
- Modify `client/src/App.jsx`: add app-level background/layout consistency.
- Modify `client/src/pages/Login.jsx`: polish the auth form and trim payloads.
- Modify `client/src/pages/Signup.jsx`: polish the auth form and trim payloads.
- Modify `client/src/pages/Dashboard.jsx`: add consistent loading/error/cards and safer defaults.
- Modify `client/src/pages/Projects.jsx`: improve forms, member workflows, empty states, and responsive cards.
- Modify `client/src/pages/Tasks.jsx`: add assignment UI, permission-aware actions, safer payloads, and polished task cards.
- Modify `README.md` and `SPEC.md`: document SQLite/Sequelize and option 2 task permissions.

## Task 1: Backend Task Ownership And Schema

**Files:**
- Modify: `server/config/db.js`
- Modify: `server/server.js`
- Modify: `server/src/models/Task.js`
- Modify: `server/src/models/associations.js`

- [ ] **Step 1: Write the failing API expectation**

In `server/test-api.js`, add an expectation in the task creation section that a created task includes `createdById` matching the member or admin who created it:

```javascript
test('Created task tracks creator', taskRes.data.data?.createdById === signupRes.data.data.user.id);
```

- [ ] **Step 2: Run the targeted API script against the current backend**

Run: `node server/test-api.js` while the server is running with a fresh test database.
Expected: the new creator assertion fails because tasks do not track `createdById` yet.

- [ ] **Step 3: Make SQLite storage configurable**

Replace `server/config/db.js` with:

```javascript
const { Sequelize } = require('sequelize');
const path = require('path');

const storage = process.env.DB_STORAGE || path.join(__dirname, '../../database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage,
  logging: false,
});

module.exports = { sequelize };
```

- [ ] **Step 4: Add task creator column to the model**

In `server/src/models/Task.js`, add `createdById` after `assignedToId`:

```javascript
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
```

- [ ] **Step 5: Add creator associations**

In `server/src/models/associations.js`, after the assigned user association, add:

```javascript
Task.belongsTo(User, { foreignKey: 'createdById', as: 'creator' });
User.hasMany(Task, { foreignKey: 'createdById', as: 'createdTasks' });
```

- [ ] **Step 6: Enable schema alteration for the assignment database**

In `server/server.js`, change:

```javascript
sequelize.sync().then(() => {
```

to:

```javascript
sequelize.sync({ alter: true }).then(() => {
```

- [ ] **Step 7: Verify syntax**

Run: `node --check server.js` from `server`.
Expected: no output and exit code 0.

## Task 2: Backend Project Scoping And Member Edge Cases

**Files:**
- Modify: `server/src/modules/projects/projects.controller.js`
- Modify: `server/src/modules/projects/projects.service.js`
- Modify: `server/src/modules/projects/projects.validation.js`
- Modify: `server/src/modules/projects/projects.route.js`

- [ ] **Step 1: Add failing API expectations**

In `server/test-api.js`, add project/member assertions for member scoping and non-member removal:

```javascript
test('Member sees only joined projects', memberProjectsRes.data.data?.length === 1);
test('Remove non-member => 404', removeNonMemberRes.status === 404);
```

- [ ] **Step 2: Pass user context into project reads**

In `projects.controller.js`, change `getAll` and `getById` calls to:

```javascript
const data = await projectsService.getAll(req.user.id, req.user.role);
const data = await projectsService.getById(req.params.id, req.user.id, req.user.role);
```

- [ ] **Step 3: Scope project service reads**

In `projects.service.js`, implement these helpers and signatures:

```javascript
const getProjectIdsForUser = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) return [];
  const projects = await user.getProjects();
  return projects.map(project => project.id);
};

const ensureProjectVisible = async (project, userId, role) => {
  if (!project) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }
  if (role === 'admin') return;
  const projectIds = await getProjectIdsForUser(userId);
  if (!projectIds.includes(project.id)) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }
};
```

Update `getAll` so admins get all projects and members get only joined projects:

```javascript
const getAll = async (userId, role) => {
  const where = {};
  if (role !== 'admin') {
    const projectIds = await getProjectIdsForUser(userId);
    if (projectIds.length === 0) return [];
    where.id = projectIds;
  }
  return Project.findAll({
    where,
    include: [
      { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
      { model: User, as: 'members', attributes: ['id', 'name', 'email'] },
    ],
    order: [['createdAt', 'DESC']],
  });
};
```

- [ ] **Step 4: Harden remove-member behavior**

In `removeMember`, after the creator check, add:

```javascript
const members = await project.getMembers();
const isMember = members.some(member => member.id === Number(userId));
if (!isMember) {
  const err = new Error('User is not a member of this project');
  err.statusCode = 404;
  throw err;
}
```

- [ ] **Step 5: Add route validations**

In `projects.validation.js`, export:

```javascript
const updateProjectValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
];

const memberValidation = [
  body('userId')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('Invalid user ID'),
];

module.exports = { createProjectValidation, updateProjectValidation, memberValidation };
```

In `projects.route.js`, use `updateProjectValidation` on `PUT /:id` and `memberValidation` on `POST /:id/members`.

- [ ] **Step 6: Verify syntax**

Run: `node --check src/modules/projects/projects.service.js` from `server`.
Expected: no output and exit code 0.

## Task 3: Backend Task Permission Model

**Files:**
- Modify: `server/src/modules/tasks/tasks.route.js`
- Modify: `server/src/modules/tasks/tasks.controller.js`
- Modify: `server/src/modules/tasks/tasks.service.js`
- Modify: `server/src/modules/tasks/tasks.validation.js`

- [ ] **Step 1: Add failing API expectations**

In `server/test-api.js`, add assertions for option 2:

```javascript
test('Project member can create task => 201', memberTaskRes.status === 201);
test('Non-member create task => 403', outsiderTaskRes.status === 403);
test('Assign outside project => 400', invalidAssignRes.status === 400);
test('Unrelated member delete => 403', unrelatedDeleteRes.status === 403);
test('Creator can delete own task => 200', deleteMemberTaskRes.status === 200);
```

- [ ] **Step 2: Let services enforce permissions**

In `tasks.route.js`, remove `roleMiddleware('admin')` from `POST /`, `PUT /:id`, and `DELETE /:id` so the routes are:

```javascript
router.post('/', createTaskValidation, tasksController.create);
router.put('/:id', updateTaskValidation, tasksController.update);
router.delete('/:id', tasksController.remove);
```

- [ ] **Step 3: Pass current user into task service calls**

In `tasks.controller.js`, call services with `req.user.id` and `req.user.role`:

```javascript
const data = await tasksService.create(req.body, req.user.id, req.user.role);
const data = await tasksService.getById(req.params.id, req.user.id, req.user.role);
const data = await tasksService.update(req.params.id, req.body, req.user.id, req.user.role);
const data = await tasksService.remove(req.params.id, req.user.id, req.user.role);
```

- [ ] **Step 4: Add task permission helpers**

In `tasks.service.js`, add helpers near the top:

```javascript
const VALID_STATUSES = ['todo', 'in-progress', 'done'];

const getProjectIdsForUser = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) return [];
  const projects = await user.getProjects();
  return projects.map(project => project.id);
};

const isProjectMember = async (projectId, userId) => {
  const projectIds = await getProjectIdsForUser(userId);
  return projectIds.includes(Number(projectId));
};

const ensureProjectAccess = async (projectId, userId, role) => {
  if (role === 'admin') return;
  if (!(await isProjectMember(projectId, userId))) {
    const err = new Error('You do not have access to this project');
    err.statusCode = 403;
    throw err;
  }
};

const ensureTaskManageAccess = (task, userId, role) => {
  if (role === 'admin') return;
  if (task.createdById !== userId && task.assignedToId !== userId) {
    const err = new Error('You can only manage tasks you created or are assigned to');
    err.statusCode = 403;
    throw err;
  }
};

const ensureAssignedUserIsProjectMember = async (project, assignedToId) => {
  if (!assignedToId) return;
  const assignedUser = await User.findByPk(assignedToId);
  if (!assignedUser) {
    const err = new Error('Assigned user not found');
    err.statusCode = 404;
    throw err;
  }
  const members = await project.getMembers();
  const isMember = members.some(member => member.id === Number(assignedToId));
  if (!isMember) {
    const err = new Error('Assigned user must be a member of the project');
    err.statusCode = 400;
    throw err;
  }
};
```

- [ ] **Step 5: Include creator details in task reads**

Use this include list in `getAll` and `getById`:

```javascript
include: [
  { model: Project, as: 'project', attributes: ['id', 'title'] },
  { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email'] },
  { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
]
```

- [ ] **Step 6: Implement create/update/status/delete rules**

Use these method bodies in `tasks.service.js`:

```javascript
const create = async ({ title, description, projectId, assignedToId, dueDate, status }, userId, role) => {
  const project = await Project.findByPk(projectId);
  if (!project) {
    const err = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  }
  await ensureProjectAccess(projectId, userId, role);
  await ensureAssignedUserIsProjectMember(project, assignedToId);
  const task = await Task.create({
    title,
    description,
    projectId,
    assignedToId: assignedToId || null,
    dueDate: dueDate || null,
    status: VALID_STATUSES.includes(status) ? status : 'todo',
    createdById: userId,
  });
  return getById(task.id, userId, role);
};

const getById = async (id, userId, role) => {
  const task = await Task.findByPk(id, { include: taskIncludes });
  if (!task) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }
  await ensureProjectAccess(task.projectId, userId, role);
  return task;
};

const update = async (id, payload, userId, role) => {
  const task = await getById(id, userId, role);
  ensureTaskManageAccess(task, userId, role);
  const project = await Project.findByPk(task.projectId);
  await ensureAssignedUserIsProjectMember(project, payload.assignedToId);
  const updates = {
    title: payload.title,
    description: payload.description,
    status: payload.status,
    assignedToId: payload.assignedToId || null,
    dueDate: payload.dueDate || null,
  };
  Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);
  await task.update(updates);
  return getById(task.id, userId, role);
};

const updateStatus = async (id, status, userId, role) => {
  const task = await getById(id, userId, role);
  ensureTaskManageAccess(task, userId, role);
  await task.update({ status });
  return getById(task.id, userId, role);
};

const remove = async (id, userId, role) => {
  const task = await getById(id, userId, role);
  ensureTaskManageAccess(task, userId, role);
  await task.destroy();
  return { message: 'Task deleted' };
};
```

- [ ] **Step 7: Validate task update payloads**

In `tasks.validation.js`, export `updateTaskValidation`:

```javascript
const updateTaskValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'done']).withMessage('Invalid status'),
  body('assignedToId')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 }).withMessage('Invalid assigned user ID'),
  body('dueDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage('Invalid due date'),
];

module.exports = { createTaskValidation, updateTaskValidation, updateStatusValidation };
```

- [ ] **Step 8: Verify syntax**

Run: `node --check src/modules/tasks/tasks.service.js` from `server`.
Expected: no output and exit code 0.

## Task 4: API Test Coverage

**Files:**
- Modify: `server/test-api.js`

- [ ] **Step 1: Make the API test deterministic**

Use unique email suffixes to avoid collisions:

```javascript
const runId = Date.now();
const adminEmail = `admin-${runId}@test.com`;
const memberEmail = `member-${runId}@test.com`;
const outsiderEmail = `outsider-${runId}@test.com`;
```

- [ ] **Step 2: Cover option 2 behavior**

Add these request groups:

```javascript
const memberTaskRes = await makeRequest('POST', '/api/tasks', {
  title: 'Member Task',
  description: 'Created by a project member',
  projectId,
  assignedToId: foundUserId,
  status: 'todo',
  dueDate: '2026-06-02'
}, memberToken);

const outsiderTaskRes = await makeRequest('POST', '/api/tasks', {
  title: 'Outsider Task',
  projectId,
}, outsiderToken);

const invalidAssignRes = await makeRequest('POST', '/api/tasks', {
  title: 'Bad Assignment',
  projectId,
  assignedToId: outsiderUserId,
}, adminToken);
```

- [ ] **Step 3: Verify creator and assignee deletion rules**

Add assertions that an unrelated member cannot delete someone else's task and the creator can delete their own task:

```javascript
const unrelatedDeleteRes = await makeRequest('DELETE', `/api/tasks/${taskId}`, null, outsiderToken);
test('Unrelated member delete => 403', unrelatedDeleteRes.status === 403);

const deleteMemberTaskRes = await makeRequest('DELETE', `/api/tasks/${memberTaskRes.data.data.id}`, null, memberToken);
test('Creator can delete own task => 200', deleteMemberTaskRes.status === 200);
```

- [ ] **Step 4: Run API tests**

Start the server with a temporary database:

```powershell
$env:DB_STORAGE="C:\Users\ss\AppData\Local\Temp\opencode\team-task-manager-test.sqlite"; npm start
```

In another process, run:

```powershell
node test-api.js
```

Expected: all API test assertions pass.

## Task 5: Frontend Service And Navigation Polish

**Files:**
- Modify: `client/src/services/api.js`
- Modify: `client/src/App.jsx`
- Modify: `client/src/components/Navbar.jsx`
- Modify: `client/src/components/PrivateRoute.jsx`

- [ ] **Step 1: Build first to capture current baseline**

Run: `npm run build` from `client`.
Expected: build succeeds before UI edits.

- [ ] **Step 2: Make API base URL deployment-friendly**

In `api.js`, set:

```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
});
```

- [ ] **Step 3: Add app-level visual background**

In `App.jsx`, wrap routes with:

```jsx
<div className="min-h-screen bg-slate-100 text-slate-900">
  <Navbar />
  <main>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
      <Route path="/tasks" element={<PrivateRoute><Tasks /></PrivateRoute>} />
    </Routes>
  </main>
</div>
```

- [ ] **Step 4: Replace navbar layout with responsive NavLink styling**

Use `NavLink` for Dashboard, Projects, and Tasks, keep logout, and allow wrapping on small screens:

```jsx
const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-50 hover:bg-blue-500 hover:text-white'}`;
```

- [ ] **Step 5: Improve protected route loading**

In `PrivateRoute.jsx`, return a centered loading card:

```jsx
if (loading) {
  return <div className="flex min-h-[60vh] items-center justify-center text-slate-600">Loading your workspace...</div>;
}
```

- [ ] **Step 6: Rebuild client**

Run: `npm run build` from `client`.
Expected: Vite build succeeds.

## Task 6: Frontend Pages And Permission-Aware UI

**Files:**
- Modify: `client/src/pages/Login.jsx`
- Modify: `client/src/pages/Signup.jsx`
- Modify: `client/src/pages/Dashboard.jsx`
- Modify: `client/src/pages/Projects.jsx`
- Modify: `client/src/pages/Tasks.jsx`

- [ ] **Step 1: Trim auth payloads**

In `Login.jsx`, submit:

```javascript
await login(formData.email.trim(), formData.password);
```

In `Signup.jsx`, submit:

```javascript
await signup(formData.name.trim(), formData.email.trim(), formData.password);
```

- [ ] **Step 2: Polish auth cards**

Use consistent classes for the auth shell:

```jsx
<div className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-10">
  <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
```

- [ ] **Step 3: Harden dashboard rendering**

Use safe defaults before rendering stats:

```javascript
const dashboardStats = stats || {
  totalTasks: 0,
  todoTasks: 0,
  inProgressTasks: 0,
  doneTasks: 0,
  overdueTasks: 0,
  totalProjects: 0,
  totalUsers: 0,
};
```

- [ ] **Step 4: Trim project form and member email**

In `Projects.jsx`, submit projects with trimmed strings and member lookup with `memberEmail.trim()`.

- [ ] **Step 5: Add project member error by project ID**

Replace one shared `memberError` string with an object keyed by project ID:

```javascript
const [memberErrors, setMemberErrors] = useState({});
setMemberErrors(prev => ({ ...prev, [projectId]: message }));
```

- [ ] **Step 6: Add task assignment and permission helpers**

In `Tasks.jsx`, import auth context and add:

```javascript
const { user } = useContext(AuthContext);
const selectedProject = projects.find(project => String(project.id) === String(formData.projectId));
const canManageTask = (task) => user?.role === 'admin' || task.createdById === user?.id || task.assignedToId === user?.id;
```

- [ ] **Step 7: Send safe task create payloads**

Build the payload before `api.post('/tasks', payload)`:

```javascript
const payload = {
  title: formData.title.trim(),
  description: formData.description.trim(),
  projectId: Number(formData.projectId),
  status: formData.status,
};
if (formData.assignedToId) payload.assignedToId = Number(formData.assignedToId);
if (formData.dueDate) payload.dueDate = formData.dueDate;
```

- [ ] **Step 8: Add assignee select from selected project members**

Render this field in the task form:

```jsx
<select
  className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
  value={formData.assignedToId}
  onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
  disabled={!selectedProject}
>
  <option value="">Unassigned</option>
  {selectedProject?.members?.map(member => (
    <option key={member.id} value={member.id}>{member.name}</option>
  ))}
</select>
```

- [ ] **Step 9: Hide disallowed task actions**

Use this render pattern for each task card:

```jsx
{canManageTask(task) ? (
  <select
    value={task.status}
    onChange={(e) => handleStatusUpdate(task.id, e.target.value)}
    className="w-full rounded-lg border border-slate-300 p-2 text-sm"
  >
    <option value="todo">Todo</option>
    <option value="in-progress">In Progress</option>
    <option value="done">Done</option>
  </select>
) : (
  <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-500">Read-only task</p>
)}
{canManageTask(task) && (
  <button onClick={() => handleDelete(task.id)} className="mt-3 text-sm font-medium text-red-600 hover:text-red-700">
    Delete
  </button>
)}
```

- [ ] **Step 10: Rebuild client**

Run: `npm run build` from `client`.
Expected: Vite build succeeds.

## Task 7: Documentation And Final Verification

**Files:**
- Modify: `README.md`
- Modify: `SPEC.md`

- [ ] **Step 1: Update documented stack**

Change references from MERN/MongoDB to React, Express, Node.js, SQLite, and Sequelize.

- [ ] **Step 2: Update role permissions**

Document:

```markdown
| **Member** | View joined projects, create tasks in joined projects, assign project members, update/delete tasks they created or are assigned to |
```

- [ ] **Step 3: Run server syntax checks**

Run these from `server`:

```powershell
node --check server.js
node --check src/modules/projects/projects.service.js
node --check src/modules/tasks/tasks.service.js
```

Expected: each command exits with code 0.

- [ ] **Step 4: Run client build**

Run: `npm run build` from `client`.
Expected: Vite build succeeds.

- [ ] **Step 5: Run API verification**

Run the backend with `DB_STORAGE` pointing at a temp SQLite file, then run `node test-api.js` from `server`.
Expected: API tests report zero failures.

## Self-Review

- Spec coverage: backend permissions, creator tracking, project/member edge cases, frontend UI polish, docs, and verification are each mapped to tasks.
- Placeholder scan: no unresolved placeholder markers or deferred requirements remain.
- Type consistency: task creator field is consistently named `createdById`; user association aliases are `assignedTo` and `creator`; role values remain `admin` and `member`; status values remain `todo`, `in-progress`, and `done`.
