import { useEffect, useState, useMemo } from 'react';
import { 
  CreditCard, AlertCircle, CheckCircle, Plus, Trash2, Edit3, 
  Search, ShieldCheck, DollarSign, Calendar, User, FileText, Loader2, X, 
  ArrowUpDown, Filter, RefreshCw, Download, Receipt, CheckSquare, Square
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';

interface PaymentRecord {
  id: string;
  user_id: string;
  booking_id: string;
  amount: number;
  method: string;
  status: string;
  paid_at: string | null;
  transaction_code: string | null;
  created_at: string;
  tax_amount?: number;
  total_with_tax?: number;
}

const TAX_RATE = 0.16; // 16% regulatory tax standard

export default function AdminPaymentsDetailed() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Advanced Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<'created_at' | 'amount' | 'status'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal / Form States for Create & Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Field Inputs
  const [userId, setUserId] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [method, setMethod] = useState('M-Pesa');
  const [status, setStatus] = useState('Completed');
  const [transactionCode, setTransactionCode] = useState('');

  // Detailed View / Audit Modal State
  const [viewingPayment, setViewingPayment] = useState<PaymentRecord | null>(null);

  const fetchAdminPayments = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchErr } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchErr) {
      setError('Failed to retrieve system-wide payment records. Please verify database table structure.');
    } else {
      const enriched = ((data as PaymentRecord[]) ?? []).map(p => {
        const base = Number(p.amount) || 0;
        const tax = base * TAX_RATE;
        return {
          ...p,
          tax_amount: Number(tax.toFixed(2)),
          total_with_tax: Number((base + tax).toFixed(2))
        };
      });
      setPayments(enriched);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAdminPayments();
  }, []);

  const handleOpenCreate = () => {
    setEditingPayment(null);
    setUserId('');
    setBookingId('');
    setAmount('');
    setMethod('M-Pesa');
    setStatus('Completed');
    setTransactionCode('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (payment: PaymentRecord) => {
    setEditingPayment(payment);
    setUserId(payment.user_id);
    setBookingId(payment.booking_id);
    setAmount(payment.amount);
    setMethod(payment.method);
    setStatus(payment.status);
    setTransactionCode(payment.transaction_code ?? '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !bookingId || amount === '' || Number(amount) <= 0) {
      setFormError('Please complete all required fields with valid numerical values.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const payload = {
        user_id: userId.trim(),
        booking_id: bookingId.trim(),
        amount: Number(amount),
        method,
        status,
        transaction_code: transactionCode.trim() || null,
        paid_at: status === 'Completed' ? new Date().toISOString() : null,
      };

      if (editingPayment) {
        const { error: updateErr } = await supabase
          .from('payments')
          .update(payload)
          .eq('id', editingPayment.id);
        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from('payments')
          .insert([payload]);
        if (insertErr) throw insertErr;
      }

      setIsModalOpen(false);
      await fetchAdminPayments();
    } catch (err: any) {
      setFormError(err.message || 'Database write operation failed. Check RLS permissions.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!window.confirm('CRITICAL: Are you sure you want to permanently delete this payment transaction?')) return;

    try {
      const { error: deleteErr } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (deleteErr) throw deleteErr;
      setPayments(prev => prev.filter(p => p.id !== id));
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected payment record(s)?`)) return;

    try {
      const { error: batchErr } = await supabase
        .from('payments')
        .delete()
        .in('id', selectedIds);

      if (batchErr) throw batchErr;
      setPayments(prev => prev.filter(p => !selectedIds.includes(p.id)));
      setSelectedIds([]);
    } catch (err: any) {
      alert(`Batch deletion failed: ${err.message}`);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredPayments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPayments.map(p => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Filter and Sort Logic
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchesSearch = 
        (p.transaction_code?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        p.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.booking_id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      const matchesMethod = methodFilter === 'ALL' || p.method === methodFilter;

      return matchesSearch && matchesStatus && matchesMethod;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === 'created_at') {
        comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortField === 'amount') {
        comparison = Number(b.amount) - Number(a.amount);
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      return sortDirection === 'asc' ? -comparison : comparison;
    });
  }, [payments, searchTerm, statusFilter, methodFilter, sortField, sortDirection]);

  // Analytics Metrics Calculation
  const totalBaseCollected = payments
    .filter(p => p.status === 'Completed')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  
  const totalTaxCollected = totalBaseCollected * TAX_RATE;
  const grandTotalWithTax = totalBaseCollected + totalTaxCollected;

  const uniqueMethods = Array.from(new Set(payments.map(p => p.method)));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <PageHeader 
        title="Admin Payment Operations & Tax Audit" 
        subtitle="Comprehensive CRUD suite for system transactions, real-time 16% regulatory tax tracking, and financial reconciliation." 
      />

      {/* KPI Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Net Base Revenue</span>
            <DollarSign size={16} className="text-teal-600" />
          </div>
          <span className="font-serif text-xl font-bold text-cocoa-700">${totalBaseCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">16% Tax Liability</span>
            <Receipt size={16} className="text-indigo-600" />
          </div>
          <span className="font-serif text-xl font-bold text-indigo-700">${totalTaxCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Gross Total (Inc. Tax)</span>
            <ShieldCheck size={16} className="text-amber-600" />
          </div>
          <span className="font-serif text-xl font-bold text-slate-900">${grandTotalWithTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Total Records</span>
            <CreditCard size={16} className="text-slate-600" />
          </div>
          <span className="font-serif text-xl font-bold text-slate-800">{payments.length} Transactions</span>
        </div>
      </div>

      {/* Advanced Control & Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search code, user ID, method..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
              <option value="Refunded">Refunded</option>
            </select>

            {/* Method Filter */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Methods</option>
              {uniqueMethods.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            {/* Sort Direction Toggle */}
            <button
              onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center gap-1 font-medium transition-colors"
              title="Toggle Sort Order"
            >
              <ArrowUpDown size={14} /> {sortDirection.toUpperCase()}
            </button>

            <button
              onClick={fetchAdminPayments}
              className="p-2 border border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={handleOpenCreate}
              className="ml-auto inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-sm transition-colors"
            >
              <Plus size={15} /> New Transaction
            </button>
          </div>
        </div>

        {/* Batch Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 px-4 py-2.5 rounded-lg text-xs">
            <span className="font-semibold text-indigo-900">{selectedIds.length} record(s) selected</span>
            <button
              onClick={handleBatchDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded shadow-sm transition-colors"
            >
              <Trash2 size={13} /> Delete Selected Records
            </button>
          </div>
        )}
      </div>

      {/* Detailed Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 size={24} className="animate-spin text-indigo-600" />
            <span className="text-xs font-medium">Synchronizing payment records & calculating 16% tax...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-red-600 flex items-center gap-2 text-xs">
            <AlertCircle size={18} /><span>{error}</span>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <CreditCard size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-700">No payment records match your query.</p>
            <p className="text-xs text-slate-400 mt-1">Try broadening your search parameters or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 uppercase tracking-wider text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <button onClick={toggleSelectAll} className="text-slate-500 hover:text-slate-700">
                      {selectedIds.length === filteredPayments.length ? <CheckSquare size={15} className="text-indigo-600" /> : <Square size={15} />}
                    </button>
                  </th>
                  <th className="px-4 py-3">Transaction Code</th>
                  <th className="px-4 py-3">User & Booking UUID</th>
                  <th className="px-4 py-3 text-right">Base Amount</th>
                  <th className="px-4 py-3 text-right">16% Tax</th>
                  <th className="px-4 py-3 text-right">Total (Inc. Tax)</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Paid Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredPayments.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  return (
                    <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-indigo-50/40' : ''}`}>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleSelectOne(p.id)} className="text-slate-500 hover:text-slate-700">
                          {isSelected ? <CheckSquare size={15} className="text-indigo-600" /> : <Square size={15} />}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono text-indigo-600 font-semibold">
                        {p.transaction_code || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[11px] text-slate-900 font-mono truncate max-w-[140px]" title={p.user_id}>U: {p.user_id}</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]" title={p.booking_id}>B: {p.booking_id}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">${Number(p.amount).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-indigo-600">${p.tax_amount?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-bold text-cocoa-700">${p.total_with_tax?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-600">{p.method}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border ${
                          p.status === 'Completed' ? 'bg-teal-50 text-teal-700 border-teal-200' : 
                          p.status === 'Refunded' ? 'bg-red-50 text-red-700 border-red-200' : 
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => setViewingPayment(p)}
                          className="p-1 text-slate-500 hover:text-indigo-600 transition-colors"
                          title="View Full Audit Details"
                        >
                          <FileText size={15} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1 text-slate-500 hover:text-indigo-600 transition-colors"
                          title="Edit Record"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeletePayment(p.id)}
                          className="p-1 text-slate-500 hover:text-red-600 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingPayment ? 'Edit Payment & Tax Record' : 'Create New Payment Record'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSavePayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">User UUID *</label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter user uuid"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Booking UUID *</label>
                <input
                  type="text"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  placeholder="Enter booking uuid"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Base Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                  {amount !== '' && Number(amount) > 0 && (
                    <p className="text-[10px] text-indigo-600 mt-1 font-medium">
                      + 16% Tax (${(Number(amount) * TAX_RATE).toFixed(2)}) = ${(Number(amount) * (1 + TAX_RATE)).toFixed(2)} Total
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="Visa / MasterCard">Visa / MasterCard</option>
                    <option value="Airtel Money">Airtel Money</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Pesapal Hosted">Pesapal Hosted</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Transaction Code / Ref</label>
                  <input
                    type="text"
                    value={transactionCode}
                    onChange={(e) => setTransactionCode(e.target.value)}
                    placeholder="e.g. TKT98234XYZ"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  <span>{editingPayment ? 'Update Record' : 'Save Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED VIEW / AUDIT MODAL */}
      {viewingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Transaction Audit Report</h3>
                <p className="text-xs text-slate-500">ID: {viewingPayment.id}</p>
              </div>
              <button
                onClick={() => setViewingPayment(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block uppercase font-semibold">Transaction Code</span>
                  <span className="font-mono font-bold text-indigo-600 text-sm">{viewingPayment.transaction_code || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-semibold">Status</span>
                  <span className="font-bold text-teal-700 uppercase">{viewingPayment.status}</span>
                </div>
              </div>

              <div className="space-y-2 border-t border-b border-slate-200 py-3 font-medium">
                <div className="flex justify-between text-slate-600">
                  <span>User UUID:</span>
                  <span className="font-mono text-slate-900">{viewingPayment.user_id}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Booking UUID:</span>
                  <span className="font-mono text-slate-900">{viewingPayment.booking_id}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Payment Method:</span>
                  <span className="text-slate-900">{viewingPayment.method}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Created Timestamp:</span>
                  <span className="text-slate-900">{new Date(viewingPayment.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Paid Timestamp:</span>
                  <span className="text-slate-900">{viewingPayment.paid_at ? new Date(viewingPayment.paid_at).toLocaleString() : 'Unsettled'}</span>
                </div>
              </div>

              <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100 space-y-2">
                <div className="flex justify-between text-slate-700">
                  <span>Base Amount:</span>
                  <span className="font-semibold">${Number(viewingPayment.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Mandatory Tax (16%):</span>
                  <span className="font-semibold text-indigo-600">+${viewingPayment.tax_amount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-cocoa-700 pt-2 border-t border-indigo-200">
                  <span>Total Amount (Inc. Tax):</span>
                  <span>${viewingPayment.total_with_tax?.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => alert(`Generating official tax audit PDF for transaction ${viewingPayment.transaction_code || viewingPayment.id}`)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Download size={14} /> Download Audit PDF
                </button>
                <button
                  onClick={() => setViewingPayment(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}