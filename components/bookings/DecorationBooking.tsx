"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, query, orderBy, onSnapshot, 
  doc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { 
  FaWhatsapp, FaEnvelope, FaPhone, FaMapMarkerAlt, 
  FaCalendarAlt, FaClock, FaCheckCircle, FaTrash, FaUser,
  FaGavel, FaLayerGroup, FaLock, FaCircle
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function AdminDecorationBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [passcode, setPasscode] = useState("");

  const ADMIN_PASSCODE = "1234"; 

  useEffect(() => {
    const q = query(collection(db, "decoration_bookings"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "decoration_bookings", id), { status: newStatus });
      toast.success(`Moved to ${newStatus}`);
    } catch (e) { toast.error("Update failed"); }
  };

  const handleWipeRequest = (id: string) => {
    setSelectedBookingId(id);
    setShowDeleteModal(true);
  };

  const confirmDeletion = async () => {
    if (passcode !== ADMIN_PASSCODE) {
      toast.error("Invalid Admin Passcode");
      return;
    }
    if (!selectedBookingId) return;
    try {
      await deleteDoc(doc(db, "decoration_bookings", selectedBookingId));
      toast.success("Record permanently wiped");
      setShowDeleteModal(false);
      setPasscode("");
      setSelectedBookingId(null);
    } catch (e) { toast.error("Deletion failed"); }
  };

  const filteredBookings = bookings.filter(b => filter === 'all' ? true : b.status === filter);

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen relative">
      <div className="max-w-7xl mx-auto">
        
        <header className="flex flex-col md:flex-row justify-center md:justify-end items-start md:items-center mb-8 gap-4">
          <div className="flex bg-white border rounded-xl p-1 shadow-sm">
            {['pending', 'approved', 'cancelled', 'all'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filter === f ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode='popLayout'>
            {filteredBookings.map((booking) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={booking.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
              >
                <div className="flex flex-col md:flex-row">
                  <div className={`w-full md:w-2 ${booking.status === 'pending' ? 'bg-orange-400' : booking.status === 'approved' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  
                  <div className="flex-1 p-5 grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Column 1: Customer & Status Indicator */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-slate-400">
                           <FaUser size={10}/> <span className="text-[9px] font-black uppercase tracking-widest">Customer</span>
                        </div>
                        
                        {/* STATUS INDICATOR FOR "ALL" VIEW */}
                        {filter === 'all' && (
                          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${
                            booking.status === 'approved' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                            booking.status === 'pending' ? 'bg-orange-50 border-orange-100 text-orange-600' :
                            'bg-slate-50 border-slate-200 text-slate-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              booking.status === 'approved' ? 'bg-emerald-500' :
                              booking.status === 'pending' ? 'bg-orange-500 animate-pulse' :
                              'bg-slate-400'
                            }`} />
                            <span className="text-[8px] font-black uppercase tracking-tighter">
                              {booking.status === 'pending' ? 'In Process' : booking.status}
                            </span>
                          </div>
                        )}
                      </div>

                      <h3 className="font-black text-slate-900 uppercase text-sm">{booking.fullName}</h3>
                      <p className="text-xs font-bold text-slate-500 flex items-center gap-2 mt-2">
                        <FaMapMarkerAlt className="text-red-500"/> {booking.address}
                      </p>
                      <div className="flex gap-2 mt-4">
                        <a href={`https://wa.me/${booking.phone?.replace(/\D/g,'')}`} target="_blank" className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"><FaWhatsapp size={14}/></a>
                        <a href={`tel:${booking.phone}`} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><FaPhone size={14}/></a>
                        <a href={`mailto:${booking.email}`} className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-600 hover:text-white transition-all"><FaEnvelope size={14}/></a>
                      </div>
                    </div>

                    {/* Column 2: The Deal */}
                    <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <FaGavel size={10}/> <span className="text-[9px] font-black uppercase tracking-widest">The Deal</span>
                      </div>
                      <h4 className="text-xs font-black text-purple-600 uppercase">{booking.serviceName}</h4>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-2xl font-black text-slate-900">£{booking.bidAmount}</span>
                      </div>
                      <p className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
                        <FaLayerGroup size={10}/> Qty: {booking.quantity}
                      </p>
                    </div>

                    {/* Column 3: Schedule */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <FaCalendarAlt size={10}/> <span className="text-[9px] font-black uppercase tracking-widest">Schedule</span>
                      </div>
                      <div className="text-xs font-bold text-slate-700 space-y-2">
                        <p className="flex items-center gap-2"><FaCalendarAlt className="text-slate-300"/> {booking.date}</p>
                        <p className="flex items-center gap-2"><FaClock className="text-slate-300"/> {booking.time}</p>
                      </div>
                    </div>

                    {/* Column 4: Actions */}
                    <div className="flex flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                      {booking.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => updateStatus(booking.id, 'approved')}
                            className="w-full py-3 bg-emerald-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                          >
                            <FaCheckCircle/> Approve Bid
                          </button>
                          <button 
                            onClick={() => updateStatus(booking.id, 'cancelled')}
                            className="w-full py-3 bg-white border-2 border-slate-100 text-slate-400 hover:text-orange-500 hover:border-orange-100 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all"
                          >
                            Cancel Request
                          </button>
                        </>
                      )}

                      {(filter === 'approved' || filter === 'cancelled') && (
                        <button 
                          onClick={() => handleWipeRequest(booking.id)}
                          className="w-full py-3 bg-red-50 text-red-500 border border-red-100 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                          <FaLock size={10}/> Wipe Data
                        </button>
                      )}
                      
                      <div className="mt-2 text-center">
                        <span className="text-[8px] font-black text-slate-300 uppercase">Ref: {booking.id.slice(-6).toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* DELETE MODAL (Same as previous) */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6"><FaLock size={24} /></div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">Wipe Record?</h2>
              <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="••••" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 text-center text-2xl font-black tracking-[1em] focus:border-red-500 focus:outline-none transition-all mb-6" autoFocus />
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                <button onClick={confirmDeletion} className="flex-1 py-4 bg-red-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest">Wipe Data</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}