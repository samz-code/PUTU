import { useEffect, useState, useRef } from 'react';
import { FileSpreadsheet, Send, Check, Eye, ArrowRightLeft, FileText, Download, X, Trash2, Edit3, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Quote {
  id: string;
  reference: string;
  brief_id: string;
  accommodation_total: number;
  transport_total: number;
  activities_total: number;
  dining_total: number;
  other_total: number;
  subtotal?: number;
  tax?: number;
  discount: number;
  total: number;
  status: string;
  valid_until: string;
  notes: string;
  created_at: string;
}

interface Invoice {
  id: string;
  quote_id: string;
  reference: string;
  total: number;
  subtotal?: number;
  tax?: number;
  status: string;
  due_date: string;
  created_at: string;
}

interface Brief {
  id: string;
  full_name: string;
  email: string;
}

export default function AdminQuotesAndInvoices() {
  const [activeTab, setActiveTab] = useState<'quotes' | 'invoices'>('quotes');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const documentRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    briefId: '',
    accommodation: '0',
    transport: '0',
    activities: '0',
    dining: '0',
    other: '0',
    discount: '0',
    validUntil: '',
    notes: '',
  });

  const loadData = async () => {
    setLoading(true);
    const [qRes, iRes, bRes] = await Promise.all([
      supabase.from('quotes').select('*').order('created_at', { ascending: false }),
      supabase.from('invoices').select('*').order('created_at', { ascending: false }),
      supabase.from('journey_briefs').select('id, full_name, email').order('created_at', { ascending: false }),
    ]);

    if (qRes.error) console.error('Error loading quotes:', qRes.error.message);
    if (iRes.error) console.error('Error loading invoices:', iRes.error.message);

    setQuotes((qRes.data as Quote[]) ?? []);
    setInvoices((iRes.data as Invoice[]) ?? []);
    setBriefs((bRes.data as Brief[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const subtotal =
    Number(form.accommodation) +
    Number(form.transport) +
    Number(form.activities) +
    Number(form.dining) +
    Number(form.other) -
    Number(form.discount);
  
  const tax = subtotal > 0 ? subtotal * 0.16 : 0;
  const total = subtotal + tax;

  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    const brief = briefs.find((b) => b.id === form.briefId);
    if (!brief) return;

    const payload: any = {
      brief_id: form.briefId,
      accommodation_total: Number(form.accommodation),
      transport_total: Number(form.transport),
      activities_total: Number(form.activities),
      dining_total: Number(form.dining),
      other_total: Number(form.other),
      subtotal,
      tax,
      discount: Number(form.discount),
      total,
      valid_until: form.validUntil || null,
      notes: form.notes,
    };

    if (editingId) {
      const { error } = await supabase.from('quotes').update(payload).eq('id', editingId);
      if (error) {
        delete payload.subtotal;
        delete payload.tax;
        const retryRes = await supabase.from('quotes').update(payload).eq('id', editingId);
        if (retryRes.error) {
          alert(`Failed to update quote: ${retryRes.error.message}`);
          return;
        }
      }
      setEditingId(null);
      setShowBuilder(false);
      setForm({ briefId: '', accommodation: '0', transport: '0', activities: '0', dining: '0', other: '0', discount: '0', validUntil: '', notes: '' });
      loadData();
    } else {
      payload.reference = `QT-${Math.floor(100000 + Math.random() * 900000)}`;
      payload.status = 'Pending';
      const { error } = await supabase.from('quotes').insert(payload);
      if (error) {
        delete payload.subtotal;
        delete payload.tax;
        const retryRes = await supabase.from('quotes').insert(payload);
        if (retryRes.error) {
          alert(`Failed to create quote: ${retryRes.error.message}`);
          return;
        }
      }
      setShowBuilder(false);
      setForm({ briefId: '', accommodation: '0', transport: '0', activities: '0', dining: '0', other: '0', discount: '0', validUntil: '', notes: '' });
      loadData();
    }
  };

  const startEditQuote = (q: Quote) => {
    setEditingId(q.id);
    setForm({
      briefId: q.brief_id || '',
      accommodation: String(q.accommodation_total ?? 0),
      transport: String(q.transport_total ?? 0),
      activities: String(q.activities_total ?? 0),
      dining: String(q.dining_total ?? 0),
      other: String(q.other_total ?? 0),
      discount: String(q.discount ?? 0),
      validUntil: q.valid_until ? q.valid_until.split('T')[0] : '',
      notes: q.notes || '',
    });
    setShowBuilder(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteQuote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quotation?')) return;
    const { error } = await supabase.from('quotes').delete().eq('id', id);
    if (error) alert(`Error deleting quote: ${error.message}`);
    loadData();
  };

  const deleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) alert(`Error deleting invoice: ${error.message}`);
    loadData();
  };

  const updateQuoteStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('quotes').update({ status }).eq('id', id);
    if (error) alert(`Error updating status: ${error.message}`);
    loadData();
  };

  const convertToInvoice = async (quote: Quote) => {
    const reference = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const computedSubtotal = quote.subtotal ?? quote.total / 1.16;
    const computedTax = quote.tax ?? (quote.total - computedSubtotal);

    const { error } = await supabase.from('invoices').insert({
      quote_id: quote.id,
      reference,
      total: quote.total,
      subtotal: computedSubtotal,
      tax: computedTax,
      status: 'Unpaid',
      due_date: dueDate.toISOString().split('T')[0],
    });

    if (error) {
      alert(`Error converting to invoice: ${error.message}`);
    } else {
      await supabase.from('quotes').update({ status: 'Converted' }).eq('id', quote.id);
      loadData();
      setActiveTab('invoices');
    }
  };

  const getBriefDetails = (briefId: string) => {
    return briefs.find((b) => b.id === briefId) || { full_name: 'Valued Client', email: '' };
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      Pending: 'badge-slate',
      Sent: 'badge-teal',
      Approved: 'badge-success',
      Rejected: 'badge-error',
      Expired: 'badge-slate',
      Converted: 'badge-success',
      Paid: 'badge-success',
      Unpaid: 'badge-slate',
      Overdue: 'badge-error',
    };
    return map[s] ?? 'badge-slate';
  };

  const qrCodeData = encodeURIComponent(`TEL:+254714446328\nEMAIL:putukenya06@gmail.com\nLOC:Diani, Kenya`);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrCodeData}`;

  const getLineItems = (quote: Quote) => {
    const items = [];
    if (quote.accommodation_total > 0) items.push({ label: 'Accommodation Logistics & Lodging', amount: quote.accommodation_total });
    if (quote.transport_total > 0) items.push({ label: 'Private Transport & Transfers', amount: quote.transport_total });
    if (quote.activities_total > 0) items.push({ label: 'Excursions & Guided Activities', amount: quote.activities_total });
    if (quote.dining_total > 0) items.push({ label: 'Gastronomy & Special Dining', amount: quote.dining_total });
    if (quote.other_total > 0) items.push({ label: 'Concierge & Auxiliary Services', amount: quote.other_total });
    if (quote.discount > 0) items.push({ label: 'Applied Promotional Discount', amount: -quote.discount, isDiscount: true });
    
    if (items.length === 0 && quote.total > 0) {
      const fallbackSub = quote.subtotal ?? quote.total / 1.16;
      items.push({ label: 'Standard Itinerary & Package Services', amount: fallbackSub });
    }
    return items;
  };

  const handleDownloadPDF = async () => {
    if (!documentRef.current || !selectedQuote) return;
    try {
      setIsDownloading(true);
      const canvas = await html2canvas(documentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${selectedQuote.reference}.pdf`);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to generate PDF. Please try printing instead.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Quotation & Invoicing Hub"
          subtitle="Full CRUD management for client proposals, quotes, and invoices with 16% VAT."
        />
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg text-xs w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('quotes')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md font-medium transition ${activeTab === 'quotes' ? 'bg-white text-cocoa-700 shadow-sm' : 'text-slate-500'}`}
            >
              Quotations ({quotes.length})
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md font-medium transition ${activeTab === 'invoices' ? 'bg-white text-cocoa-700 shadow-sm' : 'text-slate-500'}`}
            >
              Invoices ({invoices.length})
            </button>
          </div>
          {activeTab === 'quotes' && !showBuilder && (
            <button 
              onClick={() => { 
                setEditingId(null); 
                setForm({ briefId: '', accommodation: '0', transport: '0', activities: '0', dining: '0', other: '0', discount: '0', validUntil: '', notes: '' });
                setShowBuilder(true); 
              }} 
              className="btn-primary text-xs flex items-center justify-center gap-1.5 w-full sm:w-auto"
            >
              <FileSpreadsheet size={14} /> New Quote
            </button>
          )}
        </div>
      </div>

      {/* EMBEDDED PAGE SECTION FORM (NON-WINDOW BASED) */}
      {showBuilder && activeTab === 'quotes' ? (
        <div className="card-md p-6 sm:p-8 space-y-6 border border-slate-200 bg-white shadow-md rounded-xl">
          <div className="flex justify-between items-center border-b pb-4">
            <div className="flex items-center gap-3">
              <button 
                type="button" 
                onClick={() => { setShowBuilder(false); setEditingId(null); }} 
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                title="Back to List"
              >
                <ArrowLeft size={16} />
              </button>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-cocoa-700">
                {editingId ? 'Edit Commercial Proposal' : 'New Commercial Proposal (16% VAT)'}
              </h3>
            </div>
            <button 
              type="button" 
              onClick={() => { setShowBuilder(false); setEditingId(null); }} 
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSaveQuote} className="space-y-5">
            <div>
              <label className="label font-medium text-slate-700">From Journey Brief</label>
              <select
                className="input text-sm mt-1"
                required
                value={form.briefId}
                onChange={(e) => setForm({ ...form, briefId: e.target.value })}
              >
                <option value="">Select a journey brief...</option>
                {briefs.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.full_name} ({b.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="label">Accommodation ($)</label>
                <input type="number" step="0.01" className="input text-sm mt-1" value={form.accommodation} onChange={(e) => setForm({ ...form, accommodation: e.target.value })} />
              </div>
              <div>
                <label className="label">Transport ($)</label>
                <input type="number" step="0.01" className="input text-sm mt-1" value={form.transport} onChange={(e) => setForm({ ...form, transport: e.target.value })} />
              </div>
              <div>
                <label className="label">Activities ($)</label>
                <input type="number" step="0.01" className="input text-sm mt-1" value={form.activities} onChange={(e) => setForm({ ...form, activities: e.target.value })} />
              </div>
              <div>
                <label className="label">Dining ($)</label>
                <input type="number" step="0.01" className="input text-sm mt-1" value={form.dining} onChange={(e) => setForm({ ...form, dining: e.target.value })} />
              </div>
              <div>
                <label className="label">Other Services ($)</label>
                <input type="number" step="0.01" className="input text-sm mt-1" value={form.other} onChange={(e) => setForm({ ...form, other: e.target.value })} />
              </div>
              <div>
                <label className="label">Discount ($)</label>
                <input type="number" step="0.01" className="input text-sm mt-1" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Valid Until</label>
                <input type="date" className="input text-sm mt-1" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
              </div>
              <div>
                <label className="label">Commercial Notes & Terms</label>
                <textarea rows={2} className="input text-sm mt-1" placeholder="e.g. 50% deposit required." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-slate-50 rounded-xl border border-slate-200 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 block">Subtotal: ${subtotal.toFixed(2)}</span>
                <span className="text-xs text-slate-500 block">VAT (16%): ${tax.toFixed(2)}</span>
                <span className="text-sm font-semibold text-slate-800">Calculated Grand Total</span>
              </div>
              <span className="font-serif text-2xl font-bold text-coral-700">${total.toFixed(2)}</span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" className="btn-primary text-xs flex items-center gap-1.5 px-6 py-2.5">
                <Check size={14} /> {editingId ? 'Update Quotation' : 'Save Quotation'}
              </button>
              <button type="button" onClick={() => { setShowBuilder(false); setEditingId(null); }} className="btn-secondary text-xs px-6 py-2.5">
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* LIST SECTION */
        <div className="card-md bg-white shadow-sm border border-slate-200 overflow-hidden rounded-xl">
          {loading ? (
            <div className="p-12 text-sm text-slate-400 text-center">Loading financial records...</div>
          ) : activeTab === 'quotes' ? (
            quotes.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-500">No quotations found. Click "New Quote" to begin.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500 border-b">
                    <tr>
                      <th className="px-4 sm:px-5 py-3 font-medium">Reference</th>
                      <th className="px-4 sm:px-5 py-3 font-medium">Client</th>
                      <th className="px-4 sm:px-5 py-3 font-medium">Subtotal</th>
                      <th className="px-4 sm:px-5 py-3 font-medium">VAT (16%)</th>
                      <th className="px-4 sm:px-5 py-3 font-medium">Grand Total</th>
                      <th className="px-4 sm:px-5 py-3 font-medium">Status</th>
                      <th className="px-4 sm:px-5 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quotes.map((q) => {
                      const client = getBriefDetails(q.brief_id);
                      const computedSub = q.subtotal ?? q.total / 1.16;
                      const computedTax = q.tax ?? (q.total - computedSub);
                      return (
                        <tr key={q.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 sm:px-5 py-3.5 font-medium text-cocoa-700">{q.reference}</td>
                          <td className="px-4 sm:px-5 py-3.5">
                            <div className="font-medium text-slate-800">{client.full_name}</div>
                            <div className="text-xs text-slate-400">{client.email}</div>
                          </td>
                          <td className="px-4 sm:px-5 py-3.5 text-slate-600">${computedSub.toFixed(2)}</td>
                          <td className="px-4 sm:px-5 py-3.5 text-slate-600">${computedTax.toFixed(2)}</td>
                          <td className="px-4 sm:px-5 py-3.5 font-semibold text-slate-900">${q.total.toFixed(2)}</td>
                          <td className="px-4 sm:px-5 py-3.5">
                            <span className={statusBadge(q.status)}>{q.status}</span>
                          </td>
                          <td className="px-4 sm:px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => { setSelectedQuote(q); setShowPreview(true); }}
                              className="text-xs font-medium text-slate-600 hover:text-cocoa-700 inline-flex items-center gap-1"
                            >
                              <Eye size={12} /> View
                            </button>
                            <button
                              onClick={() => startEditQuote(q)}
                              className="text-xs font-medium text-amber-600 hover:underline inline-flex items-center gap-1"
                            >
                              <Edit3 size={12} /> Edit
                            </button>
                            {q.status === 'Pending' && (
                              <button
                                onClick={() => updateQuoteStatus(q.id, 'Sent')}
                                className="text-xs font-medium text-teal-600 hover:underline inline-flex items-center gap-1"
                              >
                                <Send size={12} /> Send
                              </button>
                            )}
                            {(q.status === 'Sent' || q.status === 'Approved') && (
                              <button
                                onClick={() => convertToInvoice(q)}
                                className="text-xs font-medium text-coral-600 hover:underline inline-flex items-center gap-1"
                              >
                                <ArrowRightLeft size={12} /> Invoice
                              </button>
                            )}
                            <button
                              onClick={() => deleteQuote(q.id)}
                              className="text-xs font-medium text-red-500 hover:text-red-700 inline-flex items-center gap-1"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">No invoices generated yet. Convert approved quotes into invoices.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500 border-b">
                  <tr>
                    <th className="px-4 sm:px-5 py-3 font-medium">Invoice #</th>
                    <th className="px-4 sm:px-5 py-3 font-medium">Subtotal</th>
                    <th className="px-4 sm:px-5 py-3 font-medium">VAT (16%)</th>
                    <th className="px-4 sm:px-5 py-3 font-medium">Grand Total</th>
                    <th className="px-4 sm:px-5 py-3 font-medium">Status</th>
                    <th className="px-4 sm:px-5 py-3 font-medium">Due Date</th>
                    <th className="px-4 sm:px-5 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => {
                    const invSub = inv.subtotal ?? inv.total / 1.16;
                    const invTax = inv.tax ?? (inv.total - invSub);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 sm:px-5 py-3.5 font-medium text-cocoa-700">{inv.reference}</td>
                        <td className="px-4 sm:px-5 py-3.5 text-slate-600">${invSub.toFixed(2)}</td>
                        <td className="px-4 sm:px-5 py-3.5 text-slate-600">${invTax.toFixed(2)}</td>
                        <td className="px-4 sm:px-5 py-3.5 font-semibold text-slate-900">${inv.total.toFixed(2)}</td>
                        <td className="px-4 sm:px-5 py-3.5">
                          <span className={statusBadge(inv.status)}>{inv.status}</span>
                        </td>
                        <td className="px-4 sm:px-5 py-3.5 text-slate-500 text-xs">{new Date(inv.due_date).toLocaleDateString()}</td>
                        <td className="px-4 sm:px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                          {inv.status === 'Unpaid' && (
                            <button
                              onClick={async () => {
                                await supabase.from('invoices').update({ status: 'Paid' }).eq('id', inv.id);
                                loadData();
                              }}
                              className="text-xs font-medium text-emerald-600 hover:underline inline-flex items-center gap-1"
                            >
                              <Check size={12} /> Mark Paid
                            </button>
                          )}
                          <button
                            onClick={() => deleteInvoice(inv.id)}
                            className="text-xs font-medium text-red-500 hover:text-red-700 inline-flex items-center gap-1"
                          >
                            <Trash2 size={12} />
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
      )}

      {/* PROFESSIONAL DOCUMENT PREVIEW MODAL */}
      {showPreview && selectedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 my-4 flex flex-col">
            <div className="bg-slate-900 text-white px-4 sm:px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-coral-500 shrink-0" />
                <span className="font-medium text-xs sm:text-sm tracking-wide truncate">Official Document Preview (16% VAT)</span>
              </div>
              <button onClick={() => setShowPreview(false)} className="text-slate-400 hover:text-white transition">
                <X size={18} />
              </button>
            </div>

            {/* CATCHABLE CONTAINER FOR PDF DOWNLOAD */}
            <div ref={documentRef} className="p-6 sm:p-8 space-y-6 text-slate-700 text-sm max-h-[75vh] overflow-y-auto bg-white">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b pb-6">
                <div className="flex items-center gap-4">
                  <img src="/logo.png" alt="Company Logo" className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />
                  <div>
                    <div className="font-serif text-xl sm:text-2xl font-bold text-cocoa-700">PUTU KENYA</div>
                    <p className="text-xs text-slate-500 mt-0.5">Diani, Kenya | Tel: +254 714 446 328</p>
                    <p className="text-xs text-slate-500">Email: putukenya06@gmail.com</p>
                    <p className="text-xs text-slate-600 mt-2 font-medium">Ref Document: <span className="font-semibold text-slate-800">{selectedQuote.reference}</span></p>
                  </div>
                </div>
                <div className="border border-slate-200 p-2 rounded bg-slate-50 text-center shadow-sm self-center sm:self-auto">
                  <img src={qrCodeUrl} alt="Verification QR Code" className="w-14 h-14 object-contain" />
                  <span className="text-[9px] text-slate-400 mt-1 block">Scan to Verify</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Prepared For:</span>
                  <div className="font-medium text-slate-800 mt-0.5">{getBriefDetails(selectedQuote.brief_id).full_name}</div>
                  <div className="text-xs text-slate-500">{getBriefDetails(selectedQuote.brief_id).email}</div>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Issued Date:</span>
                  <div className="font-medium text-slate-800 mt-0.5">{new Date(selectedQuote.created_at).toLocaleDateString()}</div>
                  <div className="text-xs text-coral-600 font-medium">Valid Until: {selectedQuote.valid_until || 'N/A'}</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[450px]">
                  <thead>
                    <tr className="border-b text-xs text-slate-400 uppercase">
                      <th className="py-2.5 w-10 font-medium">#</th>
                      <th className="py-2.5 font-medium">Service Description</th>
                      <th className="py-2.5 text-right font-medium">Amount ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {getLineItems(selectedQuote).map((item, index) => (
                      <tr key={index} className={item.isDiscount ? 'text-emerald-600 font-medium' : ''}>
                        <td className="py-3 font-mono text-slate-400">{index + 1}.</td>
                        <td className="py-3">{item.label}</td>
                        <td className="py-3 text-right">
                          {item.isDiscount ? `-$${Math.abs(item.amount).toFixed(2)}` : `$${item.amount.toFixed(2)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <div className="w-full sm:w-52 space-y-1.5 text-right">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Subtotal:</span>
                    <span>${(selectedQuote.subtotal ?? selectedQuote.total / 1.16).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>VAT (16%):</span>
                    <span>${(selectedQuote.tax ?? (selectedQuote.total - selectedQuote.total / 1.16)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-serif text-base sm:text-lg font-bold text-cocoa-700 border-t pt-1">
                    <span>Total:</span>
                    <span>${selectedQuote.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end pt-6 border-t mt-6 gap-6">
                <div className="w-full sm:max-w-xs">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Terms & Notes:</span>
                  <p className="text-xs text-slate-500 italic">{selectedQuote.notes || 'Standard booking terms apply. 50% deposit required.'}</p>
                </div>

                {/* Custom Stamp with Red Date Centered */}
                <div className="relative shrink-0 flex items-center justify-center">
                  <img 
                    src="/stamp.png" 
                    alt="Official Company Stamp" 
                    className="w-24 h-24 sm:w-28 sm:h-28 object-contain opacity-90 rotate-[-8deg] drop-shadow-sm" 
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none rotate-[-8deg]">
                    <span className="text-[10px] sm:text-[11px] font-bold text-red-600 tracking-tighter bg-white/60 px-1 py-0.5 rounded shadow-2xs">
                      {new Date(selectedQuote.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-4 sm:px-6 py-3 flex justify-end gap-3 border-t">
              <button onClick={() => setShowPreview(false)} className="btn-secondary text-xs">
                Close
              </button>
              <button 
                onClick={handleDownloadPDF} 
                disabled={isDownloading}
                className="btn-primary text-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <Download size={14} /> {isDownloading ? 'Generating PDF...' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}