import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', formData);
      setFormData({ title: '', description: '' });
      setShowForm(false);
      fetchProjects();
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to create project');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project?')) return;
    try {
      await api.delete(`/projects/${id}`);
      fetchProjects();
    } catch (err) {
      alert('Failed to delete project');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        {user?.role === 'Admin' && (
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            {showForm ? 'Cancel' : '+ New Project'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6">
          <input
            type="text"
            placeholder="Project Title"
            className="w-full p-2 border rounded mb-4"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <textarea
            placeholder="Description"
            className="w-full p-2 border rounded mb-4"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Create Project</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(project => (
          <div key={project._id} className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-bold">{project.title}</h3>
            <p className="text-gray-600 mt-2">{project.description || 'No description'}</p>
            <p className="text-sm text-gray-500 mt-4">Created by: {project.createdBy?.name}</p>
            <p className="text-sm text-gray-500">Members: {project.members?.length}</p>
            {user?.role === 'Admin' && (
              <button onClick={() => handleDelete(project._id)} className="mt-4 text-red-500 hover:underline">Delete</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Projects;