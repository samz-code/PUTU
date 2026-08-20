import { useState, useEffect } from 'react';
import {
  Search, Plus, Trash2, Edit3, Eye, CheckCircle2, AlertTriangle,
  X, User, RefreshCw, Save, Calendar, Filter, MapPin, Sparkles, DollarSign
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface JourneyBrief {
  id: string;
  user_id?: string;
  full_name: string;
  email: string;
  phone: string;
  nationality: string;
  num_guests: number;
  guest_breakdown: { adults: number; children: number };
  occasion: string;
  arrival_date: string | null;
  departure_date: string | null;
  flexible_dates: boolean;
  arrival_point: string;
  departure_point: string;
  destinations: string[];
  accommodation: { propertyTypes: string[]; mealPlan: string; amenities: string[] };
  transport: { vehicleTypes: string[]; driverStyle: string; features: string[] };
  experiences: string[];
  dining: { options: string[]; dietary: string[] };
  special_requests: string[];
  custom_notes: string | null;
  budget: { tier: string; paymentMethod: string };
  status: string;
  created_at: string;
}

const statusOptions = ['Submitted', 'In Review', 'Itinerary Sent', 'Confirmed', 'Completed', 'Cancelled'];

export default function AdminPlanner() {
  const [briefs, setBriefs] = useState<JourneyBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Modal & View States
  const [selectedBrief, setSelectedBrief] = useState<JourneyBrief | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Custom Delete Confirmation State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Feedback Messages
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<JourneyBrief>>({
    full_name: '',
    email: '',
    phone: '',
    nationality: 'Kenyan',
    num_guests: 2,
    occasion: 'Anniversary',
    status: 'Submitted',
    custom_notes: '',
  });

  useEffect(() => {
    fetchBriefs();
  }, []);

  const fetchBriefs = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from('journey_briefs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBriefs(data || []);
    } catch (err: any) {
      console.error('Error fetching briefs:', err);
      setErrorMsg(err.message || 'Failed to load journey briefs.');
    } finally {
      setLoading(false);
    }
  };

  // DELETE Operation Triggered via Custom Modal
  const confirmDelete = async () => {
    if (!deleteId) return;
    setErrorMsg(null);
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('journey_briefs').delete().eq('id', deleteId);
      if (error) throw error;
      setBriefs(briefs.filter((b) => b.id !== deleteId));
      setSuccessMsg('Journey brief deleted successfully.');
      if (selectedBrief?.id === deleteId) setSelectedBrief(null);
      setDeleteId(null);
    } catch (err: any) {
      console.error('Error deleting brief:', err);
      setErrorMsg(err.message || 'Failed to delete record.');
    } finally {
      setIsDeleting(false);
    }
  };

  // UPDATE Operation
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrief) return;
    setErrorMsg(null);
    try {
      const { error } = await supabase
        .from('journey_briefs')
        .update({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          status: formData.status,
          custom_notes: formData.custom_notes,
          num_guests: formData.num_guests,
          occasion: formData.occasion,
        })
        .eq('id', selectedBrief.id);

      if (error) throw error;

      setBriefs(
        briefs.map((b) => (b.id === selectedBrief.id ? ({ ...b, ...formData } as JourneyBrief) : b))
      );
      setSuccessMsg('Journey brief updated successfully.');
      setIsEditing(false);
      setSelectedBrief(null);
    } catch (err: any) {
      console.error('Error updating brief:', err);
      setErrorMsg(err.message || 'Failed to update record.');
    }
  };

  // CREATE Operation
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const newEntry = {
        full_name: formData.full_name || 'Valued Guest',
        email: formData.email || null,
        phone: formData.phone || null,
        nationality: formData.nationality || 'Kenyan',
        num_guests: Number(formData.num_guests) || 2,
        guest_breakdown: { adults: Number(formData.num_guests) || 2, children: 0 },
        occasion: formData.occasion || 'Luxury Holiday',
        arrival_date: null,
        departure_date: null,
        flexible_dates: true,
        arrival_point: 'Jomo Kenyatta Int. Airport (NBO)',
        departure_point: 'Jomo Kenyatta Int. Airport (NBO)',
        destinations: ['Masai Mara', 'Diani Beach'],
        accommodation: { propertyTypes: ['Luxury Safari Lodge'], mealPlan: 'Full Board', amenities: [] },
        transport: { vehicleTypes: ['4x4 Land Cruiser Safari Jeep'], driverStyle: 'Professional Guide Chauffeur', features: [] },
        experiences: ['Game Drives', 'Sunset Cocktail'],
        dining: { options: ['Bush Dinner'], dietary: [] },
        special_requests: [],
        custom_notes: formData.custom_notes || null,
        budget: { tier: 'Elevated Comfort ($3,500 - $7,000)', paymentMethod: 'Bank Transfer' },
        status: formData.status || 'Submitted',
      };

      const { data, error } = await supabase.from('journey_briefs').insert([newEntry]).select();
      if (error) throw error;

      if (data) {
        setBriefs([data[0], ...briefs]);
      }
      setSuccessMsg('New journey brief created successfully.');
      setIsCreating(false);
      setFormData({ full_name: '', email: '', phone: '', status: 'Submitted' });
    } catch (err: any) {
      console.error('Error creating brief:', err);
      setErrorMsg(err.message || 'Failed to create record.');
    }
  };

  // Filter List Logic
  const filteredBriefs = briefs.filter((b) => {
    const matchesSearch =
      b.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.destinations?.some((d) => d.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/85 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-[#4274d9]/10 text-[#4274d9] text-[10px] font-bold tracking-wider uppercase rounded-full border border-[#4274d9]/25">
              Concierge CRM
            </span>
            <span className="text-slate-400 text-xs hidden sm:inline">• Client Itinerary Briefs</span>
          </div>
          <h1 className="font-serif text-xl sm:text-2xl font-semibold text-slate-900">Journey Planner Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Review incoming custom safari & expedition submissions, track status changes, and manage client preferences.
          </p>
        </div>
        
        <div className="flex items-center gap-2.5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <button
            onClick={fetchBriefs}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={() => {
              setFormData({ full_name: '', email: '', phone: '', status: 'Submitted', nationality: 'Kenyan', num_guests: 2 });
              setIsCreating(true);
            }}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#4274d9] hover:bg-[#3561bd] text-white text-xs font-medium rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} /> New Brief
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={18} />
            <p className="text-xs sm:text-sm text-red-700">{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-800"><X size={16} /></button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="text-teal-600 shrink-0 mt-0.5" size={18} />
            <p className="text-xs sm:text-sm text-teal-700">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-teal-500 hover:text-teal-800"><X size={16} /></button>
        </div>
      )}

      {/* Quick Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/85 shadow-xs">
          <span className="text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider block">Total Briefs</span>
          <span className="font-serif text-xl sm:text-2xl font-semibold text-slate-900 mt-1 block">{briefs.length}</span>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/85 shadow-xs">
          <span className="text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider block">Needs Review</span>
          <span className="font-serif text-xl sm:text-2xl font-semibold text-[#f26b5e] mt-1 block">
            {briefs.filter((b) => b.status === 'Submitted' || b.status === 'In Review').length}
          </span>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/85 shadow-xs">
          <span className="text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider block">Confirmed</span>
          <span className="font-serif text-xl sm:text-2xl font-semibold text-[#17b5b1] mt-1 block">
            {briefs.filter((b) => b.status === 'Confirmed').length}
          </span>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/85 shadow-xs">
          <span className="text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider block">Completed</span>
          <span className="font-serif text-xl sm:text-2xl font-semibold text-slate-900 mt-1 block">
            {briefs.filter((b) => b.status === 'Completed').length}
          </span>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/85 shadow-xs flex flex-col gap-3">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or destination..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#4274d9]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <Filter size={14} className="text-slate-400 shrink-0 ml-0.5" />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider shrink-0">Status:</span>
          {['All', ...statusOptions].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                statusFilter === status
                  ? 'bg-[#4274d9] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/85 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading journey briefs...</div>
        ) : filteredBriefs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No journey briefs found matching your search criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5 sm:p-4">Client Contact</th>
                  <th className="p-3.5 sm:p-4">Occasion & Guests</th>
                  <th className="p-3.5 sm:p-4">Destinations</th>
                  <th className="p-3.5 sm:p-4">Status</th>
                  <th className="p-3.5 sm:p-4">Submitted Date</th>
                  <th className="p-3.5 sm:p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBriefs.map((brief) => (
                  <tr key={brief.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3.5 sm:p-4">
                      <span className="font-semibold text-slate-900 block">{brief.full_name || 'Valued Guest'}</span>
                      <span className="text-slate-400 text-[11px] block">{brief.email || 'No email provided'}</span>
                      <span className="text-slate-400 text-[11px] block">{brief.phone || 'No phone'}</span>
                    </td>
                    <td className="p-3.5 sm:p-4">
                      <span className="font-medium text-slate-800 block">{brief.occasion || 'Holiday'}</span>
                      <span className="text-slate-400 text-[11px] block">{brief.num_guests} Guests ({brief.nationality})</span>
                    </td>
                    <td className="p-3.5 sm:p-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {brief.destinations?.length > 0 ? (
                          brief.destinations.map((d, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] rounded-md font-medium">
                              {d}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-[11px]">Custom Itinerary</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 sm:p-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                          brief.status === 'Confirmed'
                            ? 'bg-[#17b5b1]/10 text-[#17b5b1] border border-[#17b5b1]/20'
                            : brief.status === 'In Review'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : brief.status === 'Completed'
                            ? 'bg-slate-100 text-slate-700 border border-slate-200'
                            : 'bg-[#4274d9]/10 text-[#4274d9] border border-[#4274d9]/20'
                        }`}
                      >
                        {brief.status}
                      </span>
                    </td>
                    <td className="p-3.5 sm:p-4 text-slate-500 text-[11px]">
                      {new Date(brief.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="p-3.5 sm:p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedBrief(brief)}
                          title="View Full Specification"
                          className="p-2 rounded-xl bg-slate-50 hover:bg-[#4274d9]/10 text-slate-600 hover:text-[#4274d9] transition-all border border-slate-200/60"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBrief(brief);
                            setFormData(brief);
                            setIsEditing(true);
                          }}
                          title="Edit Record"
                          className="p-2 rounded-xl bg-slate-50 hover:bg-[#17b5b1]/10 text-slate-600 hover:text-[#17b5b1] transition-all border border-slate-200/60"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteId(brief.id)}
                          title="Delete Record"
                          className="p-2 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 transition-all border border-slate-200/60"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-fade-in">
            <button
              onClick={() => setDeleteId(null)}
              disabled={isDeleting}
              className="absolute right-4 top-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold text-slate-950">Delete Journey Brief</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                  Are you certain you want to delete this journey brief? This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-xl hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-red-600 text-white text-xs font-medium rounded-xl hover:bg-red-500 shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Yes, Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {selectedBrief && !isEditing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl border border-slate-200 my-4 sm:my-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedBrief(null)}
              className="absolute right-4 top-4 sm:right-5 sm:top-5 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-6 pr-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#4274d9]/10 border border-[#4274d9]/20 flex items-center justify-center text-[#4274d9] shrink-0">
                <User size={20} />
              </div>
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold text-[#4274d9] uppercase tracking-wider">Client Itinerary Specification</span>
                <h2 className="font-serif text-lg sm:text-2xl font-semibold text-slate-900">{selectedBrief.full_name}</h2>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-600">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
                <div><strong className="text-slate-900">Email:</strong> {selectedBrief.email || 'N/A'}</div>
                <div><strong className="text-slate-900">Phone:</strong> {selectedBrief.phone || 'N/A'}</div>
                <div><strong className="text-slate-900">Nationality:</strong> {selectedBrief.nationality}</div>
                <div><strong className="text-slate-900">Party Size:</strong> {selectedBrief.num_guests} Guests</div>
                <div><strong className="text-slate-900">Occasion:</strong> {selectedBrief.occasion}</div>
                <div><strong className="text-slate-900">Status:</strong> <span className="text-[#4274d9] font-bold">{selectedBrief.status}</span></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
                <div><strong className="text-slate-900">Arrival Date:</strong> {selectedBrief.arrival_date || 'Flexible'}</div>
                <div><strong className="text-slate-900">Departure Date:</strong> {selectedBrief.departure_date || 'Flexible'}</div>
                <div><strong className="text-slate-900">Arrival Point:</strong> {selectedBrief.arrival_point}</div>
                <div><strong className="text-slate-900">Departure Point:</strong> {selectedBrief.departure_point}</div>
              </div>

              <div className="p-3.5 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2">
                <div><strong className="text-slate-900">Destinations:</strong> {selectedBrief.destinations?.join(', ') || 'None'}</div>
                <div><strong className="text-slate-900">Property Styles:</strong> {selectedBrief.accommodation?.propertyTypes?.join(', ') || 'None'}</div>
                <div><strong className="text-slate-900">Meal Plan:</strong> {selectedBrief.accommodation?.mealPlan || 'None'}</div>
                <div><strong className="text-slate-900">Fleet Class:</strong> {selectedBrief.transport?.vehicleTypes?.join(', ') || 'None'}</div>
                <div><strong className="text-slate-900">Experiences:</strong> {selectedBrief.experiences?.join(', ') || 'None'}</div>
                <div><strong className="text-slate-900">Budget Tier:</strong> {selectedBrief.budget?.tier || 'N/A'}</div>
              </div>

              {selectedBrief.custom_notes && (
                <div className="p-3.5 sm:p-4 bg-amber-50/50 rounded-2xl border border-amber-200/60">
                  <strong className="text-amber-900 block mb-1">Custom Notes / Client Requests:</strong>
                  <p className="text-slate-700 italic">{selectedBrief.custom_notes}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedBrief(null)}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-xl hover:bg-slate-200 transition-all text-center"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setFormData(selectedBrief);
                  setIsEditing(true);
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#4274d9] text-white text-xs font-medium rounded-xl hover:bg-[#3561bd] transition-all text-center"
              >
                Edit Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditing && selectedBrief && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <form onSubmit={handleUpdate} className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-8 shadow-2xl border border-slate-200 my-4 sm:my-8 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setSelectedBrief(null);
              }}
              className="absolute right-4 top-4 sm:right-5 sm:top-5 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900"
            >
              <X size={18} />
            </button>

            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-slate-900 mb-6 pr-8">Edit Journey Brief</h2>

            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-600 uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  className="w-full rounded-xl p-2.5 border border-slate-200 focus:outline-none focus:border-[#4274d9]"
                  value={formData.full_name || ''}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-600 uppercase tracking-wider mb-1.5">Email</label>
                  <input
                    type="email"
                    className="w-full rounded-xl p-2.5 border border-slate-200 focus:outline-none focus:border-[#4274d9]"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 uppercase tracking-wider mb-1.5">Phone / WhatsApp</label>
                  <input
                    className="w-full rounded-xl p-2.5 border border-slate-200 focus:outline-none focus:border-[#4274d9]"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-600 uppercase tracking-wider mb-1.5">Occasion</label>
                  <input
                    className="w-full rounded-xl p-2.5 border border-slate-200 focus:outline-none focus:border-[#4274d9]"
                    value={formData.occasion || ''}
                    onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    className="w-full rounded-xl p-2.5 border border-slate-200 bg-white focus:outline-none focus:border-[#4274d9]"
                    value={formData.status || 'Submitted'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-600 uppercase tracking-wider mb-1.5">Custom Notes</label>
                <textarea
                  rows={3}
                  className="w-full rounded-xl p-2.5 border border-slate-200 focus:outline-none focus:border-[#4274d9]"
                  value={formData.custom_notes || ''}
                  onChange={(e) => setFormData({ ...formData, custom_notes: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedBrief(null);
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-xl hover:bg-slate-200 transition-all text-center"
              >
                Cancel
              </button>
              <button type="submit" className="w-full sm:w-auto px-6 py-2.5 bg-[#4274d9] text-white text-xs font-medium rounded-xl hover:bg-[#3561bd] transition-all flex items-center justify-center gap-2">
                <Save size={15} /> Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE MODAL */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <form onSubmit={handleCreate} className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-8 shadow-2xl border border-slate-200 my-4 sm:my-8 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="absolute right-4 top-4 sm:right-5 sm:top-5 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900"
            >
              <X size={18} />
            </button>

            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-slate-900 mb-6 pr-8">Create New Journey Brief</h2>

            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-600 uppercase tracking-wider mb-1.5">Client Full Name *</label>
                <input
                  className="w-full rounded-xl p-2.5 border border-slate-200 focus:outline-none focus:border-[#4274d9]"
                  placeholder="e.g. David Smith"
                  value={formData.full_name || ''}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-600 uppercase tracking-wider mb-1.5">Email</label>
                  <input
                    type="email"
                    className="w-full rounded-xl p-2.5 border border-slate-200 focus:outline-none focus:border-[#4274d9]"
                    placeholder="david@example.com"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 uppercase tracking-wider mb-1.5">Phone / WhatsApp</label>
                  <input
                    className="w-full rounded-xl p-2.5 border border-slate-200 focus:outline-none focus:border-[#4274d9]"
                    placeholder="+254 7..."
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-600 uppercase tracking-wider mb-1.5">Occasion</label>
                  <input
                    className="w-full rounded-xl p-2.5 border border-slate-200 focus:outline-none focus:border-[#4274d9]"
                    placeholder="Honeymoon / Safari"
                    value={formData.occasion || ''}
                    onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 uppercase tracking-wider mb-1.5">Initial Status</label>
                  <select
                    className="w-full rounded-xl p-2.5 border border-slate-200 bg-white focus:outline-none focus:border-[#4274d9]"
                    value={formData.status || 'Submitted'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-600 uppercase tracking-wider mb-1.5">Concierge Notes</label>
                <textarea
                  rows={3}
                  className="w-full rounded-xl p-2.5 border border-slate-200 focus:outline-none focus:border-[#4274d9]"
                  placeholder="Initial guest preferences or notes..."
                  value={formData.custom_notes || ''}
                  onChange={(e) => setFormData({ ...formData, custom_notes: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-xl hover:bg-slate-200 transition-all text-center"
              >
                Cancel
              </button>
              <button type="submit" className="w-full sm:w-auto px-6 py-2.5 bg-[#4274d9] text-white text-xs font-medium rounded-xl hover:bg-[#3561bd] transition-all flex items-center justify-center gap-2">
                <Plus size={15} /> Create Brief
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}