import { useEffect, useState } from 'react';
import { CreditCard, AlertCircle, CheckCircle, ExternalLink, ShieldCheck, Loader2, Download, FileText, Wallet, Receipt } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';

interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
  paid_at: string | null;
  booking_id: string;
  created_at?: string;
  transaction_code?: string;
}

interface Booking {
  id: string;
  reference: string;
  total_amount: number | null;
  paid_amount: number | null;
  status: string;
  destination?: string;
  created_at: string;
}

const TAX_RATE = 0.16; // 16% Value Added Tax / Regulatory Tax

export default function Payments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pesapal Integration & Checkout States
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [selectedMethod, setSelectedMethod] = useState<'mpesa' | 'card' | 'airtel' | 'pesapal_hosted'>('mpesa');
  const [processingPesapal, setProcessingPesapal] = useState(false);
  const [pesapalError, setPesapalError] = useState<string | null>(null);

  // Statement / Invoice Modal State
  const [activeTab, setActiveTab] = useState<'transactions' | 'invoices' | 'statement'>('transactions');
  const [selectedInvoice, setSelectedInvoice] = useState<Booking | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('bookings').select('*').eq('user_id', user.id),
    ]).then(([p, b]) => {
      if (p.error) setError('Unable to load payments. Please try again.');
      else {
        setPayments((p.data as Payment[]) ?? []);
        const fetchedBookings = (b.data as Booking[]) ?? [];
        setBookings(fetchedBookings);
        const unpaid = fetchedBookings.find(bk => ['Confirmed', 'Awaiting Payment'].includes(bk.status));
        if (unpaid) {
          setSelectedBookingId(unpaid.id);
          const base = unpaid.total_amount ?? 0;
          const totalWithTax = base * (1 + TAX_RATE);
          const remaining = totalWithTax - (unpaid.paid_amount ?? 0);
          setPayAmount(remaining > 0 ? Number(remaining.toFixed(2)) : '');
        }
      }
      setLoading(false);
    }).catch(() => {
      setError('Unable to load payments. Please try again.');
      setLoading(false);
    });
  }, [user]);

  const handleBookingSelect = (bId: string) => {
    setSelectedBookingId(bId);
    const target = bookings.find(b => b.id === bId);
    if (target) {
      const base = target.total_amount ?? 0;
      const totalWithTax = base * (1 + TAX_RATE);
      const remaining = totalWithTax - (target.paid_amount ?? 0);
      setPayAmount(remaining > 0 ? Number(remaining.toFixed(2)) : '');
    }
  };

  const handlePesapalCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId || !payAmount || Number(payAmount) <= 0) {
      setPesapalError('Please select a valid booking and amount to pay.');
      return;
    }

    try {
      setProcessingPesapal(true);
      setPesapalError(null);

      const targetBooking = bookings.find(b => b.id === selectedBookingId);

      const response = await fetch('/api/pesapal/submit-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: selectedBookingId,
          booking_reference: targetBooking?.reference,
          amount: Number(payAmount),
          currency: 'USD',
          payment_method: selectedMethod,
          email: user?.email,
          callback_url: `${window.location.origin}/payments?status=verified`,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.redirect_url) {
        throw new Error(result.error || 'Failed to initialize Pesapal payment session.');
      }

      window.location.href = result.redirect_url;
    } catch (err: any) {
      setPesapalError(err.message || 'An error occurred while connecting to Pesapal.');
      setProcessingPesapal(false);
    }
  };

  const totalPaid = payments.filter((p) => p.status === 'Completed').reduce((s, p) => s + Number(p.amount), 0);
  
  // Calculate totals factoring in the 16% tax rule across all bookings
  const totalBilledWithTax = bookings.reduce((s, b) => {
    const base = b.total_amount ?? 0;
    return s + (base * (1 + TAX_RATE));
  }, 0);

  const outstanding = bookings
    .filter((b) => ['Confirmed', 'Awaiting Payment'].includes(b.status))
    .reduce((s, b) => {
      const base = b.total_amount ?? 0;
      const totalWithTax = base * (1 + TAX_RATE);
      return s + (totalWithTax - (b.paid_amount ?? 0));
    }, 0);

  const bookingRefMap = new Map(bookings.map((b) => [b.id, b.reference]));

  const stats = [
    { label: 'Total Paid', value: `$${totalPaid.toLocaleString()}`, icon: CheckCircle, color: 'text-teal-500' },
    { label: 'Outstanding Balance (Inc. 16% Tax)', value: `$${outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: CreditCard, color: 'text-coral-500' },
    { label: 'Total Invoiced (Inc. 16% Tax)', value: `$${totalBilledWithTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: FileText, color: 'text-cocoa-500' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <PageHeader title="Financial Hub & Payments" subtitle="Manage payment methods, settle balances via Pesapal, and download 16% tax-compliant invoices and statements." />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500 font-medium">{s.label}</span>
              <s.icon size={18} className={s.color} />
            </div>
            <span className="font-serif text-xl sm:text-2xl font-semibold text-cocoa-700">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Pesapal Payment Gateway Section & Instructions */}
      {outstanding > 0 && (
        <div className="card p-6 border-coral-200 bg-coral-50/40 rounded-2xl shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-coral-600 shrink-0" />
            <span className="text-sm text-cocoa-700 font-medium">
              You have an active outstanding balance of <strong className="text-coral-700">${outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> (inclusive of standard 16% tax). Choose your payment method below to pay securely through Pesapal.
            </span>
          </div>

          {/* Supported Payment Methods Guide */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div 
              onClick={() => setSelectedMethod('mpesa')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedMethod === 'mpesa' ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-400/20' : 'bg-white border-slate-200 hover:border-slate-300'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-slate-900">M-Pesa Mobile Money</span>
                <Wallet size={16} className="text-teal-600" />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">Instant STK push prompt sent directly to your phone via Pesapal.</p>
            </div>

            <div 
              onClick={() => setSelectedMethod('card')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedMethod === 'card' ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-400/20' : 'bg-white border-slate-200 hover:border-slate-300'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-slate-900">Visa / MasterCard</span>
                <CreditCard size={16} className="text-indigo-600" />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">Secure global debit or credit card checkout through Pesapal gateway.</p>
            </div>

            <div 
              onClick={() => setSelectedMethod('pesapal_hosted')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedMethod === 'pesapal_hosted' ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400/20' : 'bg-white border-slate-200 hover:border-slate-300'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-slate-900">Other Regional Wallets</span>
                <ShieldCheck size={16} className="text-amber-600" />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">Airtel Money, Bank Transfers, and alternative Pesapal payment options.</p>
            </div>
          </div>

          {/* Checkout Form */}
          <form onSubmit={handlePesapalCheckout} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-teal-600" />
                <span className="font-bold text-slate-900 text-sm">Initiate Pesapal Secure Payment</span>
              </div>
              <span className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Method: {selectedMethod.replace('_', ' ')}</span>
            </div>

            {pesapalError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex justify-between items-center">
                <span>{pesapalError}</span>
                <button type="button" onClick={() => setPesapalError(null)} className="font-bold">✕</button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Booking / Itinerary</label>
                <select
                  value={selectedBookingId}
                  onChange={(e) => handleBookingSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                >
                  <option value="">-- Choose Booking --</option>
                  {bookings
                    .filter((b) => ['Confirmed', 'Awaiting Payment'].includes(b.status))
                    .map((b) => {
                      const base = b.total_amount ?? 0;
                      const withTax = base * (1 + TAX_RATE);
                      const balance = withTax - (b.paid_amount ?? 0);
                      return (
                        <option key={b.id} value={b.id}>
                          Ref: {b.reference} (Balance: ${balance.toFixed(2)} inc. 16% tax)
                        </option>
                      );
                    })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Amount ($)</label>
                <input
                  type="number"
                  min={1}
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Enter amount to pay"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={processingPesapal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs rounded-xl shadow-sm transition-colors disabled:opacity-50"
              >
                {processingPesapal ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Connecting to Pesapal Checkout...</span>
                  </>
                ) : (
                  <>
                    <ExternalLink size={15} />
                    <span>Proceed to Pesapal Secure Payment</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Navigation Tabs for Transactions, Invoices, & Account Statement */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-t border-x whitespace-nowrap ${
              activeTab === 'transactions' ? 'bg-white text-indigo-600 border-slate-200 shadow-sm' : 'text-slate-600 border-transparent hover:bg-slate-100'
            }`}
          >
            Transaction History ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-t border-x whitespace-nowrap ${
              activeTab === 'invoices' ? 'bg-white text-indigo-600 border-slate-200 shadow-sm' : 'text-slate-600 border-transparent hover:bg-slate-100'
            }`}
          >
            Booking Invoices ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('statement')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-t border-x whitespace-nowrap ${
              activeTab === 'statement' ? 'bg-white text-indigo-600 border-slate-200 shadow-sm' : 'text-slate-600 border-transparent hover:bg-slate-100'
            }`}
          >
            Account Statement
          </button>
        </div>

        {/* TAB 1: TRANSACTION HISTORY */}
        {activeTab === 'transactions' && (
          <div>
            {loading ? (
              <div className="p-6 text-base text-slate-400">Loading payment history...</div>
            ) : error ? (
              <div className="flex items-center gap-2 text-coral-600 p-6"><AlertCircle size={18} /><span>{error}</span></div>
            ) : payments.length === 0 ? (
              <div className="p-10 text-center">
                <CreditCard size={32} className="mx-auto text-slate-300 mb-3" />
                <p className="text-base text-slate-500 font-medium">No payments yet.</p>
                <p className="text-xs text-slate-400 mt-1">Completed transactions through Pesapal will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3">Method</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Booking Ref</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 font-semibold text-cocoa-700">${Number(p.amount).toFixed(2)}</td>
                        <td className="px-5 py-3 text-slate-600">{p.method}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wide border ${
                            p.status === 'Completed' ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-600 font-medium">{bookingRefMap.get(p.booking_id) ?? '-'}</td>
                        <td className="px-5 py-3 text-slate-500 text-xs">{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '-'}</td>
                        <td className="px-5 py-3 text-right">
                          <button 
                            onClick={() => alert(`Downloading payment receipt for transaction ID: ${p.id}`)}
                            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            <Download size={13} /> PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BOOKING INVOICES */}
        {activeTab === 'invoices' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Official Booking Invoices (Inclusive of 16% Tax)</span>
              <span className="text-xs text-slate-400">Click view for itemized tax breakdown</span>
            </div>
            {bookings.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No invoices available.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookings.map((b) => {
                  const bBase = b.total_amount ?? 0;
                  const bTax = bBase * TAX_RATE;
                  const bTotalWithTax = bBase + bTax;
                  const bPaid = b.paid_amount ?? 0;
                  const bDue = bTotalWithTax - bPaid;
                  return (
                    <div key={b.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-bold text-slate-900 text-sm">Ref: {b.reference}</span>
                          <p className="text-xs text-slate-500 mt-0.5">Destination: {b.destination || 'Custom Journey'}</p>
                        </div>
                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-700 uppercase">
                          {b.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg text-xs">
                        <div>
                          <span className="text-slate-400 block">Subtotal</span>
                          <span className="font-bold text-slate-800">${bBase.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">16% Tax</span>
                          <span className="font-bold text-slate-800">${bTax.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Total (Inc. Tax)</span>
                          <span className="font-bold text-indigo-600">${bTotalWithTax.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-slate-500">Balance Due: <strong className="text-coral-600">${bDue.toFixed(2)}</strong></span>
                        <button
                          onClick={() => setSelectedInvoice(b)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                        >
                          <FileText size={13} /> View Invoice
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ACCOUNT STATEMENT */}
        {activeTab === 'statement' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-base">Comprehensive Financial Statement</h4>
                <p className="text-xs text-slate-500 mt-0.5">Summary of all tax-inclusive invoices and Pesapal payment transactions.</p>
              </div>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-xl shadow-sm transition-colors"
              >
                <Download size={14} /> Download Statement PDF
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block uppercase font-semibold">Account Holder</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">{user?.email}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-semibold">Tax Compliance</span>
                <span className="font-bold text-teal-700 text-sm mt-0.5 flex items-center gap-1">
                  <Receipt size={14} /> 16% Regulatory Standard Applied
                </span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-semibold">Net Outstanding</span>
                <span className="font-bold text-coral-600 text-sm mt-0.5 block">${outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 uppercase tracking-wider text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Reference / Description</th>
                      <th className="px-4 py-3 text-right">Invoiced (inc. 16% tax)</th>
                      <th className="px-4 py-3 text-right">Paid (Cr)</th>
                      <th className="px-4 py-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {bookings.map((b) => {
                      const base = b.total_amount ?? 0;
                      const withTax = base * (1 + TAX_RATE);
                      const paid = b.paid_amount ?? 0;
                      const balance = withTax - paid;
                      return (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-500">{new Date(b.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900">Booking Invoice #{b.reference} (incl. 16% Tax)</td>
                          <td className="px-4 py-3 text-right text-slate-900">${withTax.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-teal-600">${paid.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right text-indigo-600">${balance.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Modal Preview */}
      {selectedInvoice && (() => {
        const base = selectedInvoice.total_amount ?? 0;
        const tax = base * TAX_RATE;
        const totalWithTax = base + tax;
        const paid = selectedInvoice.paid_amount ?? 0;
        const due = totalWithTax - paid;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 my-8">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Official Invoice #{selectedInvoice.reference}</h3>
                  <p className="text-xs text-slate-500">Compliant with 16% Standard Tax Regulation</p>
                </div>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs text-slate-700">
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-400 block uppercase">Destination</span>
                    <span className="font-semibold text-slate-900">{selectedInvoice.destination || 'Custom Itinerary'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase">Status</span>
                    <span className="font-semibold text-teal-700 uppercase">{selectedInvoice.status}</span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-b border-slate-200 py-3">
                  <div className="flex justify-between text-slate-600">
                    <span>Itinerary Subtotal:</span>
                    <span className="font-semibold text-slate-900">${base.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Standard Tax (16%):</span>
                    <span className="font-semibold text-slate-900">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-100">
                    <span>Total Amount (Inc. Tax):</span>
                    <span>${totalWithTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-teal-600">
                    <span>Amount Paid (Pesapal / Bank):</span>
                    <span className="font-semibold">${paid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-slate-100 font-bold text-coral-600">
                    <span>Balance Remaining:</span>
                    <span>${due.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => alert(`Downloading Tax-Inclusive Invoice PDF for #${selectedInvoice.reference}`)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Download size={14} /> Download Tax Invoice PDF
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}