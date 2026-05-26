import React, {  useContext  } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-slate-600">Loading your workspace...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
