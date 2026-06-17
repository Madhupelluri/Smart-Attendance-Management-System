import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import Spinner from '../../components/shared/Spinner';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#f87171', '#fbbf24', '#34d399'];

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState('class');
  const [classes, setClasses] = useState([]);
  const [classReport, setClassReport] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [lowAttReport, setLowAttReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const [filters, setFilters] = useState({
    class: '',
    section: '',
    startDate: new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0],
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    threshold: 75,
  });

  useEffect(() => {
    api.get('/students/classes').then((r) => setClasses(r.data.data)).catch(() => {});
  }, []);

  const fetchClassReport = async () => {
    if (!filters.class || !filters.section) return toast.error('Select class and section');
    setLoading(true);
    try {
      const res = await api.get('/reports/class', { params: { class: filters.class, section: filters.section, startDate: filters.startDate, endDate: filters.endDate } });
      setClassReport(res.data.data);
    } catch { toast.error('Failed to load report'); }
    finally { setLoading(false); }
  };

  const fetchMonthlyReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/monthly', { params: { year: filters.year, month: filters.month } });
      setMonthlyReport(res.data.data);
    } catch { toast.error('Failed to load report'); }
    finally { setLoading(false); }
  };

  const fetchLowAttReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/low-attendance', { params: { threshold: filters.threshold, days: 30 } });
      setLowAttReport(res.data);
    } catch { toast.error('Failed to load report'); }
    finally { setLoading(false); }
  };

  const uniqueClasses = [...new Set(classes.map((c) => c.class))].sort();
  const sectionsForClass = classes.filter((c) => c.class === filters.class).map((c) => c.section);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Attendance Reports</h1>
        <p className="text-slate-500 text-sm mt-1">Generate and analyze school attendance data</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {[['class', '📋 Class Report'], ['monthly', '📅 Monthly Summary'], ['low', '⚠️ Low Attendance']].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === key ? 'bg-white shadow-sm text-primary-700' : 'text-slate-600 hover:text-slate-800'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Class Report */}
      {activeTab === 'class' && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <h2 className="font-semibold text-slate-700">Class-wise Attendance Report</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <select className="input-field" value={filters.class} onChange={(e) => setFilters({ ...filters, class: e.target.value, section: '' })}>
                <option value="">Select Class</option>
                {uniqueClasses.map((c) => <option key={c} value={c}>Class {c}</option>)}
              </select>
              <select className="input-field" value={filters.section} onChange={(e) => setFilters({ ...filters, section: e.target.value })}>
                <option value="">Select Section</option>
                {sectionsForClass.map((s) => <option key={s} value={s}>Section {s}</option>)}
              </select>
              <input type="date" className="input-field" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
              <input type="date" className="input-field" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
            </div>
            <button onClick={fetchClassReport} disabled={loading} className="btn-primary text-sm">
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>

          {classReport && (
            <div className="card p-0 overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4">
                <div><p className="text-xs text-slate-500">Class</p><p className="font-semibold">{classReport.class}-{classReport.section}</p></div>
                <div><p className="text-xs text-slate-500">Working Days</p><p className="font-semibold">{classReport.workingDays}</p></div>
                <div><p className="text-xs text-slate-500">Total Students</p><p className="font-semibold">{classReport.totalStudents}</p></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>{['Roll No.', 'Name', 'Present', 'Absent', 'Late', 'Attendance %'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classReport.report.map((r) => (
                      <tr key={r.student.id} className={`hover:bg-slate-50 ${parseFloat(r.rate) < 75 ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-2.5"><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{r.student.rollNumber}</span></td>
                        <td className="px-4 py-2.5 font-medium text-slate-800">{r.student.name}</td>
                        <td className="px-4 py-2.5 text-green-600 font-medium">{r.present}</td>
                        <td className="px-4 py-2.5 text-red-600 font-medium">{r.absent}</td>
                        <td className="px-4 py-2.5 text-yellow-600 font-medium">{r.late}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full ${parseFloat(r.rate) >= 75 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(r.rate, 100)}%` }} />
                            </div>
                            <span className={`font-semibold text-xs ${parseFloat(r.rate) < 75 ? 'text-red-600' : 'text-green-600'}`}>{r.rate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Monthly Report */}
      {activeTab === 'monthly' && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <h2 className="font-semibold text-slate-700">Monthly Attendance Summary</h2>
            <div className="flex gap-3">
              <input type="number" className="input-field w-28" value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })} min="2020" max="2030" />
              <select className="input-field w-40" value={filters.month} onChange={(e) => setFilters({ ...filters, month: e.target.value })}>
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
              <button onClick={fetchMonthlyReport} disabled={loading} className="btn-primary text-sm">{loading ? 'Loading...' : 'Generate'}</button>
            </div>
          </div>

          {monthlyReport && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-0 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>{['Class', 'Present', 'Absent', 'Rate'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthlyReport.summary.map((s, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-medium">{s.class}-{s.section}</td>
                        <td className="px-4 py-2.5 text-green-600">{s.present}</td>
                        <td className="px-4 py-2.5 text-red-600">{s.absent}</td>
                        <td className="px-4 py-2.5 font-semibold">{s.rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Class-wise Present vs Absent</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyReport.summary.map((s) => ({ name: `${s.class}-${s.section}`, Present: s.present, Absent: s.absent }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="Present" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Absent" fill="#f87171" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Low Attendance */}
      {activeTab === 'low' && (
        <div className="space-y-4">
          <div className="card flex items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Threshold (%)</label>
              <input type="number" className="input-field w-28" value={filters.threshold} onChange={(e) => setFilters({ ...filters, threshold: e.target.value })} min="0" max="100" />
            </div>
            <button onClick={fetchLowAttReport} disabled={loading} className="btn-primary text-sm mb-0.5">{loading ? 'Loading...' : 'Find At-Risk Students'}</button>
          </div>

          {lowAttReport && (
            <div className="card p-0 overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <p className="text-sm text-slate-600">Found <strong className="text-red-600">{lowAttReport.count} students</strong> below {lowAttReport.threshold}% attendance in the last 30 days</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-red-50">
                    <tr>{['Roll No.', 'Name', 'Class', 'Present', 'Absent', 'Attendance %'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lowAttReport.data.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-8 text-slate-400">✅ No students below threshold!</td></tr>
                    )}
                    {lowAttReport.data.map((r, i) => (
                      <tr key={i} className="hover:bg-red-50">
                        <td className="px-4 py-2.5"><span className="font-mono text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">{r.student.rollNumber}</span></td>
                        <td className="px-4 py-2.5 font-medium text-red-700">{r.student.name}</td>
                        <td className="px-4 py-2.5">{r.student.class}-{r.student.section}</td>
                        <td className="px-4 py-2.5 text-green-600">{r.present}</td>
                        <td className="px-4 py-2.5 text-red-600">{r.absent}</td>
                        <td className="px-4 py-2.5"><span className="font-bold text-red-600">{r.rate}%</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}