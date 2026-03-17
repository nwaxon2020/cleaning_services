"use client";
import { useEffect, useState } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, getDownloadURL, deleteObject } from 'firebase/storage';
import { 
  FaEnvelope, FaPhone, FaWhatsapp, FaFileDownload, FaUserCircle, FaSpinner,
  FaCheckCircle, FaTrash, FaLock, FaEye, FaEyeSlash
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function EmploymentAdminUi() {
  const [apps, setApps] = useState<any[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [selectedAppName, setSelectedAppName] = useState('');
  const [passcode, setPasscode] = useState("");
  const [deleting, setDeleting] = useState(false);

  const ADMIN_PASSCODE = process.env.NEXT_PUBLIC_ADMIN_PIN;

  useEffect(() => {
    const q = query(collection(db, "employment_applications"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => setApps(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  const handleViewCV = async (app: any) => {
    if (!app.documentPath) {
      toast.error("No CV uploaded");
      return;
    }
    
    setDownloadingId(app.id);
    try {
      const fileRef = ref(storage, app.documentPath);
      const url = await getDownloadURL(fileRef);
      window.open(url, '_blank');
    } catch (error) {
      console.error("Error getting CV:", error);
      toast.error("Could not load CV. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleMarkAsRead = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'read' ? 'pending' : 'read';
      await updateDoc(doc(db, "employment_applications", id), { 
        status: newStatus,
        readAt: newStatus === 'read' ? new Date() : null
      });
      toast.success(`Marked as ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleDeleteClick = (app: any) => {
    setSelectedAppId(app.id);
    setSelectedAppName(`${app.firstName} ${app.lastName}`);
    setShowDeleteModal(true);
    setPasscode("");
  };

  const confirmDeletion = async () => {
    if (passcode !== ADMIN_PASSCODE) {
      toast.error("Invalid Admin Passcode");
      return;
    }
    
    if (!selectedAppId) return;
    
    setDeleting(true);
    try {
      // Find the app to get documentPath
      const app = apps.find(a => a.id === selectedAppId);
      
      // Delete from Firestore first
      await deleteDoc(doc(db, "employment_applications", selectedAppId));
      
      // Then try to delete from Storage if there's a document
      if (app?.documentPath) {
        try {
          const fileRef = ref(storage, app.documentPath);
          await deleteObject(fileRef);
        } catch (storageError) {
          console.error("Storage deletion error (non-critical):", storageError);
          // Don't fail if storage deletion fails - Firestore already deleted
        }
      }
      
      toast.success("Application permanently deleted");
      setShowDeleteModal(false);
      setSelectedAppId(null);
      setSelectedAppName('');
      setPasscode("");
    } catch (error) {
      console.error("Deletion error:", error);
      toast.error("Failed to delete application");
    } finally {
      setDeleting(false);
    }
  };

  const filteredApps = apps.filter(app => {
    if (filter === 'all') return true;
    if (filter === 'unread') return app.status !== 'read';
    if (filter === 'read') return app.status === 'read';
    return true;
  });

  const unreadCount = apps.filter(app => app.status !== 'read').length;
  const readCount = apps.filter(app => app.status === 'read').length;

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen pb-20">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Applicant Tracking</h1>
            <p className="text-slate-500 text-sm font-medium">{apps.length} Total Submissions</p>
          </div>
          
          {/* Filter Buttons */}
          <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm self-start">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${
                filter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              All ({apps.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1 ${
                filter === 'unread' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <FaEyeSlash size={12} /> Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-1 ${
                filter === 'read' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <FaEye size={12} /> Read ({readCount})
            </button>
          </div>
        </header>

        {filteredApps.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">No applications found for this filter.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:gap-6">
            {filteredApps.map((app) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={app.id}
                className={`bg-white md:rounded-xl shadow-sm border overflow-hidden transition-all ${
                  app.status === 'read' ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-100'
                }`}
              >
                {/* Header Section */}
                <div className="p-5 md:p-6 border-b border-slate-50">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        app.status === 'read' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                        <FaUserCircle size={28} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-900 leading-tight">
                          {app.firstName} {app.lastName}
                        </h2>
                        <p className="text-slate-500 text-xs md:text-sm truncate max-w-[200px] md:max-w-none">
                          {app.email}
                        </p>
                        {app.status === 'read' && app.readAt && (
                          <p className="text-[10px] font-bold text-emerald-600 mt-1">
                            Read on {app.readAt?.toDate().toLocaleDateString('en-GB')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Desktop Contact Actions */}
                    <div className="hidden md:flex gap-2">
                      <a href={`mailto:${app.email}`} title="Email" className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><FaEnvelope /></a>
                      <a href={`tel:${app.phone}`} title="Call" className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all"><FaPhone /></a>
                      <a href={`https://wa.me/${app.phone?.replace(/\D/g,'')}`} target="_blank" title="WhatsApp" className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"><FaWhatsapp /></a>
                    </div>
                  </div>
                </div>
                
                {/* Content Section */}
                <div className="p-5 md:p-6 space-y-4">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Cover Letter</h4>
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-2xl italic border border-slate-100">
                      {app.coverLetter || "No cover letter provided."}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Submission Date</span>
                      <span className="text-xs font-bold text-slate-600">
                        {app.createdAt?.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Mark as Read/Unread Button */}
                      <button
                        onClick={() => handleMarkAsRead(app.id, app.status)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all ${
                          app.status === 'read' 
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                        title={app.status === 'read' ? 'Mark as unread' : 'Mark as read'}
                      >
                        {app.status === 'read' ? <FaEyeSlash /> : <FaCheckCircle />}
                        <span className="hidden md:inline">{app.status === 'read' ? 'Unread' : 'Mark Read'}</span>
                      </button>

                      {/* View CV Button */}
                      {app.documentPath ? (
                        <button
                          onClick={() => handleViewCV(app)}
                          disabled={downloadingId === app.id}
                          className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-xl text-sm font-black hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {downloadingId === app.id ? (
                            <>
                              <FaSpinner className="animate-spin" /> Loading...
                            </>
                          ) : (
                            <>
                              <FaFileDownload /> <span className="hidden md:inline">View CV</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-slate-400 text-sm italic px-2">No CV</span>
                      )}

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteClick(app)}
                        className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                        title="Delete application"
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mobile Contact Actions (Action Bar) */}
                <div className="grid grid-cols-3 border-t border-slate-50 md:hidden">
                  <a href={`mailto:${app.email}`} className="flex flex-col items-center justify-center py-4 text-blue-600 border-r border-slate-50 active:bg-slate-50">
                    <FaEnvelope size={18} />
                    <span className="text-[10px] font-bold mt-1 uppercase">Email</span>
                  </a>
                  <a href={`tel:${app.phone}`} className="flex flex-col items-center justify-center py-4 text-green-600 border-r border-slate-50 active:bg-slate-50">
                    <FaPhone size={18} />
                    <span className="text-[10px] font-bold mt-1 uppercase">Call</span>
                  </a>
                  <a href={`https://wa.me/${app.phone?.replace(/\D/g,'')}`} target="_blank" className="flex flex-col items-center justify-center py-4 text-emerald-600 active:bg-slate-50">
                    <FaWhatsapp size={18} />
                    <span className="text-[10px] font-bold mt-1 uppercase">Chat</span>
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowDeleteModal(false)} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                <FaLock size={24} />
              </div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">
                Delete Application?
              </h2>
              <p className="text-sm text-slate-500 mb-2">
                Are you sure you want to delete <span className="font-bold text-slate-900">{selectedAppName}</span>'s application?
              </p>
              <p className="text-xs text-red-500 mb-6">
                This will permanently remove their data and CV from the system.
              </p>
              <input 
                type="password" 
                value={passcode} 
                onChange={(e) => setPasscode(e.target.value)} 
                placeholder="Admin Passcode" 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 text-gray-900 text-center text-sm font-bold focus:border-red-500 focus:outline-none transition-all mb-6" 
                autoFocus 
              />
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteModal(false)} 
                  disabled={deleting}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeletion} 
                  disabled={deleting || !passcode}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-red-600 transition-all disabled:bg-red-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleting ? <FaSpinner className="animate-spin" /> : <FaLock size={12} />}
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}