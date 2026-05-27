const http = require('http');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

const makeRequest = (method, path, data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + (url.search || ''),
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'x-auth-token': token }),
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) req.write(JSON.stringify(data));
    req.end();
  });
};

let passed = 0;
let failed = 0;

function test(name, condition) {
  if (condition) {
    console.log(`  PASS ${name}`);
    passed += 1;
  } else {
    console.log(`  FAIL ${name}`);
    failed += 1;
  }
}

async function runTests() {
  const runId = Date.now();
  const adminEmail = `admin-${runId}@test.com`;
  const memberEmail = `member-${runId}@test.com`;
  const outsiderEmail = `outsider-${runId}@test.com`;

  console.log('Starting API tests');
  console.log(`Base URL: ${BASE_URL}\n`);

  console.log('--- Auth Tests ---');

  const signupRes = await makeRequest('POST', '/api/auth/signup', {
    name: 'Admin User',
    email: adminEmail,
    password: 'password123',
  });
  test('Admin signup status 201', signupRes.status === 201);
  test('Admin signup success is true', signupRes.data.success === true);
  test('Admin signup has token', !!signupRes.data.data?.token);
  test('First user role is admin', signupRes.data.data?.user?.role === 'admin');
  const adminToken = signupRes.data.data?.token;
  const adminUser = signupRes.data.data?.user;

  const dupRes = await makeRequest('POST', '/api/auth/signup', {
    name: 'Duplicate User',
    email: adminEmail,
    password: 'password123',
  });
  test('Duplicate email => 409', dupRes.status === 409);

  const signup2Res = await makeRequest('POST', '/api/auth/signup', {
    name: 'Member User',
    email: memberEmail,
    password: 'password123',
  });
  test('Member signup status 201', signup2Res.status === 201);
  test('Second user role is member', signup2Res.data.data?.user?.role === 'member');
  const memberToken = signup2Res.data.data?.token;
  const memberUser = signup2Res.data.data?.user;

  const signup3Res = await makeRequest('POST', '/api/auth/signup', {
    name: 'Outsider User',
    email: outsiderEmail,
    password: 'password123',
  });
  test('Outsider signup status 201', signup3Res.status === 201);
  const outsiderToken = signup3Res.data.data?.token;
  const outsiderUser = signup3Res.data.data?.user;

  const loginRes = await makeRequest('POST', '/api/auth/login', {
    email: adminEmail,
    password: 'password123',
  });
  test('Login status 200', loginRes.status === 200);

  const badLoginRes = await makeRequest('POST', '/api/auth/login', {
    email: adminEmail,
    password: 'wrongpassword',
  });
  test('Wrong password => 401', badLoginRes.status === 401);

  const noAuthRes = await makeRequest('GET', '/api/projects');
  test('No token => 401', noAuthRes.status === 401);

  console.log('\n--- Project Tests ---');

  const memberProjectCreateRes = await makeRequest('POST', '/api/projects', {
    title: 'Member Project',
    description: 'Should fail',
  }, memberToken);
  test('Non-admin create project => 403', memberProjectCreateRes.status === 403);

  const projectRes = await makeRequest('POST', '/api/projects', {
    title: 'Test Project',
    description: 'A test project',
  }, adminToken);
  test('Admin create project => 201', projectRes.status === 201);
  test('Project has id', !!projectRes.data.data?.id);
  test('Creator name = Admin User', projectRes.data.data?.creator?.name === 'Admin User');
  test('Creator added as member', projectRes.data.data?.members?.some(user => user.id === adminUser?.id));
  const projectId = projectRes.data.data?.id;

  const memberProjectsBeforeAddRes = await makeRequest('GET', '/api/projects', null, memberToken);
  test('Member sees no projects before being added', memberProjectsBeforeAddRes.data.data?.length === 0);

  const projectsRes = await makeRequest('GET', '/api/projects', null, adminToken);
  test('Admin get projects => 200', projectsRes.status === 200);
  test('Admin has at least 1 project', projectsRes.data.data?.length >= 1);

  const projectByIdRes = await makeRequest('GET', `/api/projects/${projectId}`, null, adminToken);
  test('Admin get project by id => 200', projectByIdRes.status === 200);
  test('Project title matches', projectByIdRes.data.data?.title === 'Test Project');

  const projectNotFoundRes = await makeRequest('GET', '/api/projects/999999', null, adminToken);
  test('Project not found => 404', projectNotFoundRes.status === 404);

  const badProjectRes = await makeRequest('POST', '/api/projects', {
    title: '',
    description: 'test',
  }, adminToken);
  test('Empty project title => 400', badProjectRes.status === 400);

  const findMemberRes = await makeRequest('GET', `/api/auth/users?email=${memberEmail}`, null, adminToken);
  test('Find member => 200', findMemberRes.status === 200);
  test('Found member name = Member User', findMemberRes.data.data?.name === 'Member User');
  const foundUserId = findMemberRes.data.data?.id;

  const findOutsiderRes = await makeRequest('GET', `/api/auth/users?email=${outsiderEmail}`, null, adminToken);
  test('Find outsider => 200', findOutsiderRes.status === 200);
  const outsiderUserId = findOutsiderRes.data.data?.id;

  const findNotFoundRes = await makeRequest('GET', '/api/auth/users?email=nonexistent@test.com', null, adminToken);
  test('Find nonexistent user => 404', findNotFoundRes.status === 404);

  const addMemberRes = await makeRequest('POST', `/api/projects/${projectId}/members`, {
    userId: foundUserId,
  }, adminToken);
  test('Add member => 200', addMemberRes.status === 200);
  test('Project has member user', addMemberRes.data.data?.members?.some(user => user.id === foundUserId));

  const dupMemberRes = await makeRequest('POST', `/api/projects/${projectId}/members`, {
    userId: foundUserId,
  }, adminToken);
  test('Duplicate member => 409', dupMemberRes.status === 409);

  const removeCreatorRes = await makeRequest('DELETE', `/api/projects/${projectId}/members/${adminUser?.id}`, null, adminToken);
  test('Remove creator => 400', removeCreatorRes.status === 400);

  const removeNonMemberRes = await makeRequest('DELETE', `/api/projects/${projectId}/members/${outsiderUserId}`, null, adminToken);
  test('Remove non-member => 404', removeNonMemberRes.status === 404);

  const memberProjectsAfterAddRes = await makeRequest('GET', '/api/projects', null, memberToken);
  test('Member sees joined project', memberProjectsAfterAddRes.data.data?.length === 1);

  const outsiderProjectsRes = await makeRequest('GET', '/api/projects', null, outsiderToken);
  test('Outsider sees no projects', outsiderProjectsRes.data.data?.length === 0);

  console.log('\n--- Task Tests ---');

  const taskRes = await makeRequest('POST', '/api/tasks', {
    title: 'Admin Task',
    description: 'A task assigned to the member',
    projectId,
    assignedToId: foundUserId,
    status: 'todo',
    dueDate: '2026-06-01',
  }, adminToken);
  test('Admin create task => 201', taskRes.status === 201);
  test('Admin task has id', !!taskRes.data.data?.id);
  test('Created task tracks admin creator', taskRes.data.data?.createdById === adminUser?.id);
  test('Admin task assigned to member', taskRes.data.data?.assignedTo?.id === foundUserId);
  const taskId = taskRes.data.data?.id;

  const memberTaskRes = await makeRequest('POST', '/api/tasks', {
    title: 'Member Task',
    description: 'Created by a project member',
    projectId,
    assignedToId: foundUserId,
    status: 'todo',
    dueDate: '2026-06-02',
  }, memberToken);
  test('Project member can create task => 201', memberTaskRes.status === 201);
  test('Member task tracks member creator', memberTaskRes.data.data?.createdById === memberUser?.id);
  const memberTaskId = memberTaskRes.data.data?.id || 0;

  const outsiderTaskRes = await makeRequest('POST', '/api/tasks', {
    title: 'Outsider Task',
    projectId,
  }, outsiderToken);
  test('Non-member create task => 403', outsiderTaskRes.status === 403);

  const invalidAssignRes = await makeRequest('POST', '/api/tasks', {
    title: 'Bad Assignment',
    projectId,
    assignedToId: outsiderUserId,
  }, adminToken);
  test('Assign outside project => 400', invalidAssignRes.status === 400);

  const badTaskRes = await makeRequest('POST', '/api/tasks', {
    title: '',
    projectId,
  }, adminToken);
  test('Empty task title => 400', badTaskRes.status === 400);

  const noProjectTaskRes = await makeRequest('POST', '/api/tasks', {
    title: 'No Project Task',
    projectId: '',
  }, adminToken);
  test('No project => 400', noProjectTaskRes.status === 400);

  const tasksRes = await makeRequest('GET', '/api/tasks', null, adminToken);
  test('Admin sees tasks => 200', tasksRes.status === 200);
  test('Admin sees at least 2 tasks', tasksRes.data.data?.length >= 2);

  const memberTasksRes = await makeRequest('GET', '/api/tasks', null, memberToken);
  test('Member sees project tasks => 200', memberTasksRes.status === 200);
  test('Member sees at least 2 project tasks', memberTasksRes.data.data?.length >= 2);

  const outsiderTasksRes = await makeRequest('GET', '/api/tasks', null, outsiderToken);
  test('Outsider sees no tasks', outsiderTasksRes.data.data?.length === 0);

  const memberStatusRes = await makeRequest('PATCH', `/api/tasks/${taskId}/status`, {
    status: 'in-progress',
  }, memberToken);
  test('Assigned member can update status => 200', memberStatusRes.status === 200);
  test('Status = in-progress', memberStatusRes.data.data?.status === 'in-progress');

  const outsiderStatusRes = await makeRequest('PATCH', `/api/tasks/${taskId}/status`, {
    status: 'done',
  }, outsiderToken);
  test('Unrelated member status update => 403', outsiderStatusRes.status === 403);

  const badStatusRes = await makeRequest('PATCH', `/api/tasks/${taskId}/status`, {
    status: 'invalid-status',
  }, adminToken);
  test('Invalid status => 400', badStatusRes.status === 400);

  const taskByIdRes = await makeRequest('GET', `/api/tasks/${taskId}`, null, adminToken);
  test('Admin get task by id => 200', taskByIdRes.status === 200);
  test('Task title matches', taskByIdRes.data.data?.title === 'Admin Task');

  const outsiderTaskByIdRes = await makeRequest('GET', `/api/tasks/${taskId}`, null, outsiderToken);
  test('Outsider task by id => 403', outsiderTaskByIdRes.status === 403);

  console.log('\n--- Dashboard Tests ---');

  const dashRes = await makeRequest('GET', '/api/dashboard', null, adminToken);
  test('Admin dashboard => 200', dashRes.status === 200);
  test('Admin dashboard has at least 2 tasks', dashRes.data.data?.totalTasks >= 2);
  test('Admin dashboard has at least 1 project', dashRes.data.data?.totalProjects >= 1);
  test('Admin dashboard has at least 3 users', dashRes.data.data?.totalUsers >= 3);

  const memberDashRes = await makeRequest('GET', '/api/dashboard', null, memberToken);
  test('Member dashboard => 200', memberDashRes.status === 200);
  test('Member dashboard scoped to project tasks', memberDashRes.data.data?.totalTasks >= 2);
  test('Member dashboard scoped to joined project', memberDashRes.data.data?.totalProjects === 1);

  const outsiderDashRes = await makeRequest('GET', '/api/dashboard', null, outsiderToken);
  test('Outsider dashboard => 200', outsiderDashRes.status === 200);
  test('Outsider dashboard has no tasks', outsiderDashRes.data.data?.totalTasks === 0);
  test('Outsider dashboard has no projects', outsiderDashRes.data.data?.totalProjects === 0);

  console.log('\n--- Cleanup Tests ---');

  const unrelatedDeleteRes = await makeRequest('DELETE', `/api/tasks/${taskId}`, null, outsiderToken);
  test('Unrelated member delete => 403', unrelatedDeleteRes.status === 403);

  const deleteMemberTaskRes = await makeRequest('DELETE', `/api/tasks/${memberTaskId}`, null, memberToken);
  test('Creator can delete own task => 200', deleteMemberTaskRes.status === 200);

  const deleteTaskRes = await makeRequest('DELETE', `/api/tasks/${taskId}`, null, adminToken);
  test('Admin delete task => 200', deleteTaskRes.status === 200);

  const deleteNonexistentTaskRes = await makeRequest('DELETE', '/api/tasks/999999', null, adminToken);
  test('Delete nonexistent task => 404', deleteNonexistentTaskRes.status === 404);

  const removeMemberRes = await makeRequest('DELETE', `/api/projects/${projectId}/members/${foundUserId}`, null, adminToken);
  test('Remove member => 200', removeMemberRes.status === 200);

  const deleteProjectRes = await makeRequest('DELETE', `/api/projects/${projectId}`, null, adminToken);
  test('Delete project => 200', deleteProjectRes.status === 200);

  const deleteNonexistentProjectRes = await makeRequest('DELETE', '/api/projects/999999', null, adminToken);
  test('Delete nonexistent project => 404', deleteNonexistentProjectRes.status === 404);

  console.log('\n' + '='.repeat(45));
  console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log('='.repeat(45));

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
