import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const statusMap = {
  'todo': { label: 'To Do', dot: 'bg-slate-400' },
  'in-progress': { label: 'In Progress', dot: 'bg-amber-400' },
  'done': { label: 'Done', dot: 'bg-emerald-400' },
};

const columnConfig = [
  { key: 'todo', label: 'To Do', tone: 'bg-slate-100 text-slate-600' },
  { key: 'in-progress', label: 'In Progress', tone: 'bg-amber-100 text-amber-700' },
  { key: 'done', label: 'Done', tone: 'bg-emerald-100 text-emerald-700' },
];

const getStatusColor = (status) => {
  switch (status) {
    case 'todo': return 'bg-yellow-50 text-yellow-700 ring-yellow-200';
    case 'in-progress': return 'bg-blue-50 text-blue-700 ring-blue-200';
    case 'done': return 'bg-green-50 text-green-700 ring-green-200';
    default: return 'bg-slate-100 text-slate-600 ring-slate-200';
  }
};

const getStatusLabel = (status) => {
  if (status === 'in-progress') return 'In Progress';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const nextStatus = { 'todo': 'in-progress', 'in-progress': 'done', 'done': 'todo' };

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingProject, setEditingProject] = useState(false);
  const [projectForm, setProjectForm] = useState({ title: '', description: '' });

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedToId: '', dueDate: '' });
  const [taskLoading, setTaskLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?projectId=${id}`),
      ]);
      setProject(projectRes.data.data);
      setTasks(tasksRes.data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (isAdmin) {
      api.get('/users').then(({ data }) => setAllUsers(data.data || [])).catch(() => {});
    }
  }, [id]);

  const memberIds = (project?.members || []).map(m => m.id);
  const nonMembers = allUsers.filter(u => !memberIds.includes(u.id));

  const projectTasks = tasks.filter(t => String(t.projectId) === String(id));
  const tasksByStatus = {
    'todo': projectTasks.filter(t => t.status === 'todo'),
    'in-progress': projectTasks.filter(t => t.status === 'in-progress'),
    'done': projectTasks.filter(t => t.status === 'done'),
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.put(`/projects/${id}`, {
        title: projectForm.title.trim(),
        description: projectForm.description.trim(),
      });
      setEditingProject(false);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to update project');
    }
  };

  const handleAddMember = async (userId) => {
    try {
      await api.post(`/projects/${id}/members`, { userId });
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to remove member');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError('');
    setTaskLoading(true);
    try {
      const payload = {
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        projectId: Number(id),
      };
      if (taskForm.assignedToId) payload.assignedToId = Number(taskForm.assignedToId);
      if (taskForm.dueDate) payload.dueDate = taskForm.dueDate;
      await api.post('/tasks', payload);
      setTaskForm({ title: '', description: '', assignedToId: '', dueDate: '' });
      setShowTaskForm(false);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to create task');
    } finally {
      setTaskLoading(false);
    }
  };

  const handleStatusUpdate = async (taskId, status) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status });
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to delete task');
    }
  };

  const canManageTask = (task) => isAdmin || task.createdById === user?.id || task.assignedToId === user?.id;

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-10 text-center text-slate-500">Loading project...</div>;
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 text-center">
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <p className="text-lg font-medium text-slate-700">Project not found</p>
          <button onClick={() => navigate('/projects')} className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700">Back to projects</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <button onClick={() => navigate('/projects')} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Projects
      </button>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        {editingProject ? (
          <form onSubmit={handleSaveProject} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Project title</span>
              <input type="text" className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" value={projectForm.title} onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} required />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Description</span>
              <textarea className="min-h-24 w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} />
            </label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setEditingProject(false)} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">Cancel</button>
              <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Save</button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Project Workspace</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">{project.title}</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">{project.description || 'No description provided.'}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">Owner: {project.creator?.name || 'Unknown'}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">{project.members?.length || 0} member{(project.members?.length || 0) !== 1 ? 's' : ''}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium">{projectTasks.length} task{projectTasks.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            {isAdmin && (
              <button onClick={() => { setProjectForm({ title: project.title, description: project.description || '' }); setEditingProject(true); }} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Edit Project
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="xl:col-span-3">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Task Board</h2>
              <p className="mt-1 text-sm text-slate-500">Move work through the project lifecycle.</p>
            </div>
            {isAdmin && (
              <button onClick={() => setShowTaskForm(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                + Add Task
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {columnConfig.map(({ key, label, tone }) => (
              <div key={key} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <div className="mb-4 flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${statusMap[key].dot}`} />
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${tone}`}>{label}</span>
                  <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{tasksByStatus[key].length}</span>
                </div>
                <div className="space-y-3 min-h-40">
                  {tasksByStatus[key].length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-medium text-slate-400">No tasks</div>
                  ) : (
                    tasksByStatus[key].map(task => (
                      <div key={task.id} className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold leading-5 text-slate-900">{task.title}</h3>
                            {task.description && <p className="mt-1 text-xs leading-5 text-slate-500 line-clamp-2">{task.description}</p>}
                          </div>
                          {isAdmin && (
                            <button onClick={() => handleDeleteTask(task.id)} className="rounded-lg p-1.5 text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100" aria-label="Delete task">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {canManageTask(task) ? (
                            <select value={task.status} onChange={(e) => handleStatusUpdate(task.id, e.target.value)}
                              className="rounded-full px-3 py-1 text-xs font-semibold ring-1 cursor-pointer hover:opacity-80 transition-opacity"
                              style={{
                                backgroundColor: task.status === 'done' ? '#f0fdf4' : task.status === 'in-progress' ? '#eff6ff' : '#fefce8',
                                color: task.status === 'done' ? '#166534' : task.status === 'in-progress' ? '#1d4ed8' : '#a16207',
                                borderColor: task.status === 'done' ? '#bbf7d0' : task.status === 'in-progress' ? '#bfdbfe' : '#fef08a',
                              }}>
                              <option value="todo">To Do</option>
                              <option value="in-progress">In Progress</option>
                              <option value="done">Done</option>
                            </select>
                          ) : (
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusColor(task.status)}`}>{getStatusLabel(task.status)}</span>
                          )}
                          {task.dueDate && new Date(task.dueDate) < new Date(new Date().toDateString()) && task.status !== 'done' && (
                            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">Overdue</span>
                          )}
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                          <span>{task.assignedTo?.name || 'Unassigned'}</span>
                          {task.dueDate && <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 h-fit">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">Members</h2>
            <p className="mt-1 text-sm text-slate-500">{project.members?.length || 0} people assigned.</p>
          </div>
          <div className="space-y-3">
            {(project.members || []).map(member => (
              <div key={member.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    {member.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{member.name}</p>
                    <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{member.role}</span>
                  </div>
                </div>
                {isAdmin && project.createdById !== member.id && (
                  <button onClick={() => handleRemoveMember(member.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Remove member">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          {isAdmin && nonMembers.length > 0 && (
            <div className="mt-5 border-t border-slate-100 pt-5">
              <label className="mb-1 block text-sm font-medium text-slate-700">Add Member</label>
              <select className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                onChange={(e) => { if (e.target.value) handleAddMember(Number(e.target.value)); e.target.value = ''; }}
                defaultValue="">
                <option value="" disabled>Select user</option>
                {nonMembers.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
          )}
        </aside>
      </div>

      {showTaskForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">New Task</h2>
              <button onClick={() => setShowTaskForm(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Task title</span>
                <input type="text" className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Assignee</span>
                <select className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" value={taskForm.assignedToId} onChange={(e) => setTaskForm({ ...taskForm, assignedToId: e.target.value })}>
                  <option value="">Unassigned</option>
                  {(project.members || []).map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Due date</span>
                <input type="date" className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Description</span>
                <textarea className="min-h-20 w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
              </label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowTaskForm(false)} className="flex-1 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">Cancel</button>
                <button type="submit" disabled={taskLoading} className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                  {taskLoading ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
