import React, { useState, useRef, useEffect } from 'react';
import { UploadedDocument, VerificationStatus } from '../../types';
import { 
  Upload, FileText, Check, Trash2, Download, 
  Eye, AlertCircle, Loader2, FileCheck, X 
} from 'lucide-react';
import { dataService } from '../../services/dataService';

interface DocumentUploadSectionProps {
  eventId: string;
  familyId: string;
  familyName: string;
  onUploadComplete?: (newDocs: UploadedDocument[]) => void;
  onDeleteDocument?: (docId: string) => void;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit for original file, will be compressed
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

export default function DocumentUploadSection({
  eventId,
  familyId,
  familyName,
  onUploadComplete,
  onDeleteDocument
}: DocumentUploadSectionProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<UploadedDocument | null>(null);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!eventId || !familyId) return;
      try {
        const docs = await dataService.getGuestDocuments(eventId, familyId);
        setDocuments(docs);
      } catch (err) {
        console.error('Error fetching documents:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [eventId, familyId]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 1;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const processFiles = async (files: FileList) => {
    setError(null);
    setUploading(true);
    const newSavedDocs: UploadedDocument[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Format validation
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          throw new Error(`File "${file.name}" has an unsupported format. Only PDF, JPG, JPEG, and PNG files are allowed.`);
        }

        // Size validation
        if (file.size > MAX_FILE_SIZE_BYTES) {
          throw new Error(`File "${file.name}" exceeds the 5MB limit. Please upload a smaller scan/file.`);
        }

        // Upload and process file (Base64 for now)
        const base64Url = await dataService.uploadImage(file, true);

        const docData: Omit<UploadedDocument, 'id'> = {
          name: file.name,
          type: file.type,
          size: file.size,
          url: base64Url,
          uploaded_at: new Date().toISOString(),
          verification_status: 'Pending',
          family_id: familyId,
          family_name: familyName,
          event_id: eventId
        };

        const savedId = await dataService.saveGuestDocument(docData);
        if (savedId) {
          newSavedDocs.push({ id: savedId, ...docData } as UploadedDocument);
        }
      }

      if (newSavedDocs.length > 0) {
        setDocuments(prev => [...prev, ...newSavedDocs]);
        if (onUploadComplete) {
          onUploadComplete(newSavedDocs);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error parsing uploaded documents.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await dataService.deleteGuestDocument(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
      if (onDeleteDocument) {
        onDeleteDocument(docId);
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document. Please try again.');
    }
  };

  const getStatusColor = (status?: VerificationStatus) => {
    switch (status) {
      case 'Verified': return 'text-green-400';
      case 'Rejected': return 'text-red-400';
      case 'Pending':
      default: return 'text-amber-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="animate-spin text-gold" size={24} />
      </div>
    );
  }

  return (
    <div id="document-upload-section" className="space-y-6">
      <div className="flex flex-col gap-1.5 border-b border-gold/10 pb-3">
        <h4 className="text-[10px] uppercase tracking-[0.3em] text-gold flex items-center gap-2">
          <FileCheck size={16} /> 3. Official Documents Verification
        </h4>
        <span className="text-white/40 text-[10px] tracking-wide">
          Please upload verification documents (e.g. Aadhaar Card, PAN Card, Passport, Driving License, or Voter ID).
        </span>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-4
          ${dragActive ? 'border-gold bg-gold/10 scale-[1.01]' : 'border-white/10 hover:border-gold/30 bg-black/20 hover:bg-black/30'}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={handleChange}
        />

        {uploading ? (
          <>
            <Loader2 className="animate-spin text-gold" size={36} />
            <span className="font-mono text-xs text-gold uppercase tracking-wider">Processing & encrypting documents...</span>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center border border-gold/20">
              <Upload className="text-gold" size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-white/80 font-medium">
                Drag and drop files here, or <span className="text-gold underline">browse files</span>
              </p>
              <p className="text-xs text-text-secondary">
                Supports PDF, JPG, JPEG, and PNG (Max 5MB per file)
              </p>
            </div>
          </>
        )}
      </div>

      {/* Error Feedback */}
      {error && (
        <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={16} />
          <p className="text-xs text-red-300 leading-relaxed">{error}</p>
        </div>
      )}

      {/* Uploaded Files Grid/List */}
      {documents.length > 0 && (
        <div className="space-y-3">
          <span className="text-[9px] uppercase tracking-widest text-[#D4AF37]/60 font-mono block">
            Uploaded Verification Passes ({documents.length})
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {documents.map((doc) => {
              const isImage = doc.type.startsWith('image/');
              return (
                <div 
                  key={doc.id}
                  className="bg-black/40 border border-white/5 hover:border-gold/20 rounded-xl p-4 flex items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {isImage ? (
                      <div className="w-10 h-10 rounded border border-white/10 overflow-hidden bg-dark flex-shrink-0">
                        <img src={doc.url} alt={doc.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="text-gold" size={18} />
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <p className="text-xs text-white/90 font-medium truncate" title={doc.name}>
                        {doc.name}
                      </p>
                      <p className="text-[10px] text-text-secondary font-mono">
                        {formatFileSize(doc.size)} • <span className={getStatusColor(doc.verification_status)}>
                          {doc.verification_status || 'Pending'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Preview Button */}
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="p-2 hover:bg-white/5 rounded text-white/60 hover:text-gold transition-colors"
                      title="Preview Document"
                    >
                      <Eye size={14} />
                    </button>

                    {/* Download Button */}
                    <a
                      href={doc.url}
                      download={doc.name}
                      className="p-2 hover:bg-white/5 rounded text-white/60 hover:text-gold transition-colors flex items-center justify-center"
                      title="Download Document"
                    >
                      <Download size={14} />
                    </a>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 hover:bg-red-950/20 rounded text-white/40 hover:text-red-400 transition-colors"
                      title="Delete Document"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full-Screen Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-[2000] bg-black/90 flex items-center justify-center p-6 backdrop-blur-md">
          <div className="relative bg-[#111] border border-white/10 max-w-3xl w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex flex-col">
                <span className="font-serif text-lg text-cream truncate max-w-[80%]">{previewDoc.name}</span>
                <span className={`text-[10px] uppercase tracking-widest ${getStatusColor(previewDoc.verification_status)}`}>
                  Status: {previewDoc.verification_status || 'Pending'}
                </span>
              </div>
              <button 
                onClick={() => setPreviewDoc(null)} 
                className="text-white/60 hover:text-white hover:bg-white/5 p-2 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex justify-center items-center overflow-auto max-h-[70vh] bg-black/40">
              {previewDoc.type.startsWith('image/') ? (
                <img src={previewDoc.url} alt={previewDoc.name} className="max-w-full max-h-[60vh] object-contain rounded" />
              ) : previewDoc.type === 'application/pdf' ? (
                <div className="text-center py-10 space-y-4">
                  <FileText size={64} className="text-gold mx-auto" />
                  <p className="text-sm text-white/70">PDF Document Preview</p>
                  <a 
                    href={previewDoc.url} 
                    download={previewDoc.name}
                    className="inline-flex items-center gap-2 text-dark bg-gold px-5 py-2.5 rounded font-mono uppercase tracking-wider text-xs font-bold hover:brightness-110 transition-all"
                  >
                    <Download size={14} /> Download to View PDF
                  </a>
                </div>
              ) : (
                <p className="text-sm text-white/50">Preview is not supported for this file type.</p>
              )}
            </div>
            
            {previewDoc.notes && (
              <div className="p-4 bg-red-950/20 border-t border-white/5">
                <p className="text-xs text-red-300">
                  <span className="font-bold uppercase tracking-widest text-[10px] block mb-1">Admin Notes:</span>
                  {previewDoc.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFiles(e.target.files);
    }
  }
}
