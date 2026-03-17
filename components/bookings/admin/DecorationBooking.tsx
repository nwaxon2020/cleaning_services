"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, query, orderBy, onSnapshot, 
  doc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { 
  FaWhatsapp, FaEnvelope, FaPhone, FaMapMarkerAlt, 
  FaCalendarAlt, FaClock, FaCheckCircle, FaUser,
  FaGavel, FaLayerGroup, FaLock, FaMapPin, FaTag, FaTimesCircle, FaComment
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
  
  // Cancel reason states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingBooking, setCancellingBooking] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const ADMIN_PASSCODE = process.env.NEXT_PUBLIC_ADMIN_PIN; 

  // Predefined cancel reasons for decoration
  const cancelReasons = [
    { label: "Budget too low", value: "budget_too_low" },
    { label: "Dates unavailable", value: "dates_unavailable" },
    { label: "Location out of service area", value: "location_out_of_area" },
    { label: "Design style not available", value: "style_unavailable" },
    { label: "Materials currently unavailable", value: "materials_unavailable" },
    { label: "Incomplete information", value: "incomplete_info" },
    { label: "Duplicate request", value: "duplicate_request" },
    { label: "Customer requested cancellation", value: "customer_requested" },
    { label: "Team/resources unavailable", value: "resources_unavailable" },
    { label: "Event date too soon", value: "date_too_soon" },
  ];

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

  const handleCancelWithReason = async () => {
    if (!cancellingBooking) return;
    
    const finalReason = customReason.trim() || cancelReason;
    
    if (!finalReason) {
      toast.error("Please select or enter a cancellation reason");
      return;
    }

    try {
      const reasonText = customReason.trim() 
        ? customReason 
        : cancelReasons.find(r => r.value === cancelReason)?.label || cancelReason;

      await updateDoc(doc(db, "decoration_bookings", cancellingBooking.id), { 
        status: 'cancelled',
        cancelReason: reasonText,
        cancelledAt: new Date(),
        cancelledBy: 'admin'
      });
      
      toast.success("Booking cancelled with reason");
      setShowCancelModal(false);
      setCancellingBooking(null);
      setCancelReason("");
      setCustomReason("");
    } catch (e) { 
      toast.error("Cancel failed"); 
    }
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

  if(loading){
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 rounded-full animate-spin border-2 border-t-transparent border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 pt-2 md:p-8 md:pt-4 bg-slate-50 min-h-screen relative">
      <div className="max-w-5xl mx-auto">
        
        <header className="flex flex-col md:flex-row justify-center md:justify-end items-start md:items-center mb-8 gap-4">
          <div className="w-full flex justify-between md:justify-around bg-white border rounded-sm md:rounded-xl p-2 md:p-1 shadow-sm">
            {['pending', 'approved', 'cancelled', 'all'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 md:px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filter === f ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
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
                className="mb-8 md:mb-0 bg-white border border-slate-200 md:rounded-xl overflow-hidden shadow-sm"
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
                      
                      {/* Show cancel reason if booking is cancelled */}
                      {booking.status === 'cancelled' && booking.cancelReason && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded-lg">
                          <p className="text-[9px] font-black text-red-600 flex items-center gap-1">
                            <FaTimesCircle size={10} /> Cancelled:
                          </p>
                          <p className="text-[10px] text-red-700 mt-1">{booking.cancelReason}</p>
                        </div>
                      )}
                      
                      <p className="text-xs font-bold text-purple-600 flex items-center gap-2 mt-1">
                        <FaMapPin className="text-purple-500"/> {booking.postalCode}
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
                        <span className="text-xl font-black text-slate-900">£{booking.bidAmount}</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase ml-1">customer's offer</span>
                      </div>
                      
                      {booking.estimateRange && (
                        <p className="text-xs font-black text-emerald-600 flex items-center gap-1 mt-2">
                          <FaTag size={12} className="text-emerald-500"/> Estimate: <span className='text-red-800'>{booking.estimateRange}</span>
                        </p>
                      )}
                      
                      <p className="text-xs font-black text-slate-500 uppercase flex items-center gap-1 mt-2">
                        <FaLayerGroup size={15}/> Room / m² : <span className='text-black'>{booking.quantity}</span>
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
                            onClick={() => {
                              setCancellingBooking(booking);
                              setShowCancelModal(true);
                            }}
                            className="w-full py-3 bg-white border-2 border-slate-300 text-slate-600 hover:text-orange-500 hover:border-orange-100 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2"
                          >
                            <FaTimesCircle/> Cancel Request
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
                        <span className="text-[8px] font-black text-slate-400 uppercase">Ref: {booking.id.slice(-6).toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Cancel Reason Modal */}
      <AnimatePresence>
        {showCancelModal && cancellingBooking && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => {
                setShowCancelModal(false);
                setCancellingBooking(null);
                setCancelReason("");
                setCustomReason("");
              }} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="relative bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                  <FaTimesCircle size={20} />
                </div>
                <h2 className="text-xl font-black text-slate-900">Cancel Booking</h2>
              </div>
              
              <p className="text-sm text-slate-500 mb-4">
                Please provide a reason for cancelling this decoration booking
              </p>

              {/* Quick reason buttons */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {cancelReasons.slice(0, 6).map((reason) => (
                  <button
                    key={reason.value}
                    onClick={() => {
                      setCancelReason(reason.value);
                      setCustomReason("");
                    }}
                    className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      cancelReason === reason.value
                        ? 'bg-orange-600 text-white'
                        : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                    }`}
                  >
                    {reason.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {cancelReasons.slice(6).map((reason) => (
                  <button
                    key={reason.value}
                    onClick={() => {
                      setCancelReason(reason.value);
                      setCustomReason("");
                    }}
                    className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      cancelReason === reason.value
                        ? 'bg-orange-600 text-white'
                        : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                    }`}
                  >
                    {reason.label}
                  </button>
                ))}
              </div>

              {/* Custom reason input */}
              <div className="relative mb-6">
                <div className="absolute left-3 top-3 text-orange-400">
                  <FaComment size={14} />
                </div>
                <textarea
                  value={customReason}
                  onChange={(e) => {
                    setCustomReason(e.target.value);
                    if (e.target.value) setCancelReason("");
                  }}
                  placeholder="Or type custom reason..."
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 bg-orange-50 border-2 border-orange-200 rounded-xl text-sm outline-none focus:border-orange-500 transition-all"
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancellingBooking(null);
                    setCancelReason("");
                    setCustomReason("");
                  }} 
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                >
                  Back
                </button>
                <button 
                  onClick={handleCancelWithReason} 
                  className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-700 transition-all"
                >
                  Confirm Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE MODAL */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mx-auto mb-6"><FaLock size={24} /></div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">Wipe Record?</h2>
              <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="••••" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 text-gray-900 text-center text-xl font-black tracking-[1em] focus:border-red-500 focus:outline-none transition-all mb-6" autoFocus />
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 border border-gray-400 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                <button onClick={confirmDeletion} className="flex-1 py-4 bg-red-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest">Wipe Data</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}