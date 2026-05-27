import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const initialFormData = {
  title: '',
  description: '',
  projectId: '',
  assignedToId: '',
  status: 'todo',
  dueDate: '',
};

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/projects'),
      ]);
      setTasks(tasksRes.data.data || []);
      setProjects(projectsRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const selectedProject = projects.find(project => String(project.id) === String(formData.projectId));
  const canManageTask = (task) => user?.role === 'admin' || task.createdById === user?.id || task.assignedToId === user?.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setActionLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        projectId: Number(formData.projectId),
        status: formData.status,
      };
      if (formData.assignedToId) payload.assignedToId = Number(formData.assignedToId);
      if (formData.dueDate) payload.dueDate = formData.dueDate;

      await api.post('/tasks', payload);
      setFormData(initialFormData);
      setShowForm(false);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    setError('');
    try {
      await api.patch(`/tasks/${id}/status`, { status: newStatus });
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    setError('');
    try {
      await api.delete(`/tasks/${id}`);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete task');
    }
  };

  const isOverdue = (task) => {
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < new Date(new Date().toDateString()) && task.status !== 'done';
  };

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

  const filteredTasks = tasks.filter(task => {
    if (filter !== 'all' && task.status !== filter) return false;
    if (projectFilter && String(task.projectId) !== projectFilter) return false;
    return true;
  });

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-10 text-center text-slate-500 sm:px-6 lg:px-8">Loading tasks...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Task board</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Tasks</h1>
          <p className="mt-2 text-sm text-slate-500">Create tasks in your projects and update work assigned to you.</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(''); }}
          disabled={projects.length === 0}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {showForm ? 'Cancel' : '+ New Task'}
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {projects.length === 0 && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You need access to a project before creating tasks.
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Task title</span>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Project</span>
              <select
                className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value, assignedToId: '' })}
                required
              >
                <option value="">Select Project</option>
                {projects.map(project => <option key={project.id} value={project.id}>{project.title}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Assignee</span>
              <select
                className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                value={formData.assignedToId}
                onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                disabled={!selectedProject}
              >
                <option value="">Unassigned</option>
                {selectedProject?.members?.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Status</span>
              <select
                className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="todo">Todo</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Due date</span>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-medium text-slate-700">Description</span>
              <textarea
                className="min-h-24 w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={actionLoading}
            className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {actionLoading ? 'Creating...' : 'Create Task'}
          </button>
        </form>
      )}

      {tasks.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2">
            {['all', 'todo', 'in-progress', 'done'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${filter === status ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}
              >
                {status === 'all' ? 'All' : getStatusLabel(status)}
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Projects</option>
              {projects.map(project => <option key={project.id} value={project.id}>{project.title}</option>)}
            </select>
          </div>
        </div>
      )}

      {filteredTasks.length === 0 ? (
        <div className="rounded-2xl bg-white px-6 py-12 text-center text-slate-500 shadow-sm ring-1 ring-slate-200">
          <p className="text-lg font-medium text-slate-700">No tasks found.</p>
          <p className="mt-2">{projects.length ? 'Create a task or change the status filter.' : 'Join a project before adding tasks.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTasks.map(task => (
            <div key={task.id} className={`rounded-2xl bg-white p-6 shadow-sm ring-1 ${isOverdue(task) ? 'ring-red-300' : 'ring-slate-200'}`}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl font-bold text-slate-900">{task.title}</h3>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusColor(task.status)}`}>
                  {getStatusLabel(task.status)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{task.description || 'No description'}</p>
              <div className="mt-4 space-y-1 text-sm text-slate-500">
                <p><span className="font-medium text-slate-700">Project:</span> {task.project?.title || 'N/A'}</p>
                <p><span className="font-medium text-slate-700">Assignee:</span> {task.assignedTo?.name || 'Unassigned'}</p>
                <p><span className="font-medium text-slate-700">Creator:</span> {task.creator?.name || 'Unknown'}</p>
                {task.dueDate && <p><span className="font-medium text-slate-700">Due:</span> {new Date(task.dueDate).toLocaleDateString()}</p>}
              </div>
              {isOverdue(task) && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">Overdue</p>}

              <div className="mt-5 border-t border-slate-100 pt-4">
                {canManageTask(task) ? (
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusUpdate(task.id, e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tasks;
