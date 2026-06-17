import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import StatCard from '../../components/shared/StatCard';
import Spinner from '../../components/shared/Spinner';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setStats(res.data.data);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner text="Loading dashboard..." />;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Overview of school attendance today</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Teachers" value={stats?.totalTeachers || 0} icon="👨‍🏫" color="primary" subtitle="Active teaching staff" />
        <StatCard title="Total Students" value={stats?.totalStudents || 0} icon="🎓" color="blue" subtitle="Enrolled students" />
        <StatCard title="Present Today" value={stats?.todayPresent || 0} icon="✅" color="green" subtitle={`of ${stats?.todayTotal || 0} marked`} />
        <StatCard title="Attendance Rate" value={`${stats?.attendanceRate || 0}%`} icon="📊" color="purple" subtitle="Today's overall rate" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly trend chart */}
        <div className="card lg:col-span-2">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Weekly Attendance Trend</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats?.weeklyData || []} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="present" name="Present" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="absent" name="Absent" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Class-wise today */}
        <div className="card">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Today by Class</h2>
          <div className="space-y-3 overflow-y-auto max-h-56">
            {stats?.classWise?.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No attendance marked today</p>
            )}
            {stats?.classWise?.map((c, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">Class {c.class}-{c.section}</p>
                  <p className="text-xs text-slate-400">{c.present}/{c.total} present</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-100 rounded-full h-1.5">
                    <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${c.rate}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 w-10 text-right">{c.rate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SDG Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl p-4 flex items-center gap-4 text-white">
        <div className="text-3xl">🎯</div>
        <div>
          <p className="font-semibold">SDG 4 – Quality Education</p>
          <p className="text-primary-100 text-sm">This system supports inclusive and equitable quality education by ensuring accurate attendance tracking and timely intervention for at-risk students.</p>
        </div>
      </div>
    </div>
  );
}