import React, { useContext } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-white text-blue-700 shadow-sm' : 'text-blue-50 hover:bg-blue-500 hover:text-white'}`;

  return (
    <nav className="bg-blue-600 text-white shadow-lg shadow-blue-900/10">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="text-xl font-bold tracking-tight">Team Task Manager</Link>
          {user ? (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-blue-500 px-3 py-1 text-blue-50">
                {user.name} ({user.role})
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-white px-3 py-2 font-medium text-blue-700 transition hover:bg-blue-50"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <NavLink to="/login" className={linkClass}>Login</NavLink>
              <NavLink to="/signup" className={linkClass}>Signup</NavLink>
            </div>
          )}
        </div>

        {user && (
          <div className="flex flex-wrap gap-2">
            <NavLink to="/" className={linkClass} end>Dashboard</NavLink>
            <NavLink to="/projects" className={linkClass}>Projects</NavLink>
            <NavLink to="/tasks" className={linkClass}>Tasks</NavLink>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
