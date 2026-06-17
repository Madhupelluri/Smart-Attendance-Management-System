import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [role, setRole] = useState('admin');
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post(`/auth/${role}/login`, form);
      login(res.data.token, res.data.user);
      toast.success(`Welcome, ${res.data.user.name}!`);
      navigate(role === 'admin' ? '/admin' : '/teacher');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    if (role === 'admin') setForm({ email: 'admin@smartschool.edu', password: 'admin123' });
    else setForm({ email: 'priya@smartschool.edu', password: 'teacher123' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-600 rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-600 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 text-3xl mb-4 shadow-lg shadow-primary-900/50">
            🏫
          </div>
          <h1 className="text-3xl font-bold text-white">Smart Attendance</h1>
          <p className="text-slate-400 mt-1 text-sm">School Attendance Management System</p>
          <div className="mt-2 inline-flex items-center gap-1.5 bg-green-900/40 border border-green-800 text-green-400 text-xs px-3 py-1 rounded-full">
            🎯 SDG 4 – Quality Education
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Role tabs */}
          <div className="flex border-b border-slate-200">
            {['admin', 'teacher'].map((r) => (
              <button
                key={r}
                onClick={() => { setRole(r); setForm({ email: '', password: '' }); }}
                className={`flex-1 py-3.5 text-sm font-semibold capitalize transition-colors ${
                  role === r
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {r === 'admin' ? '🔐 Admin' : '👨‍🏫 Teacher'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                className="input-field"
                placeholder="Enter your email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 mt-2 text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in...
                </span>
              ) : `Sign in as ${role === 'admin' ? 'Admin' : 'Teacher'}`}
            </button>

            {/* Demo credentials button */}
            <button
              type="button"
              onClick={fillDemo}
              className="w-full text-center text-xs text-primary-600 hover:text-primary-700 py-1 font-medium"
            >
              → Fill demo credentials
            </button>
          </form>

          {/* Demo info */}
          <div className="px-6 pb-6">
            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-600">Demo Credentials</p>
              <p>Admin: admin@smartschool.edu / admin123</p>
              <p>Teacher: priya@smartschool.edu / teacher123</p>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          Community Service Project · Built with ❤️ for Quality Education
        </p>
      </div>
    </div>
  );
}