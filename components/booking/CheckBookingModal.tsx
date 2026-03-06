"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaEnvelope, FaPhone, FaReceipt, FaLock, FaUser, FaCheck, FaBroom } from 'react-icons/fa';
import { db, auth } from '@/lib/firebase'; 
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';
import emailjs from '@emailjs/browser';

export const CheckBookingModal = ({ onClose }: any) => {
  const [SID, TID, PK] = ['service_0s7i0pu', 'template_faeqkkg', 'GK69-FWwlvVZogZ1D'];
  const COUNTRY_CODE = '+234'; 
  const COUNTRY_NAME = COUNTRY_CODE.includes('44') ? 'UK' : 'Nigeria';

  useEffect(() => { emailjs.init(PK); }, []);

  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState(''), [view, setView] = useState('input');
  const [isProcessing, setIsProcessing] = useState(false), [vCode, setVCode] = useState('');
  const [genCode, setGenCode] = useState(''), [confResult, setConfResult] = useState<any>(null); 
  const [booking, setBooking] = useState<any>(null), [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [nDate, setNDate] = useState(''), [nTime, setNTime] = useState('');

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
  };

  const checkDeadline = () => {
    if (!booking) return false;
    const bDate = new Date(`${booking.bookingDate}T${booking.bookingTime || '00:00'}`);
    return (bDate.getTime() - new Date().getTime()) / (36e5) < 48;
  };

  const handleRequestAuth = async () => {
    if (!identifier) return toast.error(`Enter ${authMethod}`);
    setIsProcessing(true);
    try {
      const bRef = collection(db, 'bookings');
      if (authMethod === 'email') {
        const snap = await getDocs(query(bRef, where('userEmail', '==', identifier.trim())));
        if (snap.empty) throw new Error('No booking found.');
        const d = snap.docs[0].data();
        setBooking({ id: snap.docs[0].id, ...d }); setEditData({ id: snap.docs[0].id, ...d });
        const c = Math.floor(1e3 + Math.random() * 9e3).toString(); setGenCode(c);
        await emailjs.send(SID, TID, { email: identifier.trim(), passcode: c, user_name: d.fullName || 'Customer' }, PK);
        toast.success('Code sent!'); setView('verify');
      } else {
        const c = identifier.replace(/[\s\-\(\)]/g, ''), num = COUNTRY_CODE.replace('+', '');
        const vars = [...new Set([c, `+${c}`, COUNTRY_CODE + c.substring(1), '+' + c, COUNTRY_CODE + c])];
        const snap = await getDocs(query(bRef, where('phoneNumber', 'in', vars)));
        if (snap.empty) throw new Error('No booking found.');
        const d = snap.docs[0].data();
        setBooking({ id: snap.docs[0].id, ...d }); setEditData({ id: snap.docs[0].id, ...d });
        setupRecaptcha();
        const fPhone = c.startsWith('+') ? c : c.startsWith(num) ? `+${c}` : c.startsWith('0') ? COUNTRY_CODE + c.substring(1) : COUNTRY_CODE + c;
        setConfResult(await signInWithPhoneNumber(auth, fPhone, (window as any).recaptchaVerifier));
        toast.success('SMS sent!'); setView('verify');
      }
    } catch (e: any) { toast.error(e.message); } finally { setIsProcessing(false); }
  };

  const handleUpdateInfo = async () => {
    if (checkDeadline()) return toast.error("Too late to edit (48h)");
    setIsProcessing(true);
    try {
      const updatePayload = {
        fullName: editData.fullName,
        phoneNumber: editData.phoneNumber,
        address: editData.address,
        bookingDate: editData.bookingDate,
        bookingTime: editData.bookingTime
      };
      await updateDoc(doc(db, 'bookings', booking.id), updatePayload);
      setBooking({ ...booking, ...updatePayload }); 
      setIsEditing(false); toast.success("Updated!");
    } catch (e) { toast.error("Update failed."); } finally { setIsProcessing(false); }
  };

  const handleReschedule = async () => {
    if (!nDate || !nTime) return toast.error("Pick date & time");
    if (checkDeadline()) return toast.error("Too late (48h)");
    setIsProcessing(true);
    try {
      const snap = await getDocs(query(collection(db, 'bookings'), where('bookingDate', '==', nDate), where('bookingTime', '==', nTime)));
      if (!snap.empty) throw new Error("Slot taken!");
      await updateDoc(doc(db, 'bookings', booking.id), { bookingDate: nDate, bookingTime: nTime });
      setBooking({ ...booking, bookingDate: nDate, bookingTime: nTime });
      setView('details'); toast.success("Rescheduled!");
    } catch (e: any) { toast.error(e.message); } finally { setIsProcessing(false); }
  };

  const handleVerify = async () => {
    if (authMethod === 'email' ? vCode === genCode : await confResult.confirm(vCode)) { setView('details'); toast.success('Verified!'); }
    else toast.error('Invalid Code');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[300] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-3 text-slate-900">
      <div className="bg-white px-4 py-6 md:p-6 rounded-xl max-w-md w-full relative shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div id="recaptcha-container"></div>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-300 hover:text-orange-500"><FaTimes /></button>

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
               <input type={authMethod === 'email' ? 'email' : 'tel'} placeholder={authMethod === 'email' ? 'your@email.com' : `${COUNTRY_CODE} 801...`} value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full p-4 pl-12 bg-slate-50 border rounded-xl text-xs font-bold outline-none focus:border-orange-500" />
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

        {view === 'details' && (
          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center border-b pb-2">
                <h2 className="text-lg font-black uppercase italic">Booking Details</h2>
                {isEditing && (
                  <button onClick={() => setIsEditing(false)} className="text-orange-600 font-black text-[9px] uppercase bg-orange-50 px-2 py-1 rounded-md">Cancel</button>
                )}
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border space-y-3 shadow-inner">
                <div className="grid gap-3">
                    {[['Name', 'fullName'], ['Phone', 'phoneNumber'], ['Address', 'address']].map(([l, f]) => (
                      <div key={f}>
                        <label className="text-[8px] font-black text-slate-400 uppercase">{l}</label>
                        {isEditing ? <input value={editData[f]} onChange={(e)=>setEditData({...editData, [f]: e.target.value})} className="w-full p-1.5 bg-white border rounded text-xs font-bold" /> : <p className="text-[11px] font-bold">{booking?.[f]}</p>}
                      </div>
                    ))}

                    <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-[8px] font-black text-slate-400 uppercase">Date</label>
                          {isEditing ? <input type="date" value={editData.bookingDate} onChange={(e)=>setEditData({...editData, bookingDate: e.target.value})} className="w-full p-1.5 bg-white border rounded text-xs font-bold" /> : <p className="text-[11px] font-bold">{booking?.bookingDate}</p>}
                        </div>
                        <div><label className="text-[8px] font-black text-slate-400 uppercase">Time</label>
                          {isEditing ? <input type="time" value={editData.bookingTime} onChange={(e)=>setEditData({...editData, bookingTime: e.target.value})} className="w-full p-1.5 bg-white border rounded text-xs font-bold" /> : <p className="text-[11px] font-bold">{booking?.bookingTime}</p>}
                        </div>
                    </div>

                    <div>
                      <label className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-1"><FaBroom size={8}/> Selected Areas</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {booking?.roomDetails?.map((room: any, i: number) => (
                          <span key={i} className="text-[9px] bg-white border border-slate-200 px-2 py-0.5 rounded-full font-bold text-slate-600">
                            {room.count}x {room.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t flex justify-between items-center">
                      <label className="text-[8px] font-black text-slate-400 uppercase">Total Paid</label>
                      <p className="text-[13px] font-black text-green-600">£{booking?.total?.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {isEditing ? <button onClick={handleUpdateInfo} className="w-full py-3 bg-green-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"><FaCheck /> Save Changes</button> : 
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { if(checkDeadline()) return toast.error("Too late (48h)"); setIsEditing(true); }} className="py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[9px] tracking-widest">Edit Booking</button>
                <Link href={`/receipts/${booking?.id}`} className="flex items-center justify-center py-3 bg-white border-2 border-slate-900 text-slate-900 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-sm"><FaReceipt className="mr-1" /> Receipt</Link>
              </div>
            }
          </div>
        )}

        <AnimatePresence>
            {view === 'reschedule' && (
                <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="absolute inset-0 bg-white p-8 z-50 flex flex-col justify-center">
                    <button onClick={() => setView('details')} className="absolute top-6 left-6 text-slate-400 font-black uppercase text-[9px]">← Back</button>
                    <div className="text-center space-y-6">
                        <h2 className="text-xl font-black uppercase italic tracking-tighter">New Date & Time</h2>
                        <div className="space-y-4">
                            <input type="date" min={new Date().toISOString().split('T')[0]} value={nDate} onChange={(e) => setNDate(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-sm text-slate-900" />
                            <input type="time" value={nTime} onChange={(e) => setNTime(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-sm text-slate-900" />
                        </div>
                        <button onClick={handleReschedule} disabled={isProcessing} className="w-full py-4 bg-orange-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px]">{isProcessing ? 'Saving...' : 'Update Booking'}</button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};