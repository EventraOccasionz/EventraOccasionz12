import React, { useState, useEffect } from 'react';
import { UploadedDocument, VerificationStatus } from '../../types';
import { dataService } from '../../lib/dataService';
import { 
  FileText, Download, Eye, Trash2, Search, ExternalLink, 
  Users, CheckCircle, ShieldAlert, X, AlertCircle, Loader2,
  Filter, Check, XCircle, Clock
} from 'lucide-react';

interface DocumentsTabProps {
  selectedEventId: string;
  onRefresh: () => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}

export default function DocumentsTab({
  selectedEventId,
  onRefresh,
  showToast
}: DocumentsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [previewDoc, setPreviewDoc] = useState<UploadedDocument | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | 'All'>('All');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState<UploadedDocument | null>(null);
  const [statusNotes, setStatusNotes] = useState('');

  const fetchDocuments = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const docs = await dataService.getGuestDocuments(selectedEventId);
      setDocuments(docs);
    } catch (err) {
      console.error('Error fetching documents:', err);
      showToast('error', 'Failed to fetch guest documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedEventId]);

  const handleDelete = async () => {
    if (!deletingDocId) return;

    try {
      await dataService.deleteGuestDocument(deletingDocId);
      showToast('success', 'Document deleted permanently.');
      setDeletingDocId(null);
      fetchDocuments();
    } catch (err: any) {
      showToast('error', `Failed to delete document: ${err?.message || err}`);
    }
  };

  const handleUpdateStatus = async (docId: string, status: VerificationStatus) => {
    setIsUpdating(true);
    try {
      await dataService.updateDocumentStatus(docId, status, statusNotes);
      showToast('success', `Document marked as ${status}.`);
      setShowStatusModal(null);
      setStatusNotes('');
      fetchDocuments();
    } catch (err: any) {
      showToast('error', `Status update failed: ${err?.message || err}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      (doc.family_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = statusFilter === 'All' || doc.verification_status === statusFilter;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status?: VerificationStatus) => {
    switch (status) {
      case 'Verified': return <CheckCircle className="text-green-400" size={14} />;
      case 'Rejected': return <XCircle className="text-red-400" size={14} />;
      case 'Pending':
      default: return <Clock className="text-amber-400" size={14} />;
    }
  };

  const getStatusBadgeClass = (status?: VerificationStatus) => {
    switch (status) {
      case 'Verified': return 'bg-green-400/10 text-green-400 border-green-400/20';
      case 'Rejected': return 'bg-red-400/10 text-red-400 border-red-400/20';
      case 'Pending':
      default: return 'bg-amber-400/10 text-amber-400 border-amber-400/20';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-gold" size={40} />
        <p className="text-xs text-gold uppercase tracking-[0.2em] font-mono">Loading document records...</p>
      </div>
    );
  }

  return (
    <div id="admin-documents-section" className="space-y-6">
      
      {/* Stats Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-gold/10 border border-gold/20 text-gold rounded-lg">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-[10px] text-text-secondary uppercase tracking-widest font-mono">Total Uploaded</p>
            <p className="text-xl font-serif text-cream font-bold mt-1">{documents.length}</p>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] text-text-secondary uppercase tracking-widest font-mono">Verified Passes</p>
            <p className="text-xl font-serif text-green-400 font-bold mt-1">
              {documents.filter(d => d.verification_status === 'Verified').length}
            </p>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] text-text-secondary uppercase tracking-widest font-mono">Pending Review</p>
            <p className="text-xl font-serif text-amber-400 font-bold mt-1">
              {documents.filter(d => d.verification_status === 'Pending' || !d.verification_status).length}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input
              id="admin-docs-search-input"
              type="text"
              placeholder="Search by family or filename..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-cream placeholder-white/30 focus:outline-none focus:border-gold/50 transition-all font-sans"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={14} className="text-gold/60" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-cream focus:outline-none focus:border-gold/50 transition-all font-sans w-full sm:w-auto appearance-none"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Verified">Verified</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <p className="text-[10px] text-[#D4AF37]/60 font-mono">
          Showing {filteredDocuments.length} of {documents.length} documents for this event
        </p>
      </div>

      {/* Documents Table */}
      <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.01]">
        <table id="admin-documents-table" className="w-full border-collapse min-w-[900px]">
          <thead className="text-[0.6rem] text-gold uppercase tracking-[0.2em] border-b border-gold/10 bg-black/20">
            <tr>
              <th className="text-left py-4 px-5">Guest Family</th>
              <th className="text-left py-4 px-5">Document Name</th>
              <th className="text-left py-4 px-5">File Details</th>
              <th className="text-left py-4 px-5">Status</th>
              <th className="text-left py-4 px-5">Uploaded Date</th>
              <th className="text-right py-4 px-5">Actions</th>
            </tr>
          </thead>
          <tbody className="text-xs text-text-secondary">
            {filteredDocuments.map((doc) => (
              <tr key={doc.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="py-4 px-5">
                  <p className="text-cream font-semibold">{doc.family_name || 'Guest'}</p>
                  <p className="text-[9px] font-mono text-white/20 mt-0.5">{doc.family_id}</p>
                </td>
                <td className="py-4 px-5">
                  <div className="flex items-center gap-2 max-w-[200px]">
                    <FileText size={16} className="text-gold flex-shrink-0" />
                    <span className="truncate text-white/80" title={doc.name}>{doc.name}</span>
                  </div>
                </td>
                <td className="py-4 px-5 font-mono text-[10px] text-text-secondary/80">
                  <span className="bg-white/5 border border-white/5 px-2 py-0.5 rounded mr-1.5 uppercase tracking-wider text-[8px]">
                    {doc.type.split('/')[1] || doc.type}
                  </span>
                  <span>{formatSize(doc.size)}</span>
                </td>
                <td className="py-4 px-5">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold uppercase tracking-wider ${getStatusBadgeClass(doc.verification_status)}`}>
                    {getStatusIcon(doc.verification_status)}
                    {doc.verification_status || 'Pending'}
                  </div>
                </td>
                <td className="py-4 px-5 font-sans text-xs">
                  {doc.uploaded_at 
                    ? new Date(doc.uploaded_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                    : 'N/A'
                  }
                </td>
                <td className="py-4 px-5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Status Change Trigger */}
                    <button
                      onClick={() => {
                        setShowStatusModal(doc);
                        setStatusNotes(doc.notes || '');
                      }}
                      className="p-2 bg-white/5 hover:bg-gold/10 border border-white/5 hover:border-gold/20 rounded-lg text-gold transition-colors"
                      title="Update Status"
                    >
                      <CheckCircle size={14} />
                    </button>

                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="p-2 bg-white/5 hover:bg-gold/10 border border-white/5 hover:border-gold/20 rounded-lg text-gold transition-colors"
                      title="Preview Document"
                    >
                      <Eye size={14} />
                    </button>

                    <a
                      href={doc.url}
                      download={doc.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/5 hover:bg-gold/10 border border-white/5 hover:border-gold/20 rounded-lg text-gold transition-colors flex items-center justify-center"
                      title="Download File"
                    >
                      <Download size={14} />
                    </a>

                    <button
                      onClick={() => setDeletingDocId(doc.id)}
                      className="p-2 bg-white/5 hover:bg-red-950/30 border border-white/5 hover:border-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                      title="Delete Document"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredDocuments.length === 0 && (
              <tr>
                <td colSpan={6} className="py-24 text-center text-text-secondary uppercase tracking-widest opacity-40">
                  {searchTerm ? 'No matching documents found' : 'No documents have been uploaded yet for this event.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Verification Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-[5000] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl text-cream">Review Document</h3>
              <button onClick={() => setShowStatusModal(null)} className="text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-black/40 border border-white/5 rounded-xl">
                <p className="text-[10px] text-white/40 uppercase font-mono mb-1">Document</p>
                <p className="text-sm text-cream font-medium truncate">{showStatusModal.name}</p>
                <p className="text-[10px] text-gold mt-1">Uploaded by: {showStatusModal.family_name}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-white/40 uppercase font-mono px-1">Internal Notes / Feedback</label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Reason for rejection or verification notes..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-cream outline-none focus:border-gold/50 min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus(showStatusModal.id, 'Verified')}
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  <Check size={16} /> Verify Pass
                </button>
                <button
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus(showStatusModal.id, 'Rejected')}
                  className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  <X size={16} /> Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-[4000] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-[#121212] border border-white/10 rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/40">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-gold" />
                <div>
                  <h3 className="text-sm font-serif font-semibold text-cream">{previewDoc.name}</h3>
                  <p className="text-[10px] text-text-secondary">Uploaded for {previewDoc.family_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mr-8">
                <div className={`px-2.5 py-1 rounded-full border text-[9px] font-mono font-bold uppercase tracking-wider ${getStatusBadgeClass(previewDoc.verification_status)}`}>
                  Status: {previewDoc.verification_status || 'Pending'}
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-6 flex flex-col items-center justify-center bg-black/40 min-h-[300px]">
              {previewDoc.type.startsWith('image/') ? (
                <img 
                  src={previewDoc.url} 
                  alt={previewDoc.name} 
                  className="max-w-full max-h-[60vh] object-contain rounded-lg border border-white/10 shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              ) : previewDoc.type === 'application/pdf' ? (
                <div className="text-center p-12 max-w-sm space-y-4">
                  <div className="w-16 h-16 bg-red-950/20 text-red-400 border border-red-500/10 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <FileText size={32} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-cream">PDF Document</h4>
                    <p className="text-xs text-text-secondary mt-1">Direct preview is not supported for PDFs in this container. Please download or open in a new window.</p>
                  </div>
                  <div className="flex justify-center gap-3 pt-2">
                    <a
                      href={previewDoc.url}
                      download={previewDoc.name}
                      className="px-4 py-2 bg-gold/10 border border-gold/30 hover:bg-gold/20 text-gold rounded-lg text-xs font-semibold transition-all"
                    >
                      Download File
                    </a>
                    <a
                      href={previewDoc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      Open in New Tab <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center p-12 max-w-sm space-y-4">
                  <div className="w-16 h-16 bg-gold/10 text-gold border border-gold/20 rounded-2xl flex items-center justify-center mx-auto">
                    <FileText size={32} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-cream">Non-Image Document</h4>
                    <p className="text-xs text-text-secondary mt-1">Previewing type "{previewDoc.type}" is not supported. Please download or view using external software.</p>
                  </div>
                  <div className="pt-2">
                    <a
                      href={previewDoc.url}
                      download={previewDoc.name}
                      className="px-5 py-2.5 bg-gold hover:bg-gold/90 text-black rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      Download File
                    </a>
                  </div>
                </div>
              )}

              {previewDoc.notes && (
                <div className="mt-6 p-4 bg-white/5 border border-white/5 rounded-xl max-w-2xl w-full text-center">
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1 font-mono">Verification Feedback</p>
                  <p className="text-xs text-cream/70 italic leading-relaxed">"{previewDoc.notes}"</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/5 bg-black/20 flex justify-end">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-5 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-white transition-colors border border-white/5"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingDocId && (
        <div className="fixed inset-0 z-[6000] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#121212] border border-white/10 p-6 rounded-2xl space-y-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-950/30 text-red-400 border border-red-500/20 rounded-xl flex-shrink-0">
                <ShieldAlert size={22} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-cream font-serif">Remove Verification Document?</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Are you absolutely sure you want to delete this guest verification document? This action is irreversible and the guest will need to upload their document again.
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingDocId(null)}
                className="px-4 py-2 border border-white/5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
