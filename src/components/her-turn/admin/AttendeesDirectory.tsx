import { useState, useEffect, useMemo, useRef, DragEvent } from 'react';
import { supabase } from '@/lib/supabase';
import type { HerTurnEdition, HerTurnRegistration } from '@/types/Herturn';
import {
  Search, Download, CheckCircle2, Clock, XCircle, RefreshCcw,
  Upload, X, Image as ImageIcon, Plus, Pencil, Trash2, User,
  Check, AlertTriangle
} from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  checked_in: 'bg-teal-50 text-teal-700 border-teal-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
  refunded: 'bg-slate-100 text-slate-500 border-slate-200',
};

function csvEscape(value: unknown): string {
  if (value == null) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

interface ExtendedRegistration extends HerTurnRegistration {
  avatar_url?: string;
  tier_name?: string;
  edition_title?: string;
}

const EMPTY_ATTENDEE = {
  full_name: '',
  email: '',
  phone: '',
  edition_id: '',
  ticket_tier_id: '',
  status: 'paid' as HerTurnRegistration['status'],
  amount_paid: 0,
  currency: 'USD',
  avatar_url: '',
  dietary_requirements: '',
  social_handle: '',
};

export default function AttendeesDirectory() {
  const [editions, setEditions] = useState<HerTurnEdition[]>([]);
  const [selectedEditionId, setSelectedEditionId] = useState<string>('all');
  const [registrations, setRegistrations] = useState<ExtendedRegistration[]>([]);
  const [tierNames, setTierNames] = useState<Record<string, string>>({});
  const [editionTitles, setEditionTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_ATTENDEE);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEditions();
  }, []);

  useEffect(() => {
    fetchRegistrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEditionId]);

  async function fetchEditions() {
    const { data, error } = await supabase.from('her_turn_editions').select('*').order('start_date', { ascending: false });
    if (error) {
      console.error('Error fetching editions:', error);
      return;
    }
    setEditions(data || []);
    const titles: Record<string, string> = {};
    (data || []).forEach(e => (titles[e.id] = e.title));
    setEditionTitles(titles);
  }

  async function fetchRegistrations() {
    setLoading(true);
    try {
      let query = supabase.from('her_turn_registrations').select('*').order('created_at', { ascending: false });
      if (selectedEditionId !== 'all') query = query.eq('edition_id', selectedEditionId);
      const { data, error } = await query;
      if (error) throw error;
      setRegistrations(data || []);

      const tierIds = [...new Set((data || []).map(r => r.ticket_tier_id).filter(Boolean))];
      if (tierIds.length > 0) {
        const { data: tiers } = await supabase.from('her_turn_ticket_tiers').select('id, name').in('id', tierIds);
        const map: Record<string, string> = {};
        (tiers || []).forEach(t => (map[t.id] = t.name));
        setTierNames(map);
      }
    } catch (err) {
      console.error('Error fetching registrations:', err);
    } finally {
      setLoading(false);
    }
  }

  // Image Upload Logic (Supabase Bucket)
  async function handleFileUpload(file: File) {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `attendee-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `her-turn/attendees/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('public-bucket').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('public-bucket').getPublicUrl(filePath);
      setForm(prev => ({ ...prev, avatar_url: publicUrl }));
    } catch (err: any) {
      console.error('Upload failed:', err);
      alert(`Upload failed: ${err?.message || 'Check storage permissions'}`);
    } finally {
      setUploading(false);
      setIsDragging(false);
    }
  }

  // Drag and Drop Handlers
  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }

  function openNewModal() {
    setEditingId(null);
    setForm({
      ...EMPTY_ATTENDEE,
      edition_id: editions[0]?.id || '',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  }

  function openEditModal(attendee: ExtendedRegistration) {
    setEditingId(attendee.id);
    setForm({
      full_name: attendee.full_name || '',
      email: attendee.email || '',
      phone: attendee.phone || '',
      edition_id: attendee.edition_id || '',
      ticket_tier_id: attendee.ticket_tier_id || '',
      status: attendee.status || 'paid',
      amount_paid: attendee.amount_paid || 0,
      currency: attendee.currency || 'USD',
      avatar_url: attendee.avatar_url || '',
      dietary_requirements: attendee.dietary_requirements || '',
      social_handle: attendee.social_handle || '',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  }

  async function handleToggleCheckIn(attendee: ExtendedRegistration) {
    const isCheckedIn = attendee.status === 'checked_in';
    const newStatus = isCheckedIn ? 'paid' : 'checked_in';
    const checkedInAt = isCheckedIn ? null : new Date().toISOString();

    try {
      const { error } = await supabase
        .from('her_turn_registrations')
        .update({ status: newStatus, checked_in_at: checkedInAt })
        .eq('id', attendee.id);

      if (error) throw error;
      fetchRegistrations();
    } catch (err: any) {
      console.error('Error toggling check-in:', err);
      alert('Failed to update status.');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to remove this registration?')) return;
    try {
      const { error } = await supabase.from('her_turn_registrations').delete().eq('id', id);
      if (error) throw error;
      setRegistrations(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      console.error('Error deleting registration:', err);
      alert('Failed to delete registration.');
    }
  }

  async function handleSaveAttendee(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      if (!form.full_name || !form.email || !form.edition_id) {
        setErrorMsg('Full name, email, and edition selection are required.');
        setSaving(false);
        return;
      }

      if (editingId) {
        const { error } = await supabase.from('her_turn_registrations').update(form).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('her_turn_registrations').insert([form]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchRegistrations();
    } catch (err: any) {
      console.error('Error saving attendee:', err);
      setErrorMsg(err?.message || 'Error saving attendee record.');
    } finally {
      setSaving(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return registrations.filter(r => {
      const matchesQuery = r.full_name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.phone.includes(q);
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [registrations, search, statusFilter]);

  function handleExportCsv() {
    const headers = ['Full Name', 'Email', 'Phone', 'Edition', 'Ticket Tier', 'Status', 'Amount Paid', 'Currency', 'Avatar URL', 'Dietary Requirements', 'Social Handle', 'Checked In At', 'Registered At'];
    const rows = filtered.map(r => [
      r.full_name, r.email, r.phone, editionTitles[r.edition_id] || '', tierNames[r.ticket_tier_id] || '',
      r.status, r.amount_paid, r.currency, r.avatar_url || '', r.dietary_requirements || '', r.social_handle || '',
      r.checked_in_at || '', r.created_at,
    ]);
    const csv = [headers, ...rows].map(row => row.map(csvEscape).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `her-turn-attendees-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const statusIcon = (status: string) => {
    if (status === 'checked_in') return <CheckCircle2 size={12} />;
    if (status === 'pending') return <Clock size={12} />;
    if (status === 'failed' || status === 'cancelled') return <XCircle size={12} />;
    return <CheckCircle2 size={12} />;
  };

  return (
    <div className="space-y-5">
      {/* Controls Bar */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="bg-white p-4 rounded-2xl border border-sand-200 shadow-sm flex items-center gap-3 flex-1">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input type="text" placeholder="Search name, email, or phone..." value={search} onChange={e => setSearch(e.target.value)} className="w-full text-sm focus:outline-none bg-transparent" />
        </div>
        
        <select value={selectedEditionId} onChange={e => setSelectedEditionId(e.target.value)} className="bg-white border border-sand-200 rounded-2xl px-4 py-3 text-sm shadow-sm focus:outline-none">
          <option value="all">All Editions</option>
          {editions.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-white border border-sand-200 rounded-2xl px-4 py-3 text-sm shadow-sm focus:outline-none">
          <option value="all">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="checked_in">Checked In</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>

        <button onClick={fetchRegistrations} className="bg-white border border-sand-200 hover:bg-sand-100 text-cocoa-700 p-3 rounded-2xl shadow-sm cursor-pointer" title="Refresh">
          <RefreshCcw size={16} />
        </button>

        <button onClick={openNewModal} className="inline-flex items-center justify-center gap-2 bg-coral-600 hover:bg-coral-700 text-white px-5 py-3 rounded-2xl text-sm font-semibold shadow-sm cursor-pointer whitespace-nowrap">
          <Plus size={16} /> Add Attendee
        </button>

        <button onClick={handleExportCsv} disabled={filtered.length === 0} className="inline-flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white px-5 py-3 rounded-2xl text-sm font-semibold shadow-sm cursor-pointer whitespace-nowrap">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="text-xs text-slate-500 px-1">{filtered.length} attendee{filtered.length === 1 ? '' : 's'} found</div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading attendees...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-sand-200 text-slate-500">No attendees match your filters.</div>
      ) : (
        <div className="bg-white rounded-2xl border border-sand-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-sand-50 border-b border-sand-200 text-xs font-semibold text-cocoa-700 uppercase">
                  <th className="p-4">Attendee</th>
                  <th className="p-4">Edition</th>
                  <th className="p-4">Ticket</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Check-In</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100 text-sm text-slate-600">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-sand-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sand-100 border border-sand-200 shrink-0 overflow-hidden flex items-center justify-center">
                          {r.avatar_url ? (
                            <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User size={18} className="text-slate-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-cocoa-700">{r.full_name}</div>
                          <div className="text-xs text-slate-400">{r.email} · {r.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs">{editionTitles[r.edition_id] || '—'}</td>
                    <td className="p-4 text-xs">{tierNames[r.ticket_tier_id] || '—'}</td>
                    <td className="p-4 text-xs font-semibold">{r.currency} {r.amount_paid}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize ${STATUS_STYLES[r.status] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {statusIcon(r.status)} {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleCheckIn(r)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                          r.status === 'checked_in'
                            ? 'bg-teal-100 text-teal-800 hover:bg-teal-200'
                            : 'bg-sand-100 text-slate-700 hover:bg-sand-200'
                        }`}
                      >
                        <Check size={12} /> {r.status === 'checked_in' ? 'Checked In' : 'Check In'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditModal(r)} className="p-2 bg-sand-100 hover:bg-sand-200 text-cocoa-700 rounded-lg cursor-pointer" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendee Form Modal with Drag and Drop & Image URL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 relative shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X size={20} />
            </button>
            <h2 className="text-2xl font-bold font-serif text-cocoa-700">
              {editingId ? 'Edit Attendee' : 'Add New Attendee'}
            </h2>

            <form onSubmit={handleSaveAttendee} className="space-y-6">
              {/* Profile Image Drag-and-Drop & URL Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-cocoa-700 uppercase">Attendee Photo / Avatar</label>
                
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-colors ${
                    isDragging ? 'border-coral-500 bg-coral-50/50' : 'border-sand-300 bg-sand-50 hover:bg-sand-100/50'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={e => e.target.files && e.target.files[0] && handleFileUpload(e.target.files[0])}
                  />

                  {uploading ? (
                    <div className="py-2 text-coral-600 text-sm font-semibold animate-pulse">Uploading image...</div>
                  ) : form.avatar_url ? (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <img src={form.avatar_url} alt="Preview" className="w-20 h-20 rounded-full object-cover border-2 border-coral-500 shadow-sm" />
                      <p className="text-xs text-slate-500">Drag & drop or click to replace image</p>
                    </div>
                  ) : (
                    <div className="space-y-2 py-2">
                      <Upload size={28} className="mx-auto text-slate-400" />
                      <p className="text-sm text-slate-600 font-medium">
                        Drag and drop attendee photo here, or <span className="text-coral-600 underline">browse</span>
                      </p>
                      <p className="text-[10px] text-slate-400">Supports PNG, JPG, WEBP</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <ImageIcon size={14} className="text-slate-400 shrink-0" />
                  <input
                    type="url"
                    value={form.avatar_url}
                    onChange={e => setForm({ ...form, avatar_url: e.target.value })}
                    placeholder="Or paste direct Image URL (https://...)"
                    className="w-full bg-sand-50 border border-sand-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-coral-600"
                  />
                </div>
              </div>

              {/* Personal Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-cocoa-700 uppercase mb-1">Full Name</label>
                  <input
                    required
                    value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                    placeholder="Jane Doe"
                    className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none focus:border-coral-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-cocoa-700 uppercase mb-1">Email Address</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="jane@example.com"
                    className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none focus:border-coral-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-cocoa-700 uppercase mb-1">Phone Number</label>
                  <input
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+254 700 000 000"
                    className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none focus:border-coral-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-cocoa-700 uppercase mb-1">Social Handle</label>
                  <input
                    value={form.social_handle}
                    onChange={e => setForm({ ...form, social_handle: e.target.value })}
                    placeholder="@janedoe"
                    className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none focus:border-coral-600"
                  />
                </div>
              </div>

              {/* Event & Registration Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-cocoa-700 uppercase mb-1">Edition</label>
                  <select
                    required
                    value={form.edition_id}
                    onChange={e => setForm({ ...form, edition_id: e.target.value })}
                    className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none"
                  >
                    <option value="">Select Edition</option>
                    {editions.map(e => (
                      <option key={e.id} value={e.id}>{e.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-cocoa-700 uppercase mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as any })}
                    className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none"
                  >
                    <option value="paid">Paid</option>
                    <option value="checked_in">Checked In</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-cocoa-700 uppercase mb-1">Amount Paid</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.amount_paid}
                    onChange={e => setForm({ ...form, amount_paid: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-cocoa-700 uppercase mb-1">Currency</label>
                  <select
                    value={form.currency}
                    onChange={e => setForm({ ...form, currency: e.target.value })}
                    className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none"
                  >
                    <option>USD</option>
                    <option>KES</option>
                    <option>EUR</option>
                    <option>GBP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-cocoa-700 uppercase mb-1">Dietary / Special Requirements</label>
                <textarea
                  rows={2}
                  value={form.dietary_requirements}
                  onChange={e => setForm({ ...form, dietary_requirements: e.target.value })}
                  placeholder="Vegan, nut allergies, accessibility needs..."
                  className="w-full bg-sand-50 border border-sand-200 rounded-xl p-3 text-sm focus:outline-none"
                />
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs">
                  <AlertTriangle size={14} className="shrink-0" /> {errorMsg}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-sand-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="px-6 py-2.5 bg-coral-600 hover:bg-coral-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Attendee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}