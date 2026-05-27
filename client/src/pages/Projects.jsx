import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showMemberForm, setShowMemberForm] = useState(null);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberErrors, setMemberErrors] = useState({});
  const { user } = useContext(AuthContext);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setActionLoading(true);
    try {
      await api.post('/projects', {
        title: formData.title.trim(),
        description: formData.description.trim(),
      });
      setFormData({ title: '', description: '' });
      setShowForm(false);
      await fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create project');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project and all its tasks?')) return;
    setError('');
    try {
      await api.delete(`/projects/${id}`);
      await fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete project');
    }
  };

  const handleAddMember = async (projectId) => {
    const email = memberEmail.trim();
    if (!email) return;

    setMemberErrors(prev => ({ ...prev, [projectId]: '' }));
    try {
      const res = await api.get(`/auth/users?email=${encodeURIComponent(email)}`);
      const foundUser = res.data.data;
      await api.post(`/projects/${projectId}/members`, { userId: foundUser.id });
      setMemberEmail('');
      setShowMemberForm(null);
      await fetchProjects();
    } catch (err) {
      setMemberErrors(prev => ({
        ...prev,
        [projectId]: err.response?.data?.message || err.message || 'Failed to add member',
      }));
    }
  };

  const handleRemoveMember = async (projectId, userId) => {
    if (!confirm('Remove this member from the project?')) return;
    try {
      await api.delete(`/projects/${projectId}/members/${userId}`);
      await fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to remove member');
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-10 text-center text-slate-500 sm:px-6 lg:px-8">Loading projects...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Project hub</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Projects</h1>
          <p className="mt-2 text-sm text-slate-500">
            {isAdmin ? 'Create projects and manage members.' : 'View projects where you are a member.'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setShowForm(!showForm); setError(''); }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : '+ New Project'}
          </button>
        )}
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Project title</span>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
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
            {actionLoading ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      )}

      {projects.length === 0 ? (
        <div className="rounded-2xl bg-white px-6 py-12 text-center text-slate-500 shadow-sm ring-1 ring-slate-200">
          <p className="text-lg font-medium text-slate-700">No projects yet.</p>
          <p className="mt-2">{isAdmin ? 'Create a project to start assigning tasks.' : 'Ask an admin to add you to a project.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map(project => (
            <div key={project.id} className="flex flex-col rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex-1">
                <Link to={`/projects/${project.id}`} className="text-xl font-bold text-slate-900 hover:text-blue-600">{project.title}</Link>
                <p className="mt-2 text-sm leading-6 text-slate-600">{project.description || 'No description'}</p>
                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">Created by {project.creator?.name || 'Unknown'}</p>

                <div className="mt-4">
                  <p className="mb-2 text-sm font-semibold text-slate-700">Members</p>
                  <div className="flex flex-wrap gap-2">
                    {project.members?.length ? project.members.map(member => (
                      <span key={member.id} className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                        {member.name}
                        {isAdmin && project.createdById !== member.id && (
                          <button
                            onClick={() => handleRemoveMember(project.id, member.id)}
                            className="text-red-500 hover:text-red-700"
                            aria-label={`Remove ${member.name}`}
                          >
                            &times;
                          </button>
                        )}
                      </span>
                    )) : <span className="text-sm text-slate-400">No members</span>}
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <button
                    onClick={() => setShowMemberForm(showMemberForm === project.id ? null : project.id)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    {showMemberForm === project.id ? 'Cancel' : '+ Add Member'}
                  </button>
                  {showMemberForm === project.id && (
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <input
                        type="email"
                        placeholder="user@email.com"
                        className="flex-1 rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        value={memberEmail}
                        onChange={(e) => setMemberEmail(e.target.value)}
                      />
                      <button onClick={() => handleAddMember(project.id)} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">Add</button>
                    </div>
                  )}
                  {memberErrors[project.id] && <p className="mt-2 text-sm text-red-600">{memberErrors[project.id]}</p>}
                  <button onClick={() => handleDelete(project.id)} className="mt-4 text-sm font-medium text-red-600 hover:text-red-700">Delete Project</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
