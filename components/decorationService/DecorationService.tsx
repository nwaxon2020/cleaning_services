"use client";

import { useState, useEffect, useMemo, memo } from 'react';
import { db, auth } from '@/lib/firebase';
import { 
  collection, query, orderBy, onSnapshot, 
  addDoc, serverTimestamp, getDocs, where, doc, updateDoc, deleteDoc, 
  getDoc
} from 'firebase/firestore';
import { 
  FaWhatsapp, FaComments, FaTimes, 
  FaSpinner, FaExclamationTriangle, 
  FaSearch, FaLock, FaEdit, FaTrash, FaCheck
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import emailjs from '@emailjs/browser';

const WHATSAPP_BOILERPLATE = "Hi Isundunrin Rentals, I am interested in your *{{SERVICE}}* service. Could you provide more details?";

// --- SUB-COMPONENT: Compact Service Card ---
const ServiceCard = memo(({ item, onImageClick, contactNumber }: any) => (
  <div className="group border border-slate-100 rounded-xl overflow-hidden hover:border-purple-300 transition-all bg-white shadow-sm flex flex-col h-full">
    {item.imageUrl && (
      <div 
        className="aspect-[4/3] w-full bg-slate-50 relative overflow-hidden cursor-pointer" 
        onClick={() => onImageClick(item)}
      >
        <img 
          src={item.imageUrl} 
          alt={item.name} 
          loading="lazy" 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <p className='uppercase font-black text-sm text-white'>get quote</p>
        </div>
      </div>
    )}
    <div className="p-3 flex-1 flex flex-col">
      <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight line-clamp-1 mb-0">{item.name}</h3>
      <p className="text-[11px] text-slate-500 line-clamp-2 italic leading-tight">
        {item.description}
      </p>
        <div>
           <span className="text-sm font-black text-purple-600 italic">£{item.priceRange}</span>
           <span className="text-xs underline text-slate-400 ml-2 font-bold uppercase">{item.pricePer}</span>
        </div>
      <div className="mt-auto pt-2 border-t border-orange-200 flex items-center justify-between">
        
        <div className="flex flex-col md:flex-row gap-2 w-full mt-auto pt-2 border-t border-slate-50">
            <button className="w-full">
                <a 
                    href={`https://wa.me/${contactNumber}?text=${encodeURIComponent(
                        WHATSAPP_BOILERPLATE.replace("{{SERVICE}}", item.name)
                    )}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs font-black w-full flex justify-center items-center py-2 bg-emerald-400 text-white rounded-lg hover:bg-emerald-600 transition-all shadow-sm"
                >
                    WhatsApp <FaWhatsapp size={16} className='ml-1'/>
                </a>
            </button>
            
            <button 
                onClick={() => window.location.href='/chat'} 
                className="text-xs font-black w-full flex justify-center items-center py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
            >
                Chat <FaComments size={14} className='ml-1'/>
            </button>
        </div>
      </div>
    </div>
  </div>
));
ServiceCard.displayName = "ServiceCard";

export default function DecorationServicesUi() {
  // --- STATES ---
  const [headerText, setHeaderText] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOverlay, setSuccessOverlay] = useState<{passcode: string} | null>(null);
  const [showCheckBooking, setShowCheckBooking] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [viewableBookings, setViewableBookings] = useState<any[] | null>(null);
  const [contactNumber, setContactNumber] = useState("447565123627");
  
  // Edit/Delete States
  const [editingBooking, setEditingBooking] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    fullName: '', phone: '', email: '',
    contactPreference: 'WhatsApp', // Logic added
    quantity: 1, bidAmount: 0, notes: '',
    date: '', time: ''
  });

  // --- DATA SYNC ---
  useEffect(() => {
    const unsubContact = onSnapshot(doc(db, "settings", "contact_info"), (docSnap) => {
        if (docSnap.exists()) {
            const phone = docSnap.data().generalPhone;
            if (phone) setContactNumber(phone.replace(/\s+/g, '').replace('+', ''));
        }
    });

    const unsubHeader = onSnapshot(doc(db, "settings", "decoration_config"), (s) => s.exists() && setHeaderText(s.data().headerText));
    const unsubItems = onSnapshot(query(collection(db, "decoration_items"), orderBy("createdAt", "desc")), (s) => setItems(s.docs.map(d => ({id: d.id, ...d.data()}))));
    
    if (auth.currentUser) {
      setFormData(prev => ({...prev, fullName: auth.currentUser?.displayName || '', email: auth.currentUser?.email || ''}));
    }
    return () => { unsubContact(); unsubHeader(); unsubItems(); };
  }, []);

  // --- HANDLERS ---
  const handleGetQuote = async () => {
    const { fullName, phone, email, date, time, bidAmount } = formData;
    if (!fullName || !phone || !email || !date || !time) return toast.error("Missing required fields");
    
    const [min, max] = selectedItem.priceRange.split('-').map(Number);
    if (bidAmount < min || bidAmount > max) return toast.error(`Offer must be £${min} - £${max}`);

    setIsSubmitting(true);
    const passcode = Math.floor(1000 + Math.random() * 9000).toString();

    try {
      await addDoc(collection(db, "decoration_bookings"), {
        ...formData,
        serviceId: selectedItem.id,
        serviceName: selectedItem.name,
        passcode,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setSuccessOverlay({ passcode });
    } catch (e) { toast.error("Submission failed"); }
    finally { setIsSubmitting(false); }
  };

  const handleForgotPasscode = async () => {
    if (!formData.email) return toast.error("Enter your email");
    const loadingToast = toast.loading("Sending code...");
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    try {
      await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', {
        to_email: formData.email,
        verification_code: verificationCode,
      }, 'YOUR_PUBLIC_KEY');
      toast.success("Check your email!", { id: loadingToast });
    } catch (e) { toast.error("Failed to send email", { id: loadingToast }); }
  };

  const checkPasscode = async () => {
    const q = query(collection(db, "decoration_bookings"), where("passcode", "==", passcodeInput));
    const snap = await getDocs(q);
    if (snap.empty) return toast.error("Incorrect passcode");
    setViewableBookings(snap.docs.map(d => ({id: d.id, ...d.data()})));
  };

  const handleUpdateBooking = async () => {
    if (!editingBooking) return;
    try {
      const docRef = doc(db, "decoration_bookings", editingBooking.id);
      await updateDoc(docRef, {
        phone: editingBooking.phone,
        address: editingBooking.address,
        date: editingBooking.date,
        time: editingBooking.time
      });
      toast.success("Booking updated");
      setEditingBooking(null);
      checkPasscode(); // Refresh list
    } catch (e) { toast.error("Update failed"); }
  };

  const handleDeleteBooking = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteDoc(doc(db, "decoration_bookings", deleteConfirm.id));
      toast.success("Booking cancelled");
      setDeleteConfirm(null);
      checkPasscode(); // Refresh list
    } catch (e) { toast.error("Deletion failed"); }
  };

  return (
    <div className="bg-[#FCFCFC] min-h-screen p-0 pt-4">
      <div className="max-w-[1600px] mx-auto px-4">
        {/* Compact Header */}
        <div className="flex gap-6 justify-center items-center mb-6 border-b border-slate-100 py-4">
          <h2 className="text-sm md:text-lg font-black uppercase italic tracking-tighter text-slate-800">
            {headerText || "Decoration Services"}
          </h2>
          <button 
            onClick={() => setShowCheckBooking(true)}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg font-black text-[9px] uppercase flex items-center gap-2 tracking-widest"
          >
            <FaSearch size={8} /> My Quotations
          </button>
        </div>

        {/* Compact Grid */}
        <div className="mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-3">
          {items.map(item => (
            <div key={item.id} className='mb-4'>
                <ServiceCard  
                    item={item} 
                    contactNumber={contactNumber}
                    onImageClick={(i: any) => setSelectedItem(i)} 
                />
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: Success & Passcode */}
      <AnimatePresence>
        {successOverlay && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[200] bg-purple-700 flex items-center justify-center p-6 text-white text-center">
            <div className="max-w-md">
              <h2 className="text-3xl font-black uppercase italic mb-2 tracking-tighter">Quote Requested</h2>
              <p className="text-[10px] font-bold opacity-70 mb-8 uppercase tracking-widest">A reply will be sent soon from our department.</p>
              <div className="bg-white/10 p-8 rounded-2xl border border-white/20 mb-8">
                <span className="text-[9px] font-black uppercase tracking-widest block mb-1 opacity-50">View Passcode</span>
                <span className="text-6xl font-black tracking-widest">{successOverlay.passcode}</span>
              </div>
              <button onClick={() => setSuccessOverlay(null)} className="px-10 py-3 bg-white text-purple-700 rounded-full font-black uppercase text-[10px] tracking-widest">Close</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: Booking Form */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2">
            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="bg-white w-full max-w-4xl h-[95vh] rounded-2xl overflow-hidden flex flex-col md:flex-row relative">
              <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full z-10 hover:bg-red-500 hover:text-white transition-all"><FaTimes /></button>
              
              <div className="hidden md:block w-1/3 bg-slate-50 relative">
                <img src={selectedItem.imageUrl} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-6 flex flex-col justify-end text-white">
                  <h4 className="font-black text-sm uppercase italic">{selectedItem.name}</h4>
                  <p className="text-[10px] font-bold opacity-70">Price Guide: £{selectedItem.priceRange} {selectedItem.pricePer}</p>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col">
                <h3 className="text-xl font-black uppercase italic mb-6">Service <span className="text-purple-600">Quote</span></h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                    {/* User Info */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400">Full Name</label>
                          <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="Enter name" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-purple-600" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400">WhatsApp / Phone</label>
                          <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="080..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-purple-600" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400">Email Address</label>
                          <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@example.com" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-purple-600" />
                      </div>
                      {/* PREFERRED CONTACT METHOD - Logic added only */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Preferred Contact Method</label>
                        <select 
                          value={formData.contactPreference} 
                          onChange={e => setFormData({...formData, contactPreference: e.target.value})} 
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                        >
                          <option value="WhatsApp">WhatsApp</option>
                          <option value="Phone Call">Phone Call</option>
                          <option value="Email">Email</option>
                        </select>
                      </div>
                    </div>

                    {/* Service Requirements */}
                    <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-1/2 space-y-1">
                        <label className="text-[10px] font-black uppercase text-purple-600">
                            {selectedItem.pricePer?.toLowerCase().includes('m') ? "Total Sq Meters" : "Number of Rooms"}
                        </label>
                        <input type="number" min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} className="w-full p-3 bg-purple-50 border-purple-200 border-2 rounded-lg text-xs font-bold" />
                        </div>
                        
                        <div className="w-1/2 space-y-1">
                        <label className="text-[10px] font-black uppercase text-purple-600">Your Offer (£)</label>
                        <input type="number" value={formData.bidAmount} onChange={e => setFormData({...formData, bidAmount: Number(e.target.value)})} placeholder="0.00" className="w-full p-3 bg-purple-50 border-purple-200 border-2 rounded-lg text-xs font-black text-purple-700 outline-none" />
                        </div>
                    </div>

                    {/* Budget Helper Display */}
                    <div className="p-3 bg-slate-900 rounded-xl text-white">
                        <p className="text-center text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Expected Budget Guide</p>
                        <div className="flex flex-col justify-center items-center">
                        <span className="text-xl font-black italic">
                            £{(Number(selectedItem.priceRange.split('-')[0]) * (formData.quantity || 1)).toLocaleString()} 
                            <span className="text-[10px] text-slate-400 not-italic ml-1"> - </span>
                            £{(Number(selectedItem.priceRange.split('-')[1]) * (formData.quantity || 1)).toLocaleString()}
                        </span>
                        <span className="text-[9px] font-bold bg-purple-600 px-2 py-0.5 rounded uppercase">Based on {formData.quantity} units</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <div className="w-1/2 space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Preferred Date</label>
                        <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-lg text-[10px] font-bold" />
                        </div>
                        <div className="w-1/2 space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400">Preferred Time</label>
                        <select value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-lg text-[10px] font-bold outline-none">
                            <option value="">Select Time</option>
                            <option value="08:00">Morning (08:00)</option>
                            <option value="12:00">Noon (12:00)</option>
                            <option value="16:00">Afternoon (16:00)</option>
                            <option value="20:00">Evening (20:00)</option>
                        </select>
                        </div>
                    </div>
                    <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Additional details (e.g. wall type, specific colors...)" className="w-full p-3 bg-slate-50 border rounded-lg text-xs h-20 resize-none" />
                    </div>
                </div>

                <button onClick={handleGetQuote} disabled={isSubmitting} className="w-full mt-6 bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-purple-600 transition-colors shadow-xl">
                    {isSubmitting ? <FaSpinner className="animate-spin" /> : 'Submit Professional Quote Request'}
                </button>
                </div>
            </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl">
              <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
              <h3 className="font-black uppercase text-sm mb-2">Cancel Booking?</h3>
              <p className="text-[10px] text-slate-500 mb-6 uppercase tracking-widest font-bold">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-black text-[10px] uppercase tracking-widest">No, Keep</button>
                <button onClick={handleDeleteBooking} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-200">Yes, Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}</style>
    </div>
  );
}