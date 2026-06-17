import React, { useState, useEffect } from 'react';
import Modal from '../../components/shared/Modal';
import Spinner from '../../components/shared/Spinner';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const INITIAL_FORM = { rollNumber: '', name: '', class: '', section: '', parentName: '', parentContact: '' };

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      setStudents(res.data.data);
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setEditing(null); setForm(INITIAL_FORM); setModalOpen(true); };
  const openEdit = (s) => {
    setEditing(s);
    setForm({ rollNumber: s.rollNumber, name: s.name, class: s.class, section: s.section, parentName: s.parentName || '', parentContact: s.parentContact || '' });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/students/${editing._id}`, form);
        toast.success('Student updated');
      } else {
        await api.post('/students', form);
        toast.success('Student added');
      }
      setModalOpen(false);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/students/${id}`);
      toast.success('Student deleted');
      setDeleteConfirm(null);
      fetchStudents();
    } catch { toast.error('Delete failed'); }
  };

  // Get unique classes and sections for filters
  const classes = [...new Set(students.map((s) => s.class))].sort();
  const sections = [...new Set(students.filter((s) => !filterClass || s.class === filterClass).map((s) => s.section))].sort();

  const filtered = students.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNumber.toLowerCase().includes(search.toLowerCase());
    const matchClass = !filterClass || s.class === filterClass;
    const matchSection = !filterSection || s.section === filterSection;
    return matchSearch && matchClass && matchSection;
  });

  if (loading) return <Spinner text="Loading students..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Student Management</h1>
          <p className="text-slate-500 text-sm mt-1">{students.length} students enrolled</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
          <span>+</span> Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="card p-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input className="input-field" placeholder="Search by name or roll number..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="input-field" value={filterClass} onChange={(e) => { setFilterClass(e.target.value); setFilterSection(''); }}>
            <option value="">All Classes</option>
            {classes.map((c) => <option key={c} value={c}>Class {c}</option>)}
          </select>
          <select className="input-field" value={filterSection} onChange={(e) => setFilterSection(e.target.value)}>
            <option value="">All Sections</option>
            {sections.map((s) => <option key={s} value={s}>Section {s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Roll No.', 'Name', 'Class', 'Section', 'Parent', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-slate-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">No students found</td></tr>
              )}
              {filtered.map((s) => (
                <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{s.rollNumber}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {s.name.charAt(0)}
                      </div>
                      {s.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">Class {s.class}</td>
                  <td className="px-4 py-3 text-slate-600">Section {s.section}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{s.parentName || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(s)} className="text-primary-600 hover:text-primary-700 font-medium text-xs">Edit</button>
                      <button onClick={() => setDeleteConfirm(s)} className="text-red-500 hover:text-red-600 font-medium text-xs">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
            Showing {filtered.length} of {students.length} students
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Student' : 'Add New Student'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Roll Number *</label>
              <input className="input-field" value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} required placeholder="10A01" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
              <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Student Name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Class *</label>
              <input className="input-field" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} required placeholder="10" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Section *</label>
              <input className="input-field" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value.toUpperCase() })} required placeholder="A" maxLength={1} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Parent Name</label>
              <input className="input-field" value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} placeholder="Parent / Guardian Name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Parent Contact</label>
              <input className="input-field" value={form.parentContact} onChange={(e) => setForm({ ...form, parentContact: e.target.value })} placeholder="+91 98765 43210" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm">{saving ? 'Saving...' : (editing ? 'Update Student' : 'Add Student')}</button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Delete" size="sm">
        <p className="text-slate-600 mb-4">Delete <strong>{deleteConfirm?.name}</strong> (Roll: {deleteConfirm?.rollNumber})? This cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="btn-secondary text-sm">Cancel</button>
          <button onClick={() => handleDelete(deleteConfirm._id)} className="btn-danger text-sm">Delete Student</button>
        </div>
      </Modal>
    </div>
  );
}