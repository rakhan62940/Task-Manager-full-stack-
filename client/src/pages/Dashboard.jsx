import { useState, useEffect } from 'react';
import api from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  if (!stats) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500">Total Tasks</h3>
          <p className="text-3xl font-bold">{stats.totalTasks}</p>
        </div>
        <div className="bg-yellow-100 p-6 rounded-lg shadow">
          <h3 className="text-gray-500">Todo</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.todoTasks}</p>
        </div>
        <div className="bg-blue-100 p-6 rounded-lg shadow">
          <h3 className="text-gray-500">In Progress</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.inProgressTasks}</p>
        </div>
        <div className="bg-green-100 p-6 rounded-lg shadow">
          <h3 className="text-gray-500">Done</h3>
          <p className="text-3xl font-bold text-green-600">{stats.doneTasks}</p>
        </div>
        <div className="bg-red-100 p-6 rounded-lg shadow">
          <h3 className="text-gray-500">Overdue</h3>
          <p className="text-3xl font-bold text-red-600">{stats.overdueTasks}</p>
        </div>
        <div className="bg-purple-100 p-6 rounded-lg shadow">
          <h3 className="text-gray-500">Projects</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.totalProjects}</p>
        </div>
        <div className="bg-indigo-100 p-6 rounded-lg shadow">
          <h3 className="text-gray-500">Users</h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.totalUsers}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;