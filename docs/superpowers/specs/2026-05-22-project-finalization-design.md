# Team Task Manager Finalization Design

## Goal

Finalize the Team Task Manager project by fixing functional flaws, aligning role-based permissions, handling common edge cases, polishing the existing UI, and verifying the app with build/API checks.

## Current Context

The project is a React/Vite frontend with an Express/Sequelize/SQLite backend. The existing code supports authentication, projects, members, tasks, and a dashboard. The current implementation has mismatches between the spec, backend, and UI, especially around task permissions: backend routes are admin-only for task create/update/delete, while the UI exposes task controls more broadly.

## Chosen Approach

Use targeted finalization rather than a rewrite. Keep the current architecture and UI structure, then make small, correct changes that improve permissions, validation, user feedback, and responsiveness.

## Backend Design

Task permissions will follow the project-member model:

- Admins can manage all projects, members, and tasks.
- Project members can view tasks in projects they belong to.
- Project members can create tasks only inside projects they belong to.
- Project members can assign tasks only to users who are members of the selected project.
- Project members can update or delete tasks only when they created the task or are assigned to the task.
- Project members can update status for tasks assigned to them or created by them.

Backend validation will cover invalid or missing IDs, invalid status values, invalid dates, missing projects/users/tasks, unauthorized project access, duplicate member additions, creator removal from a project, and assignment to non-members. API errors will keep the existing JSON response shape.

## Data Model Adjustment

Tasks need to track who created them so member update/delete permissions can be enforced. Add a `createdById` field to tasks and associate it with `User` as the task creator. Existing task reads should include project, assigned user, and creator details where useful.

## Frontend Design

Keep the existing pages and Tailwind setup. Polish the current UI without a full redesign:

- Improve navbar spacing, wrapping, and mobile behavior.
- Make pages use consistent containers, cards, forms, buttons, loading states, errors, and empty states.
- Keep dashboard, projects, and tasks flows recognizable.
- Hide or disable actions that the current user cannot perform.
- Let task creation choose a project and, when possible, assign to a member of that project.
- Make task status, overdue state, due date, project, assignee, and creator easy to scan.

## Error Handling And Edge Cases

The UI should surface backend error messages without exposing stack traces. Empty project/task/member states should be clear. Forms should trim inputs, prevent duplicate submissions, and avoid sending invalid optional values such as empty dates or empty assignee IDs.

## Testing And Verification

Update the existing API test script to match the project-member task permission model. Verification should include:

- Auth signup/login and first-user admin behavior.
- Project CRUD and member management.
- Duplicate member and creator-removal protections.
- Member task creation in allowed projects.
- Rejection of task creation in projects where the user is not a member.
- Rejection of assignment to users outside the project.
- Member update/delete restrictions for unrelated tasks.
- Dashboard stats scoped to member projects.
- React production build.
- Server syntax checks.

## Documentation

Update README/SPEC as needed so they reflect the actual SQLite/Sequelize backend and the finalized permission model.
