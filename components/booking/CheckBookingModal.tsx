"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, FaEnvelope, FaPhone, FaReceipt, FaLock, 
  FaUser, FaCheck, FaBroom, FaCalendarAlt, FaChevronRight, FaSpinner, FaTrashAlt, FaExclamationTriangle 
} from 'react-icons/fa';
import { db, auth } from '@/lib/firebase'; 
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';
import emailjs from '@emailjs/browser';

const TIME_SLOTS = ["6-8", "9-12", "1-4", "5-6", "7-9"];

export const CheckBookingModal = ({ onClose }: any) => {
  const [SID, TID, PK] = ['service_0s7i0pu', 'template_faeqkkg', 'GK69-FWwlvVZogZ1D'];
  const COUNTRY_CODE = '+44'; 

  useEffect(() => { emailjs.init(PK); }, []);

  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState(''), [view, setView] = useState('input');
  const [isProcessing, setIsProcessing] = useState(false), [vCode, setVCode] = useState('');
  const [genCode, setGenCode] = useState(''), [confResult, setConfResult] = useState<any>(null); 
  const [bookings, setBookings] = useState<any[]>([]); 
  const [booking, setBooking] = useState<any>(null); 
  const [isEditing, setIsEditing] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [editData, setEditData] = useState<any>({});

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
  };

  const checkDeadline = (b: any) => {
    if (!b) return false;
    const bDate = new Date(`${b.bookingDate}T00:00:00`);
    return (bDate.getTime() - new Date().getTime()) / (36e5) < 48;
  };

  const handleRequestAuth = async () => {
    if (!identifier) return toast.error(`Enter ${authMethod}`);
    setIsProcessing(true);
    try {
      const bRef = collection(db, 'bookings');
      let snap;
      if (authMethod === 'email') {
        snap = await getDocs(query(bRef, where('userEmail', '==', identifier.trim())));
      } else {
        const c = identifier.replace(/[\s\-\(\)]/g, '');
        const num = COUNTRY_CODE.replace('+', '');
        const vars = [...new Set([c, `+${c}`, COUNTRY_CODE + c.substring(1), '+' + c, COUNTRY_CODE + c])];
        snap = await getDocs(query(bRef, where('phoneNumber', 'in', vars)));
      }

      if (snap.empty) throw new Error('No bookings found.');
      
      const allBookings = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      setBookings(allBookings);

      if (authMethod === 'email') {
        const c = Math.floor(1e3 + Math.random() * 9e3).toString(); 
        setGenCode(c);
        // Use a safe fallback for the name
        const customerName = allBookings[0]?.fullName || 'Customer';
        
        await emailjs.send(SID, TID, { 
          email: identifier.trim(), 
          passcode: c, 
          user_name: customerName 
        }, PK);
        
        toast.success('Code sent!'); 
        setView('verify');
      } else {
        setupRecaptcha();
        const fPhone = identifier.includes('+') ? identifier : identifier.startsWith('0') ? COUNTRY_CODE + identifier.substring(1) : COUNTRY_CODE + identifier;
        setConfResult(await signInWithPhoneNumber(auth, fPhone, (window as any).recaptchaVerifier));
        toast.success('SMS sent!'); 
        setView('verify');
      }
    } catch (e: any) { 
      toast.error(e.message); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  const handleVerify = async () => {
    try {
      if (authMethod === 'email' ? vCode === genCode : await confResult.confirm(vCode)) { 
        setView('list'); 
        toast.success('Verified!'); 
      } else {
        toast.error('Invalid Code');
      }
    } catch (e) { toast.error("Verification failed"); }
  };

  const handleCancelBooking = async () => {
    if (checkDeadline(booking)) return toast.error("Too late to cancel (48h limit)");
    setIsProcessing(true);
    
    const refundAmount = booking.total * 0.85; // 15% deduction
    const deduction = booking.total * 0.15;

    try {
      // 1. Save to cancelled_bookings collection
      await addDoc(collection(db, "cancelled_bookings"), {
        originalBookingId: booking.id,
        customerName: booking.fullName,
        customerEmail: booking.userEmail,
        customerPhone: booking.phoneNumber,
        serviceType: booking.service,
        originalTotal: booking.total,
        refundAmount: refundAmount,
        serviceChargeDeducted: deduction,
        cancelledAt: serverTimestamp(),
        scheduledFor: `${booking.bookingDate} ${booking.bookingTime}`
      });

      // 2. Delete from active bookings
      await deleteDoc(doc(db, "bookings", booking.id));

      toast.success("Booking Cancelled & Refund Initiated");
      setBookings(bookings.filter(b => b.id !== booking.id));
      setShowCancelConfirm(false);
      setView('list');
    } catch (e) {
      toast.error("Cancellation failed. Try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const selectBooking = (b: any) => {
    setBooking(b);
    setEditData(b);
    setView('details');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[300] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-3 text-slate-900">
      <div className="bg-white px-4 py-6 md:p-4 rounded-xl max-w-md w-full relative shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div id="recaptcha-container"></div>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-300 hover:text-orange-500 z-50"><FaTimes /></button>

        <div className="overflow-y-auto custom-scrollbar">
          {view === 'input' && (
            <div className="text-center pt-4">
              <h2 className="text-xl font-black uppercase italic mb-6 tracking-tighter">Access My Booking</h2>
              <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                {['email', 'phone'].map((m: any) => (
                  <button key={m} onClick={() => setAuthMethod(m as any)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${authMethod === m ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}>{m}</button>
                ))}
              </div>
              <div className="relative mb-4">
                 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500">{authMethod === 'email' ? <FaEnvelope /> : <FaPhone />}</div>
                 <input type={authMethod === 'email' ? 'email' : 'tel'} placeholder={authMethod === 'email' ? 'your@email.com' : `${COUNTRY_CODE} 207...`} value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full p-4 pl-12 bg-slate-50 border rounded-xl text-xs font-bold outline-none focus:border-orange-500" />
              </div>
              <button onClick={handleRequestAuth} disabled={isProcessing} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-600 shadow-lg">{isProcessing ? 'Sending...' : 'Get Code'}</button>
            </div>
          )}

          {view === 'verify' && (
            <div className="text-center pt-4">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4"><FaLock /></div>
              <h2 className="text-xl font-black uppercase italic mb-2 tracking-tighter">Enter Code</h2>
              <input type="text" maxLength={6} placeholder="· · · ·" value={vCode} onChange={(e) => setVCode(e.target.value)} className="w-full p-4 bg-slate-50 border rounded-xl text-2xl tracking-[0.3em] font-black text-center outline-none focus:border-orange-500 mb-6 font-mono" />
              <button onClick={handleVerify} className="w-full py-4 bg-orange-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-700 shadow-lg">Verify</button>
            </div>
          )}

          {view === 'list' && (
            <div className="pt-4">
              <h2 className="text-xl font-black uppercase italic mb-6 tracking-tighter border-b pb-2">Your Bookings</h2>
              <div className="space-y-3">
                {bookings.map((b) => (
                  <button key={b.id} onClick={() => selectBooking(b)} className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-orange-50 border border-slate-100 rounded-xl transition-all group">
                    <div className="text-left">
                      <p className="text-[11px] font-black uppercase text-slate-900 italic">{b.service}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                        <FaCalendarAlt className="text-orange-500"/> {b.bookingDate} @ {b.bookingTime}
                      </p>
                    </div>
                    <FaChevronRight className="text-slate-300 group-hover:text-orange-500 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {view === 'details' && (
            <div className="space-y-4 pt-4 relative">
              <div className="flex justify-between items-center border-b pb-2 px-2">
                  <button onClick={() => { setIsEditing(false); setView('list'); }} className="text-slate-400 font-black text-[9px] uppercase hover:text-orange-600">← Back to List</button>
                  <h2 className="text-lg font-black uppercase italic tracking-tighter">{booking?.service}</h2>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border space-y-3 shadow-inner">
                  <div className="grid gap-3">
                      {[['Name', 'fullName'], ['Phone', 'phoneNumber'], ['Address', 'address']].map(([l, f]) => (
                        <div key={f}>
                          <label className="text-[8px] font-black text-slate-400 uppercase">{l}</label>
                          {isEditing ? <input value={editData[f]} onChange={(e)=>setEditData({...editData, [f]: e.target.value})} className="w-full p-2 bg-white border rounded-lg text-xs font-bold outline-none" /> : <p className="text-[11px] font-bold">{booking?.[f]}</p>}
                        </div>
                      ))}
                      <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase">Date</label>
                            {isEditing ? <input type="date" min={new Date().toISOString().split('T')[0]} value={editData.bookingDate} onChange={(e)=>setEditData({...editData, bookingDate: e.target.value})} className="w-full p-2 bg-white border rounded-lg text-xs font-bold" /> : <p className="text-[11px] font-bold">{booking?.bookingDate}</p>}
                          </div>
                          <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase">Time Slot</label>
                            {isEditing ? (
                              <select value={editData.bookingTime} onChange={(e)=>setEditData({...editData, bookingTime: e.target.value})} className="w-full p-2 bg-white border rounded-lg text-xs font-bold">
                                {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                            ) : <p className="text-[11px] font-bold">{booking?.bookingTime}</p>}
                          </div>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setIsEditing(!isEditing)} className="py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[9px] tracking-widest">
                   {isEditing ? "Cancel Edit" : "Edit Booking"}
                </button>
                <button 
                  onClick={() => {
                    if(checkDeadline(booking)) return toast.error("Too late (48h limit)");
                    setShowCancelConfirm(true);
                  }}
                  className="py-3 bg-red-50 text-red-600 border border-red-100 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2"
                >
                  <FaTrashAlt /> Cancel Service
                </button>
              </div>

              {isEditing && (
                <button onClick={async () => { 
                   setIsProcessing(true); 
                   await updateDoc(doc(db, 'bookings', booking.id), editData); 
                   setBooking(editData); setIsEditing(false); setIsProcessing(false); toast.success("Updated!"); 
                }} className="w-full py-4 bg-orange-600 text-white rounded-xl font-black uppercase text-[10px] shadow-lg">
                  {isProcessing ? <FaSpinner className="animate-spin mx-auto"/> : "Save Changes"}
                </button>
              )}

              {/* Cancellation Overlay */}
              <AnimatePresence>
                {showCancelConfirm && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                     className="w-full absolute inset-0 bg-white  z-20 flex flex-col items-center justify-center p-4 text-center">
                    <FaExclamationTriangle className="text-orange-500 text-4xl mb-4" />
                    <h3 className="text-xl font-black uppercase italic leading-tight mb-2">Refund Policy</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed mb-6">
                      Cancellations incur a <span className="text-red-600">15% service charge</span> for mobilization and slot reservation.
                    </p>
                    
                    <div className="w-full bg-slate-50 rounded-2xl p-4 border mb-6 space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase">
                        <span className="text-slate-400">Paid Amount:</span>
                        <span>£{booking.total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-black uppercase">
                        <span className="text-slate-400">Service Fee (15%):</span>
                        <span className="text-red-500">- £{(booking.total * 0.15).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                        <span className="text-[11px] font-black uppercase">Total Refund:</span>
                        <span className="text-lg font-black text-green-600 italic">£{(booking.total * 0.85).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col w-full gap-3">
                      <button 
                        onClick={handleCancelBooking} 
                        disabled={isProcessing}
                        className="w-full py-4 bg-red-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-2"
                      >
                        {isProcessing ? <FaSpinner className="animate-spin" /> : "Continue & Cancel"}
                      </button>
                      <button onClick={() => setShowCancelConfirm(false)} className="p-3 rounded-lg bg-black text-slate-200 font-black uppercase text-[9px] hover:bg-gray-900 transition-colors">Go Back</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};