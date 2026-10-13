import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { checkSession, logout } from '../../services/auth';
import Dashboard from './Dashboard';

const AdminLayout = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const verify = async () => {
      const user = await checkSession();
      if (!isMounted) return;
      if (!user) {
        setIsAuthenticated(false);
        navigate('/admin/login');
      } else {
        setIsAuthenticated(true);
      }
    };
    verify();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cyber-bg">
        <div className="text-slate-400 font-mono text-sm">
          Verifying session...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-cyber-bg text-slate-100 font-sans">
      <aside className="w-64 bg-cyber-dark border-r border-cyber-border p-8 flex flex-col shrink-0">
        <h3 className="mb-8 text-cyan-electric font-mono font-bold text-lg tracking-wider">Admin Panel</h3>
        <nav className="flex flex-col space-y-1">
          <Link
            to="/admin/dashboard"
            className="text-slate-400 hover:text-cyan-electric hover:bg-white/5 p-2.5 rounded font-mono text-sm transition-colors block"
          >
            Dashboard
          </Link>
          <Link
            to="/"
            className="text-slate-400 hover:text-cyan-electric hover:bg-white/5 p-2.5 rounded font-mono text-sm transition-colors block"
          >
            View Site
          </Link>
        </nav>
        <button
          onClick={handleLogout}
          className="mt-auto bg-transparent text-rose-400 border border-rose-500/50 hover:bg-rose-500 hover:text-white p-2.5 rounded font-mono text-sm transition-all cursor-pointer text-center"
        >
          Logout
        </button>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        <Routes>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="*" element={<div className="font-mono text-slate-400">select an option</div>} />
        </Routes>
      </main>
      <ToastContainer position="bottom-right" theme="dark" />
    </div>
  );
};

export default AdminLayout;
