import { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  Search,
  Download,
  Trash2,
  Users,
  TrendingUp,
  CalendarDays,
  XCircle,
  CheckCircle2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
  Ban,
  Undo2,
  Plus,
  Edit2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Subscriber {
  id: string;
  email: string;
  source: string | null;
  status: 'subscribed' | 'unsubscribed';
  subscribed_at: string;
  unsubscribed_at: string | null;
}

type StatusFilter = 'all' | 'subscribed' | 'unsubscribed';

interface Banner {
  type: 'success' | 'error';
  message: string;
}

const PAGE_SIZE = 15;

function formatSourceLabel(source: string | null): string {
  if (!source) return 'Unknown';
  if (source === 'homepage') return 'Homepage';

  if (source.startsWith('journal_article_')) {
    const slug = source.replace('journal_article_', '');
    const readable = slug
      .replace(/[-_]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim();
    return `Journal: ${readable.charAt(0).toUpperCase() + readable.slice(1)}`;
  }

  const generic = source.replace(/[-_]/g, ' ').trim();
  return generic.charAt(0).toUpperCase() + generic.slice(1);
}

export default function AdminSubscribers() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Subscriber | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Modal states for Create / Edit (Update)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState<Subscriber | null>(null);
  const [formEmail, setFormEmail] = useState('');
  const [formSource, setFormSource] = useState('admin');
  const [formStatus, setFormStatus] = useState<'subscribed' | 'unsubscribed'>('subscribed');
  const [submitting, setSubmitting] = useState(false);

  const [banner, setBanner] = useState<Banner | null>(null);

  async function fetchSubscribers() {
    try {
      setLoadError(null);
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('id, email, source, status, subscribed_at, unsubscribed_at')
        .order('subscribed_at', { ascending: false })
        .limit(2000);

      if (error) throw error;
      setSubscribers(data || []);
    } catch (err) {
      console.error('Failed to fetch newsletter subscribers:', err);
      setLoadError('Could not load subscribers. Please try refreshing.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchSubscribers();
  }, []);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 4000);
    return () => clearTimeout(t);
  }, [banner]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSubscribers();
  };

  const openCreateModal = () => {
    setEditingSubscriber(null);
    setFormEmail('');
    setFormSource('admin');
    setFormStatus('subscribed');
    setIsModalOpen(true);
  };

  const openEditModal = (subscriber: Subscriber) => {
    setEditingSubscriber(subscriber);
    setFormEmail(subscriber.email);
    setFormSource(subscriber.source || 'admin');
    setFormStatus(subscriber.status);
    setIsModalOpen(true);
  };

  const handleSaveSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail.trim()) return;

    setSubmitting(true);
    try {
      if (editingSubscriber) {
        // UPDATE Operation
        const isChangingToUnsubscribed =
          editingSubscriber.status === 'subscribed' && formStatus === 'unsubscribed';
        
        const { error } = await supabase
          .from('newsletter_subscribers')
          .update({
            email: formEmail.trim(),
            source: formSource.trim() || null,
            status: formStatus,
            unsubscribed_at: isChangingToUnsubscribed ? new Date().toISOString() : editingSubscriber.unsubscribed_at,
          })
          .eq('id', editingSubscriber.id);

        if (error) throw error;

        setSubscribers((prev) =>
          prev.map((s) =>
            s.id === editingSubscriber.id
              ? {
                  ...s,
                  email: formEmail.trim(),
                  source: formSource.trim() || null,
                  status: formStatus,
                  unsubscribed_at: isChangingToUnsubscribed ? new Date().toISOString() : s.unsubscribed_at,
                }
              : s
          )
        );
        setBanner({ type: 'success', message: 'Subscriber updated successfully.' });
      } else {
        // CREATE Operation
        const { data, error } = await supabase
          .from('newsletter_subscribers')
          .insert([
            {
              email: formEmail.trim(),
              source: formSource.trim() || 'admin',
              status: formStatus,
              subscribed_at: new Date().toISOString(),
            },
          ])
          .select();

        if (error) throw error;

        if (data && data.length > 0) {
          setSubscribers((prev) => [data[0], ...prev]);
        } else {
          fetchSubscribers();
        }
        setBanner({ type: 'success', message: 'Subscriber created successfully.' });
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save subscriber:', err);
      setBanner({ type: 'error', message: 'Could not save subscriber. Please check the inputs.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (subscriber: Subscriber) => {
    setActionLoadingId(subscriber.id);
    const nextStatus = subscriber.status === 'subscribed' ? 'unsubscribed' : 'subscribed';

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({
          status: nextStatus,
          unsubscribed_at: nextStatus === 'unsubscribed' ? new Date().toISOString() : null,
        })
        .eq('id', subscriber.id);

      if (error) throw error;

      setSubscribers((prev) =>
        prev.map((s) =>
          s.id === subscriber.id
            ? {
                ...s,
                status: nextStatus,
                unsubscribed_at: nextStatus === 'unsubscribed' ? new Date().toISOString() : null,
              }
            : s
        )
      );

      setBanner({
        type: 'success',
        message: `${subscriber.email} set to ${nextStatus}.`,
      });
    } catch (err) {
      console.error('Failed to update subscriber status:', err);
      setBanner({ type: 'error', message: 'Could not update subscriber status.' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;

      setSubscribers((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setBanner({ type: 'success', message: `${deleteTarget.email} was removed.` });
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete subscriber:', err);
      setBanner({ type: 'error', message: 'Could not delete subscriber.' });
    } finally {
      setDeleting(false);
    }
  };

  const uniqueSources = useMemo(() => {
    const set = new Set<string>();
    subscribers.forEach((s) => {
      if (s.source) set.add(s.source);
    });
    return Array.from(set).sort((a, b) => formatSourceLabel(a).localeCompare(formatSourceLabel(b)));
  }, [subscribers]);

  const stats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const active = subscribers.filter((s) => s.status === 'subscribed');
    const unsubscribed = subscribers.filter((s) => s.status === 'unsubscribed');
    const thisWeek = subscribers.filter((s) => new Date(s.subscribed_at) >= startOfWeek);
    const thisMonth = subscribers.filter((s) => new Date(s.subscribed_at) >= startOfMonth);

    return {
      total: subscribers.length,
      active: active.length,
      unsubscribed: unsubscribed.length,
      thisWeek: thisWeek.length,
      thisMonth: thisMonth.length,
    };
  }, [subscribers]);

  const filteredSubscribers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return subscribers.filter((s) => {
      const matchesSearch = term === '' || s.email.toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchesSource = sourceFilter === 'all' || s.source === sourceFilter;
      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [subscribers, searchTerm, statusFilter, sourceFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSubscribers.length / PAGE_SIZE));

  const paginatedSubscribers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredSubscribers.slice(start, start + PAGE_SIZE);
  }, [filteredSubscribers, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handleExportCSV = () => {
    if (filteredSubscribers.length === 0) {
      setBanner({ type: 'error', message: 'No subscribers to export.' });
      return;
    }

    const header = ['Email', 'Status', 'Source', 'Subscribed At', 'Unsubscribed At'];
    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

    const rows = filteredSubscribers.map((s) =>
      [
        escapeCsv(s.email),
        escapeCsv(s.status),
        escapeCsv(formatSourceLabel(s.source)),
        escapeCsv(new Date(s.subscribed_at).toISOString()),
        escapeCsv(s.unsubscribed_at ? new Date(s.unsubscribed_at).toISOString() : ''),
      ].join(',')
    );

    const csvContent = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.setAttribute('download', `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSourceFilter('all');
  };

  const hasActiveFilters = searchTerm.trim() !== '' || statusFilter !== 'all' || sourceFilter !== 'all';

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl lg:text-3xl font-semibold text-cocoa-900 tracking-tight">
            Newsletter Subscribers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage everyone who has signed up for the Putu Travels newsletter.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white bg-coral-500 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 hover:bg-coral-600 transition-colors duration-200 shadow-sm"
          >
            <Plus size={15} />
            Add Subscriber
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-cocoa-700 bg-white border border-sand-200 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 hover:border-coral-300 hover:text-coral-600 transition-colors duration-200 disabled:opacity-60"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-cocoa-700 bg-white border border-sand-200 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 hover:border-coral-300 hover:text-coral-600 transition-colors duration-200"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Notifications */}
      {banner && (
        <div
          className={`mb-5 flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-xs sm:text-sm font-medium border ${
            banner.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          <span className="flex items-center gap-2">
            {banner.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {banner.message}
          </span>
          <button type="button" onClick={() => setBanner(null)} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-sand-200/80 p-4 sm:p-5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
            <Users size={16} />
          </div>
          <p className="text-lg sm:text-2xl font-serif font-semibold text-cocoa-900">
            {loading ? '—' : stats.active.toLocaleString()}
          </p>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Active subscribers</p>
        </div>

        <div className="bg-white rounded-2xl border border-sand-200/80 p-4 sm:p-5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <TrendingUp size={16} />
          </div>
          <p className="text-lg sm:text-2xl font-serif font-semibold text-cocoa-900">
            {loading ? '—' : stats.thisMonth.toLocaleString()}
          </p>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">New this month</p>
        </div>

        <div className="bg-white rounded-2xl border border-sand-200/80 p-4 sm:p-5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-coral-50 text-coral-600 flex items-center justify-center mb-3">
            <CalendarDays size={16} />
          </div>
          <p className="text-lg sm:text-2xl font-serif font-semibold text-cocoa-900">
            {loading ? '—' : stats.thisWeek.toLocaleString()}
          </p>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">New this week</p>
        </div>

        <div className="bg-white rounded-2xl border border-sand-200/80 p-4 sm:p-5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
            <XCircle size={16} />
          </div>
          <p className="text-lg sm:text-2xl font-serif font-semibold text-cocoa-900">
            {loading ? '—' : stats.unsubscribed.toLocaleString()}
          </p>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Unsubscribed</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-sand-200/80 p-3 sm:p-4 shadow-sm mb-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1 flex items-center bg-sand-50/80 rounded-xl px-3 py-2.5 border border-slate-200/80 focus-within:border-coral-400 focus-within:bg-white transition-colors duration-200">
          <Search size={15} className="text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search by email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-cocoa-900 text-xs sm:text-sm focus:outline-none font-medium placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="bg-sand-50/80 border border-slate-200/80 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-medium text-cocoa-900 focus:outline-none focus:border-coral-400 transition-colors duration-200"
          >
            <option value="all">All statuses</option>
            <option value="subscribed">Subscribed</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-sand-50/80 border border-slate-200/80 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-medium text-cocoa-900 focus:outline-none focus:border-coral-400 transition-colors duration-200 max-w-[10rem] sm:max-w-xs truncate"
          >
            <option value="all">All sources</option>
            {uniqueSources.map((source) => (
              <option key={source} value={source}>
                {formatSourceLabel(source)}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs sm:text-sm font-semibold text-coral-600 hover:text-coral-700 whitespace-nowrap"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Main List Container */}
      <div className="bg-white rounded-2xl border border-sand-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4 sm:p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-14 sm:py-20 px-4">
            <div className="w-12 h-12 rounded-2xl bg-sand-100 text-slate-400 flex items-center justify-center mb-3">
              <Mail size={20} />
            </div>
            <p className="text-sm sm:text-base font-semibold text-cocoa-900">
              {subscribers.length === 0 ? 'No subscribers yet' : 'No subscribers match your filters'}
            </p>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm">
              {subscribers.length === 0
                ? 'Click "Add Subscriber" to create your first subscriber entry.'
                : 'Try adjusting your search terms or dropdown filters.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View Card Layout */}
            <div className="block md:hidden divide-y divide-sand-100">
              {paginatedSubscribers.map((subscriber) => {
                const isActionLoading = actionLoadingId === subscriber.id;
                return (
                  <div key={subscriber.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-cocoa-900 break-all">
                          {subscriber.email}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            subscriber.status === 'subscribed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {subscriber.status === 'subscribed' ? <CheckCircle2 size={10} /> : <Ban size={10} />}
                          {subscriber.status === 'subscribed' ? 'Subscribed' : 'Unsubscribed'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditModal(subscriber)}
                          className="p-1.5 text-slate-400 hover:text-coral-600 rounded-lg border border-sand-200"
                          title="Edit subscriber"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(subscriber)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg border border-sand-200"
                          title="Delete subscriber"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                      <span>Source: {formatSourceLabel(subscriber.source)}</span>
                      <span>Joined: {formatDate(subscriber.subscribed_at)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(subscriber)}
                      disabled={isActionLoading}
                      className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 rounded-lg border border-sand-200 text-cocoa-700 hover:border-coral-300 transition-colors"
                    >
                      {subscriber.status === 'subscribed' ? (
                        <>
                          <Ban size={12} />
                          Unsubscribe
                        </>
                      ) : (
                        <>
                          <Undo2 size={12} />
                          Resubscribe
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Desktop View Table Layout */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-sand-200/80 bg-sand-50/60">
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Email
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Source
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Subscribed
                    </th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSubscribers.map((subscriber) => {
                    const isActionLoading = actionLoadingId === subscriber.id;
                    return (
                      <tr
                        key={subscriber.id}
                        className="border-b border-sand-100 last:border-0 hover:bg-sand-50/40 transition-colors duration-150"
                      >
                        <td className="px-6 py-3.5 text-sm font-medium text-cocoa-900 break-all">
                          {subscriber.email}
                        </td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                              subscriber.status === 'subscribed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {subscriber.status === 'subscribed' ? (
                              <CheckCircle2 size={11} />
                            ) : (
                              <Ban size={11} />
                            )}
                            {subscriber.status === 'subscribed' ? 'Subscribed' : 'Unsubscribed'}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-sm text-slate-500">
                          {formatSourceLabel(subscriber.source)}
                        </td>
                        <td className="px-6 py-3.5 text-sm text-slate-500">
                          {formatDate(subscriber.subscribed_at)}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(subscriber)}
                              disabled={isActionLoading}
                              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-sand-200 text-cocoa-700 hover:border-coral-300 hover:text-coral-600 transition-colors duration-200"
                            >
                              {subscriber.status === 'subscribed' ? (
                                <>
                                  <Ban size={12} />
                                  <span>Unsubscribe</span>
                                </>
                              ) : (
                                <>
                                  <Undo2 size={12} />
                                  <span>Resubscribe</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(subscriber)}
                              className="p-1.5 text-slate-400 hover:text-coral-600 rounded-lg border border-sand-200"
                              title="Edit subscriber"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(subscriber)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg border border-sand-200"
                              title="Delete subscriber"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-t border-sand-200/80 bg-sand-50/40">
              <p className="text-xs text-slate-500">
                Showing{' '}
                <span className="font-semibold text-cocoa-700">
                  {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, filteredSubscribers.length)}
                </span>{' '}
                of <span className="font-semibold text-cocoa-700">{filteredSubscribers.length}</span>
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 rounded-lg border border-sand-200 text-slate-500 flex items-center justify-center hover:border-coral-300 hover:text-coral-600 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs font-semibold text-cocoa-700 px-1.5">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-lg border border-sand-200 text-slate-500 flex items-center justify-center hover:border-coral-300 hover:text-coral-600 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* CREATE & EDIT MODAL (Upsert) */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa-900/50 backdrop-blur-sm px-4"
          onClick={() => !submitting && setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-sand-200 pb-3 mb-4">
              <h3 className="text-base font-semibold text-cocoa-900">
                {editingSubscriber ? 'Edit Subscriber' : 'Add New Subscriber'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-cocoa-900"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveSubscriber} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-cocoa-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="subscriber@example.com"
                  className="w-full bg-sand-50/80 border border-slate-200/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-cocoa-900 focus:outline-none focus:border-coral-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-cocoa-700 mb-1">
                  Subscription Source
                </label>
                <input
                  type="text"
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  placeholder="e.g. homepage, journal_article_safari"
                  className="w-full bg-sand-50/80 border border-slate-200/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-cocoa-900 focus:outline-none focus:border-coral-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-cocoa-700 mb-1">
                  Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as 'subscribed' | 'unsubscribed')}
                  className="w-full bg-sand-50/80 border border-slate-200/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-cocoa-900 focus:outline-none focus:border-coral-400"
                >
                  <option value="subscribed">Subscribed</option>
                  <option value="unsubscribed">Unsubscribed</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="flex-1 text-xs sm:text-sm font-semibold text-cocoa-700 bg-sand-50 border border-sand-200 rounded-xl px-4 py-2.5 hover:bg-sand-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 text-xs sm:text-sm font-semibold text-white bg-coral-500 rounded-xl px-4 py-2.5 hover:bg-coral-600 inline-flex items-center justify-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa-900/50 backdrop-blur-sm px-4"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <AlertCircle size={18} />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-cocoa-900">Delete this subscriber?</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              This will permanently remove{' '}
              <span className="font-semibold text-cocoa-700 break-all">{deleteTarget.email}</span> from your database.
            </p>
            <div className="flex items-center gap-2 mt-5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 text-xs sm:text-sm font-semibold text-cocoa-700 bg-sand-50 border border-sand-200 rounded-xl px-4 py-2.5 hover:bg-sand-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 text-xs sm:text-sm font-semibold text-white bg-rose-600 rounded-xl px-4 py-2.5 hover:bg-rose-700 inline-flex items-center justify-center gap-1.5"
              >
                {deleting ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}