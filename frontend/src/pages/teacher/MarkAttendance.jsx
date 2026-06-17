import React, { useState, useEffect } from 'react';
import Spinner from '../../components/shared/Spinner';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['Present', 'Absent', 'Late', 'Excused'];
const STATUS_COLORS = { Present: 'bg-green-100 text-green-700 border-green-300', Absent: 'bg-red-100 text-red-700 border-red-300', Late: 'bg-yellow-100 text-yellow-700 border-yellow-300', Excused: 'bg-blue-100 text-blue-700 border-blue-300', 'Not Marked': 'bg-slate-100 text-slate-500 border-slate-300' };

export default function MarkAttendance() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get('/students/classes').then((r) => setClasses(r.data.data)).catch(() => {});
  }, []);

  const uniqueClasses = [...new Set(classes.map((c) => c.class))].sort();
  const sectionsForClass = classes.filter((c) => c.class === selectedClass).map((c) => c.section);

  const loadStudents = async () => {
    if (!selectedClass || !selectedSection) return toast.error('Select class and section');
    setLoading(true);
    setLoaded(false);
    try {
      const res = await api.get('/attendance/today', { params: { class: selectedClass, section: selectedSection } });
      const list = res.data.data.map((d) => ({
        student: d.student,
        status: d.attendance ? d.attendance.status : 'Present',
        remarks: d.attendance ? d.attendance.remarks : '',
      }));
      setAttendanceList(list);
      setLoaded(true);
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  };

  const updateStatus = (idx, status) => {
    setAttendanceList((prev) => prev.map((item, i) => i === idx ? { ...item, status } : item));
  };

  const markAll = (status) => {
    setAttendanceList((prev) => prev.map((item) => ({ ...item, status })));
  };

  const handleSubmit = async () => {
    if (attendanceList.length === 0) return;
    setSaving(true);
    try {
      await api.post('/attendance/mark', {
        date,
        class: selectedClass,
        section: selectedSection,
        attendance: attendanceList.map((a) => ({
          studentId: a.student._id,
          status: a.status,
          remarks: a.remarks,
        })),
      });
      toast.success(`Attendance saved for ${attendanceList.length} students!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save attendance');
    } finally { setSaving(false); }
  };

  const present = attendanceList.filter((a) => a.status === 'Present').length;
  const absent = attendanceList.filter((a) => a.status === 'Absent').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Mark Attendance</h1>
        <p className="text-slate-500 text-sm mt-1">Record daily student attendance</p>
      </div>

      {/* Controls */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-slate-700">Select Class</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <select className="input-field" value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(''); setLoaded(false); }}>
            <option value="">Select Class</option>
            {uniqueClasses.map((c) => <option key={c} value={c}>Class {c}</option>)}
          </select>
          <select className="input-field" value={selectedSection} onChange={(e) => { setSelectedSection(e.target.value); setLoaded(false); }}>
            <option value="">Select Section</option>
            {sectionsForClass.map((s) => <option key={s} value={s}>Section {s}</option>)}
          </select>
          <input type="date" className="input-field" value={date} max={new Date().toISOString().split('T')[0]} onChange={(e) => { setDate(e.target.value); setLoaded(false); }} />
          <button onClick={loadStudents} disabled={loading} className="btn-primary text-sm">
            {loading ? 'Loading...' : 'Load Students'}
          </button>
        </div>
      </div>

      {/* Attendance sheet */}
      {loaded && (
        <div className="space-y-4">
          {/* Summary bar */}
          <div className="card py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-sm">
              <span className="font-medium text-slate-600">Class {selectedClass}-{selectedSection}</span>
              <span className="text-green-600 font-semibold">✅ {present} Present</span>
              <span className="text-red-600 font-semibold">❌ {absent} Absent</span>
              <span className="text-slate-400">{attendanceList.length} Total</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => markAll('Present')} className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium transition-colors">All Present</button>
              <button onClick={() => markAll('Absent')} className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition-colors">All Absent</button>
            </div>
          </div>

          {/* Student list */}
          <div className="card p-0 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {attendanceList.map((item, idx) => (
                <div key={item.student._id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {item.student.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.student.name}</p>
                    <p className="text-xs text-slate-400">{item.student.rollNumber}</p>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(idx, s)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                          item.status === s ? STATUS_COLORS[s] + ' ring-2 ring-offset-1 ring-current' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <button onClick={handleSubmit} disabled={saving} className="btn-primary px-8 py-2.5">
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Saving...
                </span>
              ) : `Save Attendance (${attendanceList.length} students)`}
            </button>
          </div>
        </div>
      )}

      {!loaded && !loading && (
        <div className="card text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium">Select a class and click "Load Students" to begin</p>
        </div>
      )}
    </div>
  );
}