import { useState, useEffect } from 'react';
import api from '../services/api';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', projectId: '', status: 'Todo', dueDate: '' });

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks');
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

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
      await api.post('/tasks', formData);
      setFormData({ title: '', description: '', projectId: '', status: 'Todo', dueDate: '' });
      setShowForm(false);
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to create task');
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await api.put(`/tasks/${id}`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      fetchTasks();
    } catch (err) {
      alert('Failed to delete task');
    }
  };

  const isOverdue = (task) => {
    return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tasks</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          {showForm ? 'Cancel' : '+ New Task'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6">
          <input
            type="text"
            placeholder="Task Title"
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
          <select
            className="w-full p-2 border rounded mb-4"
            value={formData.projectId}
            onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
            required
          >
            <option value="">Select Project</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
          </select>
          <select
            className="w-full p-2 border rounded mb-4"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="Todo">Todo</option>
            <option value="InProgress">In Progress</option>
            <option value="Done">Done</option>
          </select>
          <input
            type="date"
            className="w-full p-2 border rounded mb-4"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          />
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Create Task</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map(task => (
          <div key={task._id} className={`bg-white p-6 rounded-lg shadow ${isOverdue(task) ? 'border-2 border-red-500' : ''}`}>
            <h3 className="text-xl font-bold">{task.title}</h3>
            <p className="text-gray-600 mt-2">{task.description || 'No description'}</p>
            <p className="text-sm text-gray-500 mt-2">Project: {task.projectId?.title || 'N/A'}</p>
            {task.assignedTo && <p className="text-sm text-gray-500">Assigned: {task.assignedTo.name}</p>}
            {task.dueDate && <p className="text-sm text-gray-500">Due: {new Date(task.dueDate).toLocaleDateString()}</p>}
            {isOverdue(task) && <p className="text-red-500 font-bold mt-2">OVERDUE</p>}
            <div className="mt-4">
              <select
                value={task.status}
                onChange={(e) => handleStatusUpdate(task._id, e.target.value)}
                className="p-2 border rounded"
              >
                <option value="Todo">Todo</option>
                <option value="InProgress">In Progress</option>
                <option value="Done">Done</option>
              </select>
            </div>
            <button onClick={() => handleDelete(task._id)} className="mt-4 text-red-500 hover:underline">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tasks;