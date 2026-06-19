import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import Spinner from '../../components/shared/Spinner';
import toast from 'react-hot-toast';

export default function TeacherReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const assignedClasses = useMemo(() => user?.assignedClasses || [], [user]);

  useEffect(() => {
    if (!user) return;
    fetchReports();
    const interval = setInterval(fetchReports, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchReports = async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const fetchedReports = [];
      for (const assigned of assignedClasses) {
        const res = await api.get('/reports/class', {
          params: { class: assigned.class, section: assigned.section },
        });
        if (res.data?.success) {
          fetchedReports.push(res.data.data);
        }
      }
      setReports(fetchedReports);
    } catch (err) {
      toast.error('Unable to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (!assignedClasses.length) {
    return (
      <div className="card p-6 text-center text-slate-600">
        <h1 className="text-xl font-semibold mb-2">Teacher Reports</h1>
        <p>No assigned classes available for your account.</p>
      </div>
    );
  }

  if (loading) {
    return <Spinner text="Loading teacher reports..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Teacher Reports</h1>
        <p className="text-slate-500 text-sm mt-1">Live attendance reports for your assigned classes.</p>
      </div>

      <div className="card flex items-center justify-between gap-4 p-4">
        <div>
          <p className="text-sm text-slate-500">Auto-refresh interval</p>
          <p className="text-lg font-semibold">15 seconds</p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700">
          {refreshing ? 'Refreshing…' : 'Live'}
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">
          <p className="text-3xl mb-3">📈</p>
          <p className="font-medium">No report data available yet for your classes.</p>
          <p className="text-sm text-slate-500 mt-2">Try marking attendance first so reports can populate.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((item) => {
            const rates = item.report.map((s) => parseFloat(s.rate)).filter((r) => !isNaN(r));
            const avgRate = rates.length ? `${Math.round(rates.reduce((sum, val) => sum + val, 0) / rates.length)}%` : 'N/A';

            return (
              <div key={`${item.class}-${item.section}`} className="card p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">Class {item.class} - Section {item.section}</h2>
                    <p className="text-sm text-slate-500">Working days: {item.workingDays} · Students: {item.totalStudents}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Last refreshed</p>
                    <p className="text-xl font-semibold text-primary-700">Live</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase text-slate-400">Working days</p>
                    <p className="text-2xl font-semibold text-slate-800">{item.workingDays}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase text-slate-400">Students</p>
                    <p className="text-2xl font-semibold text-slate-800">{item.totalStudents}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase text-slate-400">Attendance rate</p>
                    <p className="text-2xl font-semibold text-primary-700">{avgRate}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase text-slate-400">Average per student</p>
                    <p className="text-2xl font-semibold text-slate-800">{avgRate}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
