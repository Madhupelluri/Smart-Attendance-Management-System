import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Link } from 'react-router-dom';
import StatCard from '../../components/shared/StatCard';
import Spinner from '../../components/shared/Spinner';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#f87171', '#fbbf24'];

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [todayData, setTodayData] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/students/classes').then((r) => {
      setClasses(r.data.data);
      if (r.data.data.length > 0) {
        setSelectedClass(r.data.data[0].class);
        setSelectedSection(r.data.data[0].section);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSection) fetchTodayData();
  }, [selectedClass, selectedSection]);

  const fetchTodayData = async () => {
    try {
      const res = await api.get('/attendance/today', { params: { class: selectedClass, section: selectedSection } });
      setTodayData(res.data);
    } catch { toast.error('Failed to load today\'s data'); }
  };

  const uniqueClasses = [...new Set(classes.map((c) => c.class))].sort();
  const sectionsForClass = classes.filter((c) => c.class === selectedClass).map((c) => c.section);

  const present = todayData?.data?.filter((d) => d.status === 'Present').length || 0;
  const absent = todayData?.data?.filter((d) => d.status === 'Absent').length || 0;
  const notMarked = todayData?.data?.filter((d) => d.status === 'Not Marked').length || 0;
  const total = todayData?.count || 0;

  const pieData = [
    { name: 'Present', value: present },
    { name: 'Absent', value: absent },
    { name: 'Not Marked', value: notMarked },
  ].filter((d) => d.value > 0);

  if (loading) return <Spinner text="Loading..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Welcome, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-slate-500 text-sm mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Class selector */}
      <div className="card flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-slate-600">Viewing:</span>
        <select className="input-field w-32" value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(''); }}>
          {uniqueClasses.map((c) => <option key={c} value={c}>Class {c}</option>)}
        </select>
        <select className="input-field w-32" value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
          {sectionsForClass.map((s) => <option key={s} value={s}>Section {s}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={total} icon="🎓" color="primary" />
        <StatCard title="Present Today" value={present} icon="✅" color="green" />
        <StatCard title="Absent Today" value={absent} icon="❌" color="red" />
        <StatCard title="Not Marked" value={notMarked} icon="⏳" color="yellow" />
      </div>

      {/* Charts + actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie chart */}
        <div className="card">
          <h2 className="text-base font-semibold text-slate-700 mb-4">Today's Breakdown</h2>
          {total === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">No students in this class</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={index} fill={COLORS[index]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick actions */}
        <div className="card lg:col-span-2 space-y-3">
          <h2 className="text-base font-semibold text-slate-700">Quick Actions</h2>
          <Link to="/teacher/attendance" className="flex items-center gap-4 p-4 border border-primary-200 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center text-2xl text-white">✅</div>
            <div>
              <p className="font-semibold text-primary-800">Mark Attendance</p>
              <p className="text-sm text-primary-600">Record today's student attendance</p>
            </div>
            <span className="ml-auto text-primary-400 group-hover:translate-x-1 transition-transform">→</span>
          </Link>
          <Link to="/teacher/history" className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-slate-600 flex items-center justify-center text-2xl text-white">📅</div>
            <div>
              <p className="font-semibold text-slate-700">View History</p>
              <p className="text-sm text-slate-500">Browse past attendance records</p>
            </div>
            <span className="ml-auto text-slate-300 group-hover:translate-x-1 transition-transform">→</span>
          </Link>
          <Link to="/teacher/reports" className="flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-2xl text-white">📋</div>
            <div>
              <p className="font-semibold text-slate-700">Generate Report</p>
              <p className="text-sm text-slate-500">View detailed attendance analytics</p>
            </div>
            <span className="ml-auto text-slate-300 group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </div>

      {/* Today's partial list */}
      {todayData?.data?.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-semibold text-slate-700">Today's Attendance – Class {selectedClass}-{selectedSection}</h2>
            <Link to="/teacher/attendance" className="text-sm text-primary-600 hover:text-primary-700 font-medium">Mark Now →</Link>
          </div>
          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  {['Roll No.', 'Name', 'Status'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todayData.data.slice(0, 10).map((d) => (
                  <tr key={d.student._id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5"><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{d.student.rollNumber}</span></td>
                    <td className="px-4 py-2.5 text-slate-700">{d.student.name}</td>
                    <td className="px-4 py-2.5">
                      <span className={d.status === 'Present' ? 'badge-present' : d.status === 'Absent' ? 'badge-absent' : 'badge-late'}>{d.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}