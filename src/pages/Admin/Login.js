import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, checkSession } from '../../services/auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    checkSession().then((user) => {
      if (isMounted && user) {
        navigate('/admin/dashboard');
      }
    });
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);
    if (res.success) {
      navigate('/admin/dashboard');
    } else {
      setError(res.message || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-bg p-4 font-mono">
      <div className="bg-cyber-dark border border-cyber-border p-8 w-full max-w-md rounded shadow-2xl">
        <h2 className="text-center mb-8 text-cyan-electric font-bold text-xl tracking-wider">ROOT ACCESS</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          {error && <p className="text-rose-500 text-sm text-center font-mono">{error}</p>}
          <div>
            <label className="block mb-2 text-slate-400 text-sm font-mono">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full p-2.5 bg-white/5 border border-cyber-border text-slate-100 font-mono rounded focus:outline-none focus:border-cyan-electric transition-colors"
            />
          </div>
          <div>
            <label className="block mb-2 text-slate-400 text-sm font-mono">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full p-2.5 bg-white/5 border border-cyber-border text-slate-100 font-mono rounded focus:outline-none focus:border-cyan-electric transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full p-2.5 bg-cyan-electric text-cyber-dark font-bold rounded cursor-pointer hover:opacity-90 transition-opacity font-mono tracking-wider disabled:opacity-50"
          >
            {submitting ? 'LOGGING IN...' : 'LOGIN'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
