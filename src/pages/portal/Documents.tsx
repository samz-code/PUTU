import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  Upload, 
  Search, 
  FileText, 
  Download, 
  Trash2, 
  AlertCircle, 
  Loader2, 
  X, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Eye,
  ExternalLink,
  FolderOpen
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';

function useCurrentUser() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return { user, authLoading };
}

export type DocStatus = 'Pending' | 'Verified' | 'Expired' | 'Rejected';

export interface CustomerDocumentRecord {
  id: string;
  user_id: string;
  type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  status: DocStatus;
  notes?: string;
  uploaded_at: string;
}

const CATEGORIES = ['All Types', 'Passport', 'Ticket', 'Invoice', 'Contract', 'Visa', 'Other'];

export default function Documents() {
  const { user, authLoading } = useCurrentUser();
  const [items, setItems] = useState<CustomerDocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Types');

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('Passport');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<CustomerDocumentRecord | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Fetch Documents
  const loadDocuments = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setItems((data as CustomerDocumentRecord[]) ?? []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      loadDocuments();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading, loadDocuments]);

  // Upload Logic
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFile) return;

    try {
      setUploading(true);
      setErrorMessage(null);

      const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${user.id}/${Date.now()}_${sanitizedName}`;

      const { error: storageError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (storageError) throw storageError;

      const { data: dbData, error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          type: uploadCategory,
          file_name: selectedFile.name,
          file_path: filePath,
          file_size: selectedFile.size,
          status: 'Pending'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setItems((prev) => [dbData as CustomerDocumentRecord, ...prev]);
      setShowUploadModal(false);
      setSelectedFile(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  // Preview Logic
  const handlePreview = async (doc: CustomerDocumentRecord) => {
    try {
      setLoadingPreview(true);
      setErrorMessage(null);
      setPreviewDoc(doc);

      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.file_path, 300);

      if (error) throw error;
      if (data?.signedUrl) setPreviewUrl(data.signedUrl);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate preview.');
      setPreviewDoc(null);
      setPreviewUrl(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Download Logic
  const handleDownload = async (filePath: string) => {
    try {
      setErrorMessage(null);
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 60);

      if (error) throw error;
      if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to download document.');
    }
  };

  // Delete Logic
  const handleDelete = async (doc: CustomerDocumentRecord) => {
    if (!window.confirm(`Are you sure you want to delete "${doc.file_name}"?`)) return;

    try {
      setDeletingId(doc.id);
      setErrorMessage(null);

      await supabase.storage.from('documents').remove([doc.file_path]);
      const { error: dbError } = await supabase.from('documents').delete().eq('id', doc.id);
      if (dbError) throw dbError;

      setItems((prev) => prev.filter((item) => item.id !== doc.id));
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete document.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = 
        item.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = 
        selectedCategory === 'All Types' || 
        item.type.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, selectedCategory]);

  const renderBadge = (status: DocStatus) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#DCFCE7] text-[#15803D]">
            <CheckCircle2 size={12} /> Verified
          </span>
        );
      case 'Expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            <XCircle size={12} /> Expired
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEE2E2] text-[#B91C1C]">
            <AlertCircle size={12} /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#B45309]">
            <Clock size={12} /> Pending
          </span>
        );
    }
  };

  const isImageFile = (filename: string) => /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(filename);
  const isPdfFile = (filename: string) => /\.pdf$/i.test(filename);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5 min-h-screen text-[#332219]">
      <PageHeader
        title="Travel Documents"
        subtitle="Manage passports, visas, bookings, and receipts in one secure location"
      />

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] flex items-center justify-between text-xs sm:text-sm shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="p-1 hover:opacity-75">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Brand Action Button */}
      <button
        onClick={() => setShowUploadModal(true)}
        className="w-full bg-[#F55361] hover:bg-[#e04452] text-white font-semibold py-3.5 px-6 rounded-xl text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99]"
      >
        <Upload size={18} />
        <span>Upload Document</span>
      </button>

      {/* Search Input */}
      <div className="relative w-full">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search documents by name or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-[#EBE5DF] rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#F55361] focus:border-transparent transition-all shadow-2xs text-[#332219] placeholder:text-slate-400"
        />
      </div>

      {/* CATEGORY TABS / DROPDOWN */}
      {/* Mobile Select View (< sm) */}
      <div className="block sm:hidden">
        <label className="block text-xs font-medium text-slate-500 mb-1">Filter Category</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full p-2.5 bg-white border border-[#EBE5DF] rounded-xl text-sm font-medium text-[#332219] focus:outline-hidden focus:ring-2 focus:ring-[#F55361]"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop Horizontal Chips (>= sm) */}
      <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-all shrink-0 ${
                isActive
                  ? 'bg-[#F55361] text-white shadow-xs'
                  : 'bg-[#F2ECE6] text-[#6B5A50] hover:bg-[#E8DFD7]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Document Records Display */}
      {loading || authLoading ? (
        <div className="bg-white rounded-2xl border border-[#EBE5DF] p-8 text-center text-sm text-slate-400 flex items-center justify-center gap-2 shadow-2xs">
          <Loader2 size={18} className="animate-spin text-[#0F766E]" />
          <span>Loading documents...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 sm:p-12 text-center text-sm text-slate-500 border-2 border-dashed border-[#EBE5DF] space-y-2">
          <FolderOpen size={44} className="mx-auto text-slate-300" />
          <p className="font-semibold text-[#332219] text-base">No documents found</p>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Try adjusting your search query or clear active category filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-[#EBE5DF] p-4 sm:p-5 space-y-3 shadow-2xs hover:border-[#D1C7BD] transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-[#E6F4F1] text-[#0F766E] shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-[#332219] text-sm sm:text-base truncate">
                      {doc.file_name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {doc.type} • {new Date(doc.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="shrink-0">{renderBadge(doc.status)}</div>
              </div>

              {doc.notes && (
                <p className="text-xs text-[#991B1B] bg-[#FEE2E2] p-2.5 rounded-lg">
                  Note: {doc.notes}
                </p>
              )}

              {/* Card Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#F5F0EB]">
                <button
                  onClick={() => handlePreview(doc)}
                  className="px-3 py-1.5 text-slate-600 hover:text-[#0F766E] hover:bg-[#E6F4F1] rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
                >
                  <Eye size={15} />
                  <span>View</span>
                </button>

                <button
                  onClick={() => handleDownload(doc.file_path)}
                  className="px-3 py-1.5 text-slate-600 hover:text-[#0F766E] hover:bg-[#E6F4F1] rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
                >
                  <Download size={15} />
                  <span>Download</span>
                </button>

                <button
                  onClick={() => handleDelete(doc)}
                  disabled={deletingId === doc.id}
                  className="p-1.5 text-[#F55361] hover:bg-[#FEE2E2] rounded-lg transition-colors disabled:opacity-50"
                  title="Delete Document"
                >
                  {deletingId === doc.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-xl border border-[#EBE5DF]">
            <div className="flex items-center justify-between border-b border-[#F5F0EB] pb-3">
              <h3 className="text-lg font-bold text-[#332219]">Upload Travel Document</h3>
              <button onClick={() => setShowUploadModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B5A50] uppercase mb-1">
                  Document Category
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-[#EBE5DF] rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#F55361]"
                >
                  {CATEGORIES.filter((c) => c !== 'All Types').map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B5A50] uppercase mb-1">
                  Select File
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#E6F4F1] file:text-[#0F766E] hover:file:bg-[#d0ece7]"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-[#6B5A50] bg-[#F2ECE6] hover:bg-[#E8DFD7] rounded-xl w-full sm:w-auto text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-[#F55361] hover:bg-[#e04452] rounded-xl w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <span>Confirm Upload</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-[#EBE5DF] flex items-center justify-between gap-2 bg-[#FAF8F5]">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText size={18} className="text-[#0F766E] shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-bold text-[#332219] text-sm sm:text-base truncate">
                    {previewDoc.file_name}
                  </h3>
                  <p className="text-xs text-slate-500">Category: {previewDoc.type}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDownload(previewDoc.file_path)}
                  className="bg-[#F55361] hover:bg-[#e04452] text-white font-semibold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Download</span>
                </button>
                <button
                  onClick={() => {
                    setPreviewDoc(null);
                    setPreviewUrl(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 bg-slate-100 overflow-auto flex items-center justify-center">
              {loadingPreview ? (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Loader2 size={20} className="animate-spin text-[#0F766E]" />
                  <span>Loading file preview...</span>
                </div>
              ) : previewUrl ? (
                isImageFile(previewDoc.file_name) ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt={previewDoc.file_name}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                    />
                  </div>
                ) : isPdfFile(previewDoc.file_name) ? (
                  <iframe
                    src={previewUrl}
                    title={previewDoc.file_name}
                    className="w-full h-full border-0 rounded-lg bg-white shadow-md"
                  />
                ) : (
                  <div className="text-center p-6 bg-white rounded-2xl shadow-xs max-w-sm border border-[#EBE5DF]">
                    <FileText size={48} className="mx-auto text-[#0F766E] mb-2" />
                    <h4 className="font-bold text-[#332219] text-sm mb-1">Inline Preview Unavailable</h4>
                    <p className="text-xs text-slate-500 mb-4">
                      This file type cannot be previewed directly in browser.
                    </p>
                    <button
                      onClick={() => window.open(previewUrl, '_blank')}
                      className="bg-[#0F766E] hover:bg-[#0c5e58] text-white font-semibold py-2 px-4 rounded-xl text-xs w-full inline-flex items-center justify-center gap-2"
                    >
                      <ExternalLink size={14} />
                      Open File Link
                    </button>
                  </div>
                )
              ) : (
                <p className="text-xs text-slate-400">Unable to render preview.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}