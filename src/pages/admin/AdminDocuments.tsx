import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  FolderOpen, 
  Search, 
  Trash2, 
  Download, 
  FileText, 
  AlertCircle, 
  Loader2, 
  X,
  CheckCircle2,
  Clock,
  XCircle,
  Filter,
  User,
  Calendar,
  Eye,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';

export type DocStatus = 'Pending' | 'Verified' | 'Expired' | 'Rejected';

export interface AdminDocumentRecord {
  id: string;
  user_id: string;
  type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  status: DocStatus;
  notes?: string;
  uploaded_at: string;
  profiles?: {
    email?: string;
    full_name?: string;
  };
}

const STATUS_OPTIONS: DocStatus[] = ['Pending', 'Verified', 'Rejected', 'Expired'];

export default function AdminDocuments() {
  const [items, setItems] = useState<AdminDocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Notes Modal State
  const [selectedDocForNotes, setSelectedDocForNotes] = useState<AdminDocumentRecord | null>(null);
  const [adminNote, setAdminNote] = useState('');

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<AdminDocumentRecord | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // READ: Fetch all system documents joined with profile information
  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          profiles:user_id (
            email,
            full_name
          )
        `)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setItems((data as AdminDocumentRecord[]) ?? []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load system documents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // UPDATE: Change document status and optional note
  const handleStatusChange = async (docId: string, newStatus: DocStatus, note?: string) => {
    try {
      setUpdatingId(docId);
      setErrorMessage(null);

      const { error } = await supabase
        .from('documents')
        .update({ 
          status: newStatus,
          notes: note !== undefined ? note : undefined
        })
        .eq('id', docId);

      if (error) throw error;

      setItems((prev) =>
        prev.map((item) =>
          item.id === docId ? { ...item, status: newStatus, notes: note ?? item.notes } : item
        )
      );
      setSelectedDocForNotes(null);
      setAdminNote('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update document status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // PREVIEW: Generate temporary signed URL and open preview modal
  const handlePreview = async (doc: AdminDocumentRecord) => {
    try {
      setLoadingPreview(true);
      setErrorMessage(null);
      setPreviewDoc(doc);

      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.file_path, 300); // 5 min expiry

      if (error) {
        if (error.message?.includes('Object not found') || error.message?.includes('not_found')) {
          throw new Error('The file was not found in storage bucket. It may have been deleted directly or moved.');
        }
        throw error;
      }

      if (data?.signedUrl) {
        setPreviewUrl(data.signedUrl);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate preview URL.');
      setPreviewDoc(null);
      setPreviewUrl(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  // READ: Download File with graceful storage check
  const handleDownload = async (filePath: string) => {
    try {
      setErrorMessage(null);
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 60);

      if (error) {
        if (error.message?.includes('Object not found') || error.message?.includes('not_found')) {
          throw new Error('The file was not found in storage bucket. It may have been deleted directly or moved.');
        }
        throw error;
      }

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate download link.');
    }
  };

  // DELETE: Remove record from storage & DB
  const handleDelete = async (doc: AdminDocumentRecord) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${doc.file_name}"?`)) return;

    try {
      setDeletingId(doc.id);
      setErrorMessage(null);

      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([doc.file_path]);

      if (storageError && !storageError.message?.includes('Object not found')) {
        console.warn('Storage removal warning:', storageError.message);
      }

      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', doc.id);

      if (dbError) throw dbError;

      setItems((prev) => prev.filter((item) => item.id !== doc.id));
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete document.');
    } finally {
      setDeletingId(null);
    }
  };

  // Computed Filtered List
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = 
        item.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.profiles?.email && item.profiles.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.profiles?.full_name && item.profiles.full_name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, searchQuery, statusFilter]);

  const renderBadge = (status: DocStatus) => {
    switch (status) {
      case 'Verified':
        return <span className="badge-success gap-1 text-xs"><CheckCircle2 size={12} /> Verified</span>;
      case 'Expired':
        return <span className="badge-slate gap-1 text-xs"><XCircle size={12} /> Expired</span>;
      case 'Rejected':
        return <span className="badge-error gap-1 text-xs"><AlertCircle size={12} /> Rejected</span>;
      default:
        return <span className="badge-warning gap-1 text-xs"><Clock size={12} /> Pending</span>;
    }
  };

  // Helper to check file extension
  const isImageFile = (filename: string) => /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(filename);
  const isPdfFile = (filename: string) => /\.pdf$/i.test(filename);

  return (
    <div className="page-container px-4 sm:px-6 py-6 sm:py-8 space-y-6 min-h-screen text-cocoa-700">
      <PageHeader
        title="Document Management Center"
        subtitle="Review, verify, and manage all uploaded user documents across the system"
      />

      {errorMessage && (
        <div className="p-3.5 sm:p-4 rounded-lg bg-error-50 border border-error-200 text-error-700 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="p-1 hover:opacity-75">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user, email, file name, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto">
          <Filter size={16} className="text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input py-2.5 text-sm w-full sm:w-44"
          >
            <option value="All">All Statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="card-md p-8 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
          <Loader2 size={18} className="animate-spin text-teal-500" />
          <span>Loading documents...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card-md p-8 sm:p-12 text-center text-sm text-slate-500 space-y-2">
          <FolderOpen size={40} className="mx-auto text-slate-300" />
          <p className="font-semibold text-cocoa-700">No documents found</p>
          <p className="text-xs text-slate-400">Try adjusting your active filter terms.</p>
        </div>
      ) : (
        <>
          {/* MOBILE VIEW (< md breakpoint) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredItems.map((d) => (
              <div key={d.id} className="card-md p-4 space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-sand-200 pb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-2 rounded-full bg-slate-100 text-slate-600 shrink-0">
                      <User size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-cocoa-700 text-sm truncate">
                        {d.profiles?.full_name || 'Anonymous User'}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {d.profiles?.email || d.user_id.slice(0, 8)}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">{renderBadge(d.status)}</div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-medium text-cocoa-700 text-sm">
                    <FileText size={16} className="text-teal-600 shrink-0" />
                    <span className="truncate">{d.file_name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 pt-0.5">
                    <span className="bg-sand-100 px-2 py-0.5 rounded-sm font-medium text-cocoa-600">{d.type}</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(d.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                  {d.notes && (
                    <p className="text-xs text-error-700 bg-error-50 p-2 rounded-md mt-2">
                      Note: {d.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                  <select
                    value={d.status}
                    disabled={updatingId === d.id}
                    onChange={(e) => {
                      const newStatus = e.target.value as DocStatus;
                      if (newStatus === 'Rejected') {
                        setSelectedDocForNotes(d);
                      } else {
                        handleStatusChange(d.id, newStatus);
                      }
                    }}
                    className="text-xs px-2.5 py-1.5 rounded-md border border-slate-200 bg-white font-medium text-cocoa-700 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePreview(d)}
                      className="p-2 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
                      title="View Document Preview"
                    >
                      <Eye size={16} />
                    </button>

                    <button
                      onClick={() => handleDownload(d.file_path)}
                      className="p-2 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
                      title="Download File"
                    >
                      <Download size={16} />
                    </button>

                    <button
                      onClick={() => handleDelete(d)}
                      disabled={deletingId === d.id}
                      className="p-2 text-error-700 hover:bg-error-50 rounded-md transition-colors disabled:opacity-50"
                      title="Delete File"
                    >
                      {deletingId === d.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP VIEW (>= md breakpoint) */}
          <div className="card-md overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-sand-100 text-left text-xs uppercase tracking-wider text-cocoa-600 border-b border-sand-200">
                  <tr>
                    <th className="px-5 py-3 font-semibold">User / Owner</th>
                    <th className="px-5 py-3 font-semibold">File Name</th>
                    <th className="px-5 py-3 font-semibold">Category</th>
                    <th className="px-5 py-3 font-semibold">Uploaded</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-200">
                  {filteredItems.map((d) => (
                    <tr key={d.id} className="hover:bg-sand-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-full bg-slate-100 text-slate-600">
                            <User size={14} />
                          </div>
                          <div>
                            <div className="font-semibold text-cocoa-700">
                              {d.profiles?.full_name || 'Anonymous User'}
                            </div>
                            <div className="text-xs text-slate-500">
                              {d.profiles?.email || d.user_id.slice(0, 8)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-medium text-cocoa-700">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-teal-600" />
                          <span className="line-clamp-1">{d.file_name}</span>
                        </div>
                        {d.notes && (
                          <div className="text-xs text-error-700 mt-1">Note: {d.notes}</div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-600 font-medium">{d.type}</td>
                      <td className="px-5 py-4 text-slate-500 text-xs">
                        {new Date(d.uploaded_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {renderBadge(d.status)}
                          {updatingId === d.id && <Loader2 size={12} className="animate-spin text-slate-400" />}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={d.status}
                            disabled={updatingId === d.id}
                            onChange={(e) => {
                              const newStatus = e.target.value as DocStatus;
                              if (newStatus === 'Rejected') {
                                setSelectedDocForNotes(d);
                              } else {
                                handleStatusChange(d.id, newStatus);
                              }
                            }}
                            className="text-xs px-2 py-1 rounded-md border border-slate-200 bg-white font-medium focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                          >
                            {STATUS_OPTIONS.map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>

                          <button
                            onClick={() => handlePreview(d)}
                            className="p-1.5 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
                            title="View Document Preview"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            onClick={() => handleDownload(d.file_path)}
                            className="p-1.5 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-colors"
                            title="Download File"
                          >
                            <Download size={15} />
                          </button>

                          <button
                            onClick={() => handleDelete(d)}
                            disabled={deletingId === d.id}
                            className="p-1.5 text-error-700 hover:bg-error-50 rounded-md transition-colors disabled:opacity-50"
                            title="Delete File"
                          >
                            {deletingId === d.id ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <Trash2 size={15} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50">
          <div className="card-md max-w-3xl w-full h-[85vh] flex flex-col bg-white overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-sand-200 flex items-center justify-between gap-2 bg-sand-50">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={18} className="text-teal-600 shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-semibold text-cocoa-700 text-sm sm:text-base truncate">
                    {previewDoc.file_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Category: {previewDoc.type} • Owner: {previewDoc.profiles?.full_name || 'Anonymous'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDownload(previewDoc.file_path)}
                  className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Download</span>
                </button>
                <button
                  onClick={() => {
                    setPreviewDoc(null);
                    setPreviewUrl(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body / Viewer */}
            <div className="flex-1 p-4 bg-slate-100 overflow-auto flex items-center justify-center">
              {loadingPreview ? (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Loader2 size={20} className="animate-spin text-teal-600" />
                  <span>Loading file preview...</span>
                </div>
              ) : previewUrl ? (
                isImageFile(previewDoc.file_name) ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt={previewDoc.file_name}
                      className="max-w-full max-h-full object-contain rounded-md shadow-md"
                    />
                  </div>
                ) : isPdfFile(previewDoc.file_name) ? (
                  <iframe
                    src={previewUrl}
                    title={previewDoc.file_name}
                    className="w-full h-full border-0 rounded-md bg-white shadow-md"
                  />
                ) : (
                  <div className="text-center p-6 bg-white rounded-xl shadow-xs max-w-sm border border-slate-200">
                    <FileText size={48} className="mx-auto text-teal-600 mb-2" />
                    <h4 className="font-semibold text-cocoa-700 text-sm mb-1">
                      Inline Preview Unavailable
                    </h4>
                    <p className="text-xs text-slate-500 mb-4">
                      This file type cannot be previewed directly in the browser. You can download or open it in an external application.
                    </p>
                    <button
                      onClick={() => window.open(previewUrl, '_blank')}
                      className="btn-teal py-2 px-4 text-xs w-full justify-center"
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

      {/* Rejection Notes Modal */}
      {selectedDocForNotes && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="card-md p-5 sm:p-6 max-w-md w-full space-y-4">
            <h3 className="font-serif text-lg font-semibold text-cocoa-700">Reason for Rejection</h3>
            <p className="text-xs text-slate-500">
              Provide a clear reason for rejecting "{selectedDocForNotes.file_name}" so the user can re-upload.
            </p>
            <textarea
              rows={3}
              className="input text-sm"
              placeholder="e.g. Image quality too low, document expired..."
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
            />
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedDocForNotes(null)}
                className="btn-secondary py-2 px-4 text-xs w-full sm:w-auto justify-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange(selectedDocForNotes.id, 'Rejected', adminNote)}
                className="btn-primary py-2 px-4 text-xs bg-error-700 hover:bg-error-700 w-full sm:w-auto justify-center"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}