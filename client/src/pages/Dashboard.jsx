import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const statusBadge = (status) => {
  if (status === 'done') return <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 ring-1 ring-green-200">Done</span>;
  if (status === 'in-progress') return <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">In Progress</span>;
  return <span className="rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-semibold text-yellow-700 ring-1 ring-yellow-200">To Do</span>;
};

const cards = [
  { key: 'totalTasks', label: 'Total Tasks', tone: 'bg-white text-slate-900' },
  { key: 'todoTasks', label: 'Todo', tone: 'bg-yellow-50 text-yellow-700' },
  { key: 'inProgressTasks', label: 'In Progress', tone: 'bg-blue-50 text-blue-700' },
  { key: 'doneTasks', label: 'Done', tone: 'bg-green-50 text-green-700' },
  { key: 'overdueTasks', label: 'Overdue', tone: 'bg-red-50 text-red-700' },
  { key: 'totalProjects', label: 'Projects', tone: 'bg-purple-50 text-purple-700' },
  { key: 'totalUsers', label: 'Users', tone: 'bg-indigo-50 text-indigo-700' },
];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard');
        setStats(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const dashboardStats = stats || {
    totalTasks: 0, todoTasks: 0, inProgressTasks: 0, doneTasks: 0, overdueTasks: 0, totalProjects: 0, totalUsers: 0, tasks: [],
  };

  const overdueTasks = stats?.tasks?.filter(t => t.isOverdue) || [];
  const recentTasks = stats?.tasks?.slice(0, 8) || [];

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-10 text-center text-slate-500 sm:px-6 lg:px-8">Loading dashboard...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Workspace overview</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-slate-500">Monitor workload, overdue items, and team activity from one workspace.</p>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(card => (
          <div key={card.key} className={`rounded-2xl p-6 shadow-sm ring-1 ring-slate-200 ${card.tone}`}>
            <h3 className="text-sm font-medium text-slate-500">{card.label}</h3>
            <p className="mt-3 text-4xl font-bold">{dashboardStats[card.key]}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent Tasks</h2>
              <p className="mt-1 text-sm text-slate-500">Latest work across your accessible projects.</p>
            </div>
            <Link to="/tasks" className="text-sm font-semibold text-blue-600 hover:text-blue-700">View all</Link>
          </div>
          {recentTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
              <p className="font-semibold text-slate-700">No tasks yet</p>
              <p className="mt-1 text-sm text-slate-500">Create tasks from a project to start tracking progress.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentTasks.map(task => (
                <div key={task.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{task.title}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">{task.project?.title || 'No project'}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {task.isOverdue && <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-200">Overdue</span>}
                    {statusBadge(task.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-red-50/40 p-6 shadow-sm ring-1 ring-red-100">
          <div className="mb-5 flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Overdue Tasks</h2>
              <p className="mt-1 text-sm text-slate-500">Items needing quick attention.</p>
            </div>
          </div>
          {overdueTasks.length === 0 ? (
            <div className="rounded-2xl border border-red-100 bg-white px-5 py-8 text-center">
              <p className="font-semibold text-slate-700">No overdue tasks</p>
              <p className="mt-1 text-sm text-slate-500">Your board is currently on schedule.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {overdueTasks.map(task => (
                <div key={task.id} className="rounded-2xl border border-red-100 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                  <p className="mt-2 text-xs font-semibold text-red-600">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                  {task.assignedTo && <p className="mt-1 text-xs text-slate-500">Assigned to {task.assignedTo.name}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
