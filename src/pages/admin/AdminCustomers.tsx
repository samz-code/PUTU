import { useEffect, useState, useMemo } from 'react';
import { 
  Users, Search, Plus, Trash2, Edit3, ShieldCheck, 
  Loader2, X, FileText, CheckSquare, Square, RefreshCw, ArrowUpDown, Phone, Globe, Award, Sparkles 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';

interface Customer {
  id: string;
  full_name: string;
  phone: string | null;
  nationality: string | null;
  vip_level: string;
  notes: string | null;
  created_at: string;
  email?: string | null;
}

interface JourneyBriefSubmission {
  id: string;
  customer_id?: string;
  full_name?: string;
  phone?: string | null;
  nationality?: string | null;
  special_requests?: string | null;
  admin_notes?: string | null;
  created_at: string;
}

export default function AdminCustomersIntegrated() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [vipFilter, setVipFilter] = useState<string>('ALL');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [nationality, setNationality] = useState('');
  const [vipLevel, setVipLevel] = useState('Standard');
  const [notes, setNotes] = useState('');

  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  const fetchAndSyncCustomers = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: customerData, error: customerErr } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (customerErr) throw customerErr;

      let currentCustomers = (customerData as Customer[]) ?? [];

      const { data: briefData, error: briefErr } = await supabase
        .from('journey_briefs')
        .select('*');

      if (!briefErr && briefData && briefData.length > 0) {
        setSyncing(true);
        let updatedCount = 0;

        for (const j of briefData as JourneyBriefSubmission[]) {
          const jName = (j.full_name || '').trim();
          const jPhone = j.phone || null;
          const jNationality = j.nationality || null;
          const jNotes = j.special_requests || j.admin_notes || null;

          if (!jName) continue;

          const existingIndex = currentCustomers.findIndex(
            c => c.id === j.customer_id || c.full_name.toLowerCase() === jName.toLowerCase()
          );

          if (existingIndex >= 0) {
            const target = currentCustomers[existingIndex];
            const needsUpdate = 
              (!target.phone && jPhone) || 
              (!target.nationality && jNationality) || 
              (!target.notes && jNotes);

            if (needsUpdate) {
              const patchData = {
                phone: target.phone || jPhone,
                nationality: target.nationality || jNationality,
                notes: target.notes || jNotes,
              };

              await supabase
                .from('customers')
                .update(patchData)
                .eq('id', target.id);

              currentCustomers[existingIndex] = { ...target, ...patchData };
              updatedCount++;
            }
          } else {
            const newRecord = {
              full_name: jName,
              phone: jPhone,
              nationality: jNationality,
              vip_level: 'Standard',
              notes: jNotes ? `[Journey Brief] ${jNotes}` : '[Journey Brief Submission]',
            };

            const { data: inserted, error: insertErr } = await supabase
              .from('customers')
              .insert([newRecord])
              .select()
              .single();

            if (!insertErr && inserted) {
              currentCustomers.unshift(inserted as Customer);
              updatedCount++;
            }
          }
        }

        if (updatedCount > 0) {
          setSyncMessage(`Successfully synchronized ${updatedCount} profile(s) from journey briefs data.`);
          setTimeout(() => setSyncMessage(null), 5000);
        }
        setSyncing(false);
      }

      setCustomers(currentCustomers);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve or synchronize customer records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndSyncCustomers();
  }, []);

  // Lock background scroll on mobile while a modal is open
  useEffect(() => {
    const shouldLock = isModalOpen || !!viewingCustomer;
    const original = document.body.style.overflow;
    if (shouldLock) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = original;
    };
  }, [isModalOpen, viewingCustomer]);

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setFullName('');
    setPhone('');
    setNationality('');
    setVipLevel('Standard');
    setNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFullName(customer.full_name);
    setPhone(customer.phone ?? '');
    setNationality(customer.nationality ?? '');
    setVipLevel(customer.vip_level);
    setNotes(customer.notes ?? '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setFormError('Customer full name is required.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const payload = {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        nationality: nationality.trim() || null,
        vip_level: vipLevel,
        notes: notes.trim() || null,
      };

      if (editingCustomer) {
        const { error: updateErr } = await supabase
          .from('customers')
          .update(payload)
          .eq('id', editingCustomer.id);
        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from('customers')
          .insert([payload]);
        if (insertErr) throw insertErr;
      }

      setIsModalOpen(false);
      await fetchAndSyncCustomers();
    } catch (err: any) {
      setFormError(err.message || 'Database write operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!window.confirm('CRITICAL: Are you sure you want to delete this customer profile?')) return;

    try {
      const { error: deleteErr } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (deleteErr) throw deleteErr;
      setCustomers(prev => prev.filter(c => c.id !== id));
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected customer profile(s)?`)) return;

    try {
      const { error: batchErr } = await supabase
        .from('customers')
        .delete()
        .in('id', selectedIds);

      if (batchErr) throw batchErr;
      setCustomers(prev => prev.filter(c => !selectedIds.includes(c.id)));
      setSelectedIds([]);
    } catch (err: any) {
      alert(`Batch deletion failed: ${err.message}`);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCustomers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCustomers.map(c => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = 
        c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.nationality ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.notes ?? '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesVip = vipFilter === 'ALL' || c.vip_level === vipFilter;

      return matchesSearch && matchesVip;
    }).sort((a, b) => {
      let comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return sortDirection === 'asc' ? -comparison : comparison;
    });
  }, [customers, searchTerm, vipFilter, sortDirection]);

  const uniqueVipLevels = Array.from(new Set(customers.map(c => c.vip_level)));

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-4 sm:space-y-6 mx-auto pb-12 sm:pb-16">
      <PageHeader 
        title="Customer CRM & Journey Briefs Sync" 
        subtitle="Automated profile aggregation from journey briefs submissions ensuring complete contact info." 
      />

      {syncMessage && (
        <div className="bg-teal-50 border border-teal-200 text-teal-800 p-3 sm:p-4 rounded-xl flex items-start sm:items-center gap-2.5 sm:gap-3 text-xs shadow-sm">
          <Sparkles size={18} className="text-teal-600 shrink-0 mt-0.5 sm:mt-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-bold uppercase tracking-wider">Total Synced Profiles</span>
            <Users size={16} className="text-indigo-600 shrink-0" />
          </div>
          <span className="font-serif text-xl sm:text-2xl font-bold text-slate-800">{customers.length}</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-bold uppercase tracking-wider">VIP Tiers Active</span>
            <Award size={16} className="text-amber-600 shrink-0" />
          </div>
          <span className="font-serif text-xl sm:text-2xl font-bold text-cocoa-700">{uniqueVipLevels.length} Levels</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-bold uppercase tracking-wider">Journey Briefs Status</span>
            <ShieldCheck size={16} className="text-teal-600 shrink-0" />
          </div>
          <span className="font-serif text-lg sm:text-xl font-bold text-teal-700">Auto-Linked Active</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 sm:space-y-4 min-w-0">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
          <div className="relative w-full md:w-80 min-w-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone, nationality..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 sm:py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={vipFilter}
              onChange={(e) => setVipFilter(e.target.value)}
              className="flex-1 sm:flex-none min-w-0 px-3 py-2.5 sm:py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">All VIP Tiers</option>
              {uniqueVipLevels.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>

            <button
              onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2.5 sm:py-2 border border-slate-300 rounded-lg text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center gap-1 font-medium transition-colors shrink-0"
            >
              <ArrowUpDown size={14} /> {sortDirection.toUpperCase()}
            </button>

            <button
              onClick={fetchAndSyncCustomers}
              className="p-2.5 sm:p-2 border border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-medium px-3 shrink-0"
            >
              <RefreshCw size={14} className={loading || syncing ? 'animate-spin' : ''} />
              <span className="hidden xs:inline sm:inline">Sync Briefs</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="w-full sm:w-auto sm:ml-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-sm transition-colors"
            >
              <Plus size={15} /> Add Customer
            </button>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-indigo-50 border border-indigo-200 px-3 sm:px-4 py-2.5 rounded-lg text-xs">
            <span className="font-semibold text-indigo-900">{selectedIds.length} customer profile(s) selected</span>
            <button
              onClick={handleBatchDelete}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded shadow-sm transition-colors"
            >
              <Trash2 size={13} /> Delete Selected Records
            </button>
          </div>
        )}
      </div>

      {/* Records: table on sm+, card list on mobile */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-10 sm:p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 size={24} className="animate-spin text-indigo-600" />
            <span className="text-xs font-medium">Synchronizing journey briefs & client profiles...</span>
          </div>
        ) : error ? (
          <div className="p-4 sm:p-6 text-red-600 flex items-start sm:items-center gap-2 text-xs">
            <ShieldCheck size={18} className="shrink-0 mt-0.5 sm:mt-0" /><span>{error}</span>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-10 sm:p-16 text-center text-slate-400">
            <Users size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-700">No customer records match your query.</p>
          </div>
        ) : (
          <>
            {/* Mobile card list (below sm) */}
            <div className="sm:hidden divide-y divide-slate-100">
              {filteredCustomers.map((c) => {
                const isSelected = selectedIds.includes(c.id);
                return (
                  <div key={c.id} className={`p-4 space-y-3 min-w-0 ${isSelected ? 'bg-indigo-50/40' : ''}`}>
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <button onClick={() => toggleSelectOne(c.id)} className="text-slate-500 hover:text-slate-700 mt-0.5 shrink-0">
                          {isSelected ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} />}
                        </button>
                        <div className="min-w-0">
                          <p className="font-semibold text-cocoa-700 text-sm truncate">{c.full_name}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold rounded-full uppercase bg-teal-50 text-teal-700 border border-teal-200">
                            {c.vip_level}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button onClick={() => setViewingCustomer(c)} className="p-1.5 text-slate-500 hover:text-indigo-600 transition-colors" title="View Profile">
                          <FileText size={16} />
                        </button>
                        <button onClick={() => handleOpenEdit(c)} className="p-1.5 text-slate-500 hover:text-indigo-600 transition-colors" title="Edit Profile">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => handleDeleteCustomer(c.id)} className="p-1.5 text-slate-500 hover:text-red-600 transition-colors" title="Delete Profile">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Phone size={12} className="text-slate-400 shrink-0" />
                        {c.phone ? <span className="truncate">{c.phone}</span> : <span className="text-amber-600 italic">Pending Sync</span>}
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Globe size={12} className="text-slate-400 shrink-0" />
                        {c.nationality ? <span className="truncate">{c.nationality}</span> : <span className="text-amber-600 italic">Pending Sync</span>}
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400">
                      Joined {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Table (sm and up) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase tracking-wider text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <button onClick={toggleSelectAll} className="text-slate-500 hover:text-slate-700">
                        {selectedIds.length === filteredCustomers.length ? <CheckSquare size={15} className="text-indigo-600" /> : <Square size={15} />}
                      </button>
                    </th>
                    <th className="px-4 py-3">Full Name</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Nationality</th>
                    <th className="px-4 py-3">VIP Level</th>
                    <th className="px-4 py-3">Joined Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredCustomers.map((c) => {
                    const isSelected = selectedIds.includes(c.id);
                    return (
                      <tr key={c.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-indigo-50/40' : ''}`}>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleSelectOne(c.id)} className="text-slate-500 hover:text-slate-700">
                            {isSelected ? <CheckSquare size={15} className="text-indigo-600" /> : <Square size={15} />}
                          </button>
                        </td>
                        <td className="px-4 py-3 font-semibold text-cocoa-700 max-w-[160px] truncate">{c.full_name}</td>
                        <td className="px-4 py-3 text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <Phone size={12} className="text-slate-400 shrink-0" /> 
                            {c.phone ? <span className="truncate max-w-[120px]">{c.phone}</span> : <span className="text-amber-600 italic">Pending Sync</span>}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {c.nationality ? (
                            <span className="inline-flex items-center gap-1"><Globe size={12} className="text-slate-400 shrink-0" /><span className="truncate max-w-[100px]">{c.nationality}</span></span>
                          ) : (
                            <span className="text-amber-600 italic">Pending Sync</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase bg-teal-50 text-teal-700 border border-teal-200 whitespace-nowrap">
                            {c.vip_level}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-[11px] whitespace-nowrap">{new Date(c.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                          <button onClick={() => setViewingCustomer(c)} className="p-1 text-slate-500 hover:text-indigo-600 transition-colors" title="View Profile">
                            <FileText size={15} />
                          </button>
                          <button onClick={() => handleOpenEdit(c)} className="p-1 text-slate-500 hover:text-indigo-600 transition-colors" title="Edit Profile">
                            <Edit3 size={15} />
                          </button>
                          <button onClick={() => handleDeleteCustomer(c.id)} className="p-1 text-slate-500 hover:text-red-600 transition-colors" title="Delete Profile">
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Customer Modal — bottom sheet on mobile */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black bg-opacity-60 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full sm:mx-4 p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto overflow-x-hidden sm:my-8">
            <div className="sm:hidden w-10 h-1 bg-slate-200 rounded-full mx-auto -mt-1 mb-1" />

            <div className="flex items-center justify-between border-b border-slate-200 pb-3 min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {editingCustomer ? 'Edit Customer Profile' : 'Add New Customer Profile'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 shrink-0" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            {formError && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">{formError}</div>}

            <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nationality</label>
                  <input type="text" value={nationality} onChange={(e) => setNationality(e.target.value)} className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">VIP Level</label>
                <select value={vipLevel} onChange={(e) => setVipLevel(e.target.value)} className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                  <option value="Standard">Standard</option>
                  <option value="Silver">Silver</option>
                  <option value="Gold">Gold</option>
                  <option value="Platinum">Platinum</option>
                  <option value="VIP Elite">VIP Elite</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Preferences</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting} className="w-full sm:w-auto px-5 py-2.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg flex items-center justify-center gap-2">
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  <span>{editingCustomer ? 'Update Profile' : 'Save Profile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Profile Drawer — bottom sheet on mobile */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black bg-opacity-60 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full sm:mx-4 p-4 sm:p-6 shadow-2xl space-y-5 sm:space-y-6 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto overflow-x-hidden sm:my-8">
            <div className="sm:hidden w-10 h-1 bg-slate-200 rounded-full mx-auto -mt-1 mb-1" />

            <div className="flex items-start justify-between border-b border-slate-200 pb-4 gap-2 min-w-0">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">{viewingCustomer.full_name}</h3>
                <p className="text-[10px] sm:text-xs text-slate-500 truncate">UUID: {viewingCustomer.id}</p>
              </div>
              <button onClick={() => setViewingCustomer(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full shrink-0" aria-label="Close">✕</button>
            </div>
            <div className="space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="min-w-0">
                  <span className="text-slate-400 block uppercase font-semibold">VIP Tier</span>
                  <span className="font-bold text-teal-700 uppercase text-sm">{viewingCustomer.vip_level}</span>
                </div>
                <div className="min-w-0">
                  <span className="text-slate-400 block uppercase font-semibold">Joined Date</span>
                  <span className="font-semibold text-slate-800 text-sm">{new Date(viewingCustomer.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="space-y-2 border-t border-b border-slate-200 py-3 font-medium">
                <div className="flex justify-between gap-2 text-slate-600 min-w-0">
                  <span className="shrink-0">Phone Number:</span>
                  <span className="font-semibold text-slate-900 text-right truncate">{viewingCustomer.phone ?? 'Not provided'}</span>
                </div>
                <div className="flex justify-between gap-2 text-slate-600 min-w-0">
                  <span className="shrink-0">Nationality:</span>
                  <span className="font-semibold text-slate-900 text-right truncate">{viewingCustomer.nationality ?? 'Not specified'}</span>
                </div>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-400 block uppercase font-semibold text-[10px]">Journey Briefs & Requests</span>
                <p className="text-slate-700 italic break-words">{viewingCustomer.notes || 'No notes logged.'}</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setViewingCustomer(null)} className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}