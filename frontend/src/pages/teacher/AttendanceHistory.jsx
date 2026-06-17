import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import Spinner from '../../components/shared/Spinner';
import toast from 'react-hot-toast';

const groupByDate = (records) =>
  records.reduce((acc, record) => {
    const dateKey = new Date(record.date).toLocaleDateString('en-IN');
    acc[dateKey] = acc[dateKey] || [];
    acc[dateKey].push(record);
    return acc;
  }, {});

export default function AttendanceHistory() {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const classes = useMemo(() => user?.assignedClasses || [], [user]);
  const uniqueClasses = useMemo(
    () => [...new Map(classes.map((item) => [`${item.class}-${item.section}`, item])).values()],
    [classes]
  );
  const sectionsForClass = uniqueClasses
    .filter((item) => item.class === selectedClass)
    .map((item) => item.section);

  useEffect(() => {
    if (!selectedClass && classes.length > 0) {
      setSelectedClass(classes[0].class);
      setSelectedSection(classes[0].section);
    }
  }, [classes, selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      fetchHistory();
    }
  }, [selectedClass, selectedSection]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedClass && selectedSection) {
        fetchHistory(true);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedClass, selectedSection]);

  const fetchHistory = async (silent = false) => {
    if (!selectedClass || !selectedSection) return;
    if (!silent) setLoading(true);
    setRefreshing(silent);
    try {
      const res = await api.get('/attendance', {
        params: { class: selectedClass, section: selectedSection },
      });
      setRecords(res.data.data || []);
    } catch (err) {
      toast.error('Unable to load attendance history');
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  };

  const groupedRecords = useMemo(() => groupByDate(records), [records]);

  if (!user?.assignedClasses?.length) {
    return (
      <div className="card p-6 text-center text-slate-600">
        <h1 className="text-xl font-semibold mb-2">Attendance History</h1>
        <p>No class assignments found for your account.</p>
      </div>
    );
  }

  if (loading) {
    return <Spinner text="Loading attendance history..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Attendance History</h1>
        <p className="text-slate-500 text-sm mt-1">Auto-refreshes every 10 seconds for your selected class.</p>
      </div>

      <div className="card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            className="input-field"
            value={selectedClass}
            onChange={(e) => {
              setSelectedClass(e.target.value);
              setSelectedSection('');
            }}
          >
            <option value="">Select class</option>
            {Array.from(new Set(uniqueClasses.map((item) => item.class))).map((c) => (
              <option key={c} value={c}>Class {c}</option>
            ))}
          </select>

          <select
            className="input-field"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            disabled={!selectedClass}
          >
            <option value="">Select section</option>
            {sectionsForClass.map((section) => (
              <option key={section} value={section}>Section {section}</option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Last refresh:</span>
            <span className="font-medium text-slate-700">{refreshing ? 'Refreshing…' : 'Live'}</span>
          </div>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">
          <p className="text-3xl mb-3">📄</p>
          <p className="font-medium">No attendance records found for this class and section yet.</p>
        </div>
      ) : (
        Object.keys(groupedRecords).map((date) => (
          <div key={date} className="card">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">{date}</h2>
                <p className="text-sm text-slate-500">{records.filter((record) => new Date(record.date).toLocaleDateString('en-IN') === date).length} records</p>
              </div>
              <span className="text-sm text-slate-500">Class {selectedClass}-{selectedSection}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-slate-500 uppercase">Roll</th>
                    <th className="px-4 py-3 text-left text-slate-500 uppercase">Student</th>
                    <th className="px-4 py-3 text-left text-slate-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-slate-500 uppercase">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groupedRecords[date].map((record) => (
                    <tr key={record._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">{record.studentId?.rollNumber || 'N/A'}</td>
                      <td className="px-4 py-3">{record.studentId?.name || 'Unknown'}</td>
                      <td className="px-4 py-3 text-slate-700">{record.status}</td>
                      <td className="px-4 py-3 text-slate-500">{record.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
