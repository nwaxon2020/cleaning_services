"use client";

import { useState, useEffect, memo } from 'react';
import { db, auth } from '@/lib/firebase';
import { 
  collection, query, orderBy, onSnapshot, 
  addDoc, serverTimestamp, where, doc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { 
  FaWhatsapp, FaComments, FaTimes, FaSpinner, FaExclamationTriangle, 
  FaSearch, FaEdit, FaTrash, FaCheck, FaGoogle, FaEnvelope, FaUserLock, 
  FaMapMarkerAlt, FaPhone 
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import emailjs from '@emailjs/browser';
import Link from 'next/link';

const WHATSAPP_BOILERPLATE = "Hi Isundunrin Rentals, I am interested in your *{{SERVICE}}* service. Could you provide more details?";

// --- SUB-COMPONENT: Compact Service Card ---
const ServiceCard = memo(({ item, onImageClick, contactNumber }: any) => (
  <div className="group border border-slate-200 md:rounded-xl overflow-hidden hover:border-purple-300 transition-all bg-white shadow-sm flex flex-col h-full">
    {item.imageUrl && (
      <div 
        className="aspect-[4/3] w-full bg-slate-50 relative overflow-hidden cursor-pointer" 
        onClick={() => onImageClick(item)}
      >
        <img src={item.imageUrl} alt={item.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-black/20 md:opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <p className='uppercase font-black text-xs md:text-sm text-white underline md:no-underline'>get quote</p>
        </div>
      </div>
    )}
    <div className="p-2 md:p-3 flex-1 flex flex-col">
      <div className="flex justify-between items-start gap-2 mb-1">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight line-clamp-1 flex-1">{item.name}</h3>
        <button onClick={() => onImageClick(item)} className="hidden md:block underline text-[10px] font-black text-red-800 uppercase hover:text-purple-800 transition-colors whitespace-nowrap">Get Quote</button>
      </div>
      <p className="text-[11px] text-slate-500 line-clamp-2 italic leading-tight">{item.description}</p>
      <div>
         <span className="text-sm font-black text-purple-600 italic">£{item.priceRange}</span>
         <span className="text-xs underline text-slate-400 ml-2 font-bold uppercase">{item.pricePer}</span>
      </div>
      <div className="mt-auto pt-2 border-t border-orange-200 flex items-center justify-between">
        <div className="flex flex-col md:flex-row gap-2 w-full mt-auto pt-2 border-t border-slate-50">
            <button className="w-full">
                <a href={`https://wa.me/${contactNumber}?text=${encodeURIComponent(WHATSAPP_BOILERPLATE.replace("{{SERVICE}}", item.name))}`} target="_blank" rel="noopener noreferrer" className="text-xs font-black w-full flex justify-center items-center py-2 bg-emerald-400 text-white rounded-lg hover:bg-emerald-600 transition-all shadow-sm">
                    WhatsApp <FaWhatsapp size={16} className='ml-1'/>
                </a>
            </button>
            <button onClick={() => window.location.href='/chat'} className="text-xs font-black w-full flex justify-center items-center py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                Chat <FaComments size={14} className='ml-1'/>
            </button>
        </div>
      </div>
    </div>
  </div>
));
ServiceCard.displayName = "ServiceCard";

export default function DecorationServicesUi() {
  const [headerText, setHeaderText] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCheckBooking, setShowCheckBooking] = useState(false);
  const [viewableBookings, setViewableBookings] = useState<any[]>([]);
  const [contactNumber, setContactNumber] = useState("447565123627");
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    fullName: '', phone: '', email: '', address: '', postalCode: '',
    contactPreference: 'WhatsApp', quantity: 1, bidAmount: 0, 
    notes: '', date: '', time: ''
  });

  const [user, setUser] = useState<any>(null);

  // --- AUTH & DATA SYNC ---
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((u) => {
      setUser(u);
      if (u) {
        setFormData(prev => ({ ...prev, fullName: u.displayName || prev.fullName, email: u.email || prev.email }));
        setShowAuthOverlay(false);
      }
    });

    const unsubContact = onSnapshot(doc(db, "settings", "contact_info"), (docSnap) => {
        if (docSnap.exists()) {
            const phone = docSnap.data().generalPhone;
            if (phone) setContactNumber(phone.replace(/\s+/g, '').replace('+', ''));
        }
    });

    const unsubHeader = onSnapshot(doc(db, "settings", "decoration_config"), (s) => s.exists() && setHeaderText(s.data().headerText));
    const unsubItems = onSnapshot(query(collection(db, "decoration_items"), orderBy("createdAt", "desc")), (s) => setItems(s.docs.map(d => ({id: d.id, ...d.data()}))));
    
    return () => { unsubAuth(); unsubContact(); unsubHeader(); unsubItems(); };
  }, []);

  // Fetch User Quotes
  useEffect(() => {
    if (!user || !showCheckBooking) return;
    const q = query(collection(db, "decoration_bookings"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setViewableBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user, showCheckBooking]);

  const googleSignIn = async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); toast.success("Signed in!"); } 
    catch (error) { toast.error("Auth failed"); }
  };

  const handleGetQuote = async () => {
    if (!user) return setShowAuthOverlay(true);
    
    // 1. Clean and Format Postal Code
    const rawPostal = (formData.postalCode || "").trim().toUpperCase();
    const cleanPostal = rawPostal.replace(/\s+/g, ''); 
    
    const { fullName, phone, email, address, date, time, bidAmount, quantity } = formData;
    
    // 2. Validation
    if (!fullName.trim() || !phone.trim() || !email.trim() || !address.trim() || !cleanPostal || !date || !time || bidAmount <= 0) {
      return toast.error("Please fill in all required fields");
    }

    // 3. Bristol Check (Functional Logic)
    // We keep this here so the user gets a nice toast error instead of a silent Firebase denial
    if (!cleanPostal.startsWith('BS')) {
      return toast.error("Currently, we only serve Bristol area (BS postcodes)");
    }
    
    // 4. Price Logic
    const [minRate, maxRate] = selectedItem.priceRange.split('-').map(Number);
    const minAllowed = minRate * quantity;
    const maxAllowed = maxRate * quantity;

    if (bidAmount < minAllowed) return toast.error(`Offer too low. Min is £${minAllowed}`);
    if (bidAmount > maxAllowed) return toast.error(`Offer too high. Max is £${maxAllowed}`);

    const estimateRangeString = `£${minAllowed.toLocaleString()} - £${maxAllowed.toLocaleString()}`;

    setIsSubmitting(true);

    try {
      // 5. Data Submission
      console.log("Submitting with userId:", user.uid);
      console.log("Postal code:", rawPostal);
      console.log("Postal code starts with BS?", rawPostal.startsWith('BS'));

      // We send 'userId' so the 'isOwner' rule in your Firebase Rules works for 'My Quotations'
      await addDoc(collection(db, "decoration_bookings"), {
        userId: user.uid,              // CRITICAL: Links the doc to the user
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        postalCode: rawPostal,         // Saved as "BS1 1AA"
        date: date,
        time: time,
        bidAmount: Number(bidAmount),  // Ensure it's a number, not a string
        quantity: Number(quantity),
        contactPreference: formData.contactPreference,
        notes: formData.notes || "",
        estimateRange: estimateRangeString, 
        serviceId: selectedItem.id,
        serviceName: selectedItem.name,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      toast.success("Quote request submitted!");
      setSelectedItem(null);
    } catch (e: any) { 
      console.error("FIREBASE ERROR:", e.code, e.message);
      toast.error(`Submission failed: ${e.code === 'permission-denied' ? 'Check Account Status' : 'Check Connection'}`); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleUpdateBooking = async () => {
    if (!editingBooking || !user) return;
    try {
      const bookingRef = doc(db, "decoration_bookings", editingBooking.id);
      await updateDoc(bookingRef, {
        phone: editingBooking.phone,
        address: editingBooking.address,
        postalCode: editingBooking.postalCode.toUpperCase(),
        date: editingBooking.date,
        time: editingBooking.time
      });
      toast.success("Updated successfully");
      setEditingBooking(null);
    } catch (e) { 
      console.error("Update Error:", e);
      toast.error("Update failed: Permission Denied"); 
    }
  };

  const handleDeleteBooking = async () => {
    if (!deleteConfirm || !user) return;
    try {
      await deleteDoc(doc(db, "decoration_bookings", deleteConfirm.id));
      toast.success("Request cancelled");
      setDeleteConfirm(null);
    } catch (e) { 
      console.error("Delete Error:", e);
      toast.error("Delete failed: Permission Denied"); 
    }
  };

  return (
    <div className="bg-[#FCFCFC] min-h-screen p-0 pt-4">
      <div className="max-w-[1600px] mx-auto px-1.5 md:px-4">
        <div className="flex flex-col md:flex-row gap-3 md:gap-6 justify-center items-center mb-3 md:mb-6 border-b border-slate-300 md:border-slate-100 py-4">
          <h2 className="px-4 md:px-0 text-center md:text-left text-sm md:text-lg font-black uppercase italic tracking-tighter text-slate-800">
            {headerText || "Decoration Services"}
          </h2>
          <button onClick={() => user ? setShowCheckBooking(true) : setShowAuthOverlay(true)} className="bg-slate-900 text-white px-4 py-2.5 rounded-lg font-black text-[9px] uppercase flex items-center gap-2 tracking-widest">
            <FaSearch size={8} /> My Quotations
          </button>
        </div>

        <div className="mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-1.5 md:gap-3">
          {items.map(item => (
            <div key={item.id} className='mb-4'>
                <ServiceCard item={item} contactNumber={contactNumber} onImageClick={(i: any) => setSelectedItem(i)} />
            </div>
          ))}
        </div>
      </div>

      {/* AUTH OVERLAY */}
      <AnimatePresence>
        {showAuthOverlay && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white w-full max-w-sm p-8 rounded-[2.5rem] text-center relative shadow-2xl">
              <button onClick={() => setShowAuthOverlay(false)} className="absolute top-6 right-6 text-slate-400 hover:text-black transition-all"><FaTimes /></button>
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6"><FaUserLock size={24} /></div>
              <h2 className="text-2xl font-black uppercase italic mb-2 leading-none">Account <span className="text-blue-600">Required</span></h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Please sign in to proceed</p>
              <div className="space-y-3">
                <button onClick={googleSignIn} className="w-full py-4 bg-slate-50 border-2 border-slate-300 md:border-slate-100 rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all shadow-sm"><FaGoogle className="text-red-500" /> Continue with Google</button>
                <Link href="/login" className="w-full py-4 bg-black text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all block shadow-lg"><FaEnvelope /> Email & Password</Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: Get Quote Form */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2">
            <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="bg-white w-full max-w-4xl h-[95vh] rounded-md md:rounded-2xl overflow-hidden flex flex-col md:flex-row relative">
              <button onClick={() => setSelectedItem(null)} className="absolute top-8 md:top-4 right-4 p-2 bg-slate-100 rounded-full z-10 hover:bg-red-500 hover:text-white transition-all"><FaTimes /></button>
              
              <div className="hidden md:block w-1/3 bg-slate-50 relative">
                <img src={selectedItem.imageUrl} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-6 flex flex-col justify-end text-white">
                  <h4 className="font-black text-sm uppercase italic">{selectedItem.name}</h4>
                  <p className="text-[10px] font-bold opacity-70">Price Guide: £{selectedItem.priceRange} {selectedItem.pricePer}</p>
                </div>
              </div>

              <div className="flex-1 px-4 py-10 md:p-6 overflow-y-auto custom-scrollbar flex flex-col">
                <h3 className="text-xl font-black uppercase italic mb-6">Service <span className="text-purple-600">Quote</span></h3>
                
                <div className="space-y-6">

                  {/* QUOTE SPECIFICS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <div className="w-1/2">
                           <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Units/Rooms</label>
                           <input type="number" min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} className="w-full p-3 bg-slate-50 border rounded-md md:rounded-xl text-xs font-bold" />
                        </div>
                        <div className="w-1/2">
                           <label className="text-[10px] font-black uppercase text-purple-600 block mb-1">Your Offer (£)</label>
                           <input type="number" value={formData.bidAmount} onChange={e => setFormData({...formData, bidAmount: Number(e.target.value)})} className="w-full p-3 bg-purple-50 border-2 border-purple-100 rounded-md md:rounded-xl text-xs font-black" />
                        </div>                     
                      </div> 

                      {/* Mobile Estimated price range */}
                      <div className="md:hidden p-4 bg-slate-900 rounded-md md:rounded-xl text-white flex flex-col justify-center items-center">
                          <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest mb-1">Guide for {formData.quantity} Units</span>
                          <span className="text-xl font-black italic text-orange-400">
                              £{(Number(selectedItem.priceRange.split('-')[0]) * formData.quantity).toLocaleString()} - £{(Number(selectedItem.priceRange.split('-')[1]) * formData.quantity).toLocaleString()}
                          </span>
                          <p className="text-xs font-bold mt-2 text-center text-white italic">Offers must fall within this professional range</p>
                      </div> 

                      {/* Date and time */}
                      <div className="flex gap-2">
                        <div className="w-1/2"><input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-md md:rounded-xl text-xs font-bold" /></div>
                        <div className="w-1/2">
                          <select value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full p-3 bg-slate-50 border rounded-md md:rounded-xl text-xs font-bold outline-none">
                            <option value="">Select Your Time</option>
                            <option value="08:00">08:00 AM</option>
                            <option value="12:00">12:00 PM</option>
                            <option value="16:00">04:00 PM</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Estimated price range */}
                    <div className="hidden p-4 bg-slate-900 rounded-md md:rounded-xl text-white md:flex flex-col justify-center items-center">
                        <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest mb-1">Guide for {formData.quantity} Units</span>
                        <span className="text-xl font-black italic text-orange-400">
                            £{(Number(selectedItem.priceRange.split('-')[0]) * formData.quantity).toLocaleString()} - £{(Number(selectedItem.priceRange.split('-')[1]) * formData.quantity).toLocaleString()}
                        </span>
                        <p className="text-xs font-bold mt-2 text-center text-white italic">Offers must fall within this professional range</p>
                    </div> 
                  </div>

                  {/* CONTACT FORM DESIGN FOR QUOTES */}
                  <div className="bg-slate-50/50 p-3 md:p-5 rounded-md border border-slate-200/60 shadow-inner space-y-4">
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <div className="h-2 w-2 bg-purple-600 rounded-full animate-pulse"></div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Delivery & Contact Info</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* SHARED ADDRESS & POSTCODE ROW */}
                      <div className="relative group md:col-span-1">
                        <label className="absolute -top-2 left-3 bg-white px-2 text-[9px] font-black uppercase text-purple-600 z-10 rounded-full border border-slate-300 md:border-slate-100 shadow-sm">Event Address</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={formData.address} 
                            onChange={e => setFormData({...formData, address: e.target.value})} 
                            placeholder="Full location" 
                            className="w-full p-4 bg-white border-2 border-slate-300 md:border-slate-100 rounded-md md:rounded-xl text-xs font-bold outline-none focus:border-purple-500" 
                          />
                          <FaMapMarkerAlt className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 opacity-50" size={14} />
                        </div>
                      </div>

                      {/* FIXED BRISTOL POSTAL CODE FIELD - SAME ROW AS ADDRESS */}
                      <div className="relative group md:col-span-1">
                        <label className="absolute -top-2 left-3 bg-white px-2 text-[9px] font-black uppercase text-orange-600 z-10 rounded-full border border-slate-300 md:border-slate-100 shadow-sm">Postal Code (Bristol Only)</label>
                        <input 
                          type="text" 
                          value={formData.postalCode || ''} 
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase();
                            setFormData({...formData, postalCode: value});
                          }} 
                          placeholder="e.g. BS1 1AA" 
                          className="w-full p-4 bg-white border-2 border-slate-300 md:border-slate-100 rounded-md md:rounded-xl text-xs font-bold outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-50"
                        />
                        {formData.postalCode && !formData.postalCode.startsWith('BS') && (
                          <p className="text-[9px] font-bold text-red-500 mt-1 ml-1">⚠️ We only serve Bristol area (BS postcodes)</p>
                        )}
                      </div>

                      <div className="relative group">
                        <label className="absolute -top-2 left-3 bg-white px-2 text-[9px] font-black uppercase text-purple-600 z-10 rounded-full border border-slate-300 md:border-slate-100 shadow-sm">Full Name</label>
                        <input 
                          type="text" 
                          value={formData.fullName} 
                          onChange={e => setFormData({...formData, fullName: e.target.value})} 
                          className="w-full p-4 bg-white border-2 border-slate-300 md:border-slate-100 rounded-md md:rounded-xl text-xs font-bold outline-none focus:border-purple-500" 
                        />
                      </div>

                      <div className="relative group">
                        <label className="absolute -top-2 left-3 bg-white px-2 text-[9px] font-black uppercase text-purple-600 z-10 rounded-full border border-slate-300 md:border-slate-100 shadow-sm">WhatsApp / Phone</label>
                        <input 
                          type="tel" 
                          value={formData.phone} 
                          onChange={e => setFormData({...formData, phone: e.target.value})} 
                          className="w-full p-4 bg-white border-2 border-slate-300 md:border-slate-100 rounded-md md:rounded-xl text-xs font-bold outline-none focus:border-purple-500" 
                        />
                      </div>

                      <div className="relative group">
                        <label className="absolute -top-2 left-3 bg-white px-2 text-[9px] font-black uppercase text-purple-600 z-10 rounded-full border border-slate-300 md:border-slate-100 shadow-sm">Email Address</label>
                        <input 
                          type="email" 
                          value={formData.email} 
                          onChange={e => setFormData({...formData, email: e.target.value})} 
                          className="w-full p-4 bg-white border-2 border-slate-300 md:border-slate-100 rounded-md md:rounded-xl text-xs font-bold outline-none focus:border-purple-500" 
                        />
                      </div>

                      <div className="relative group">
                        <label className="absolute -top-2 left-3 bg-white px-2 text-[9px] font-black uppercase text-purple-600 z-10 rounded-full border border-slate-300 md:border-slate-100 shadow-sm">Preferred Contact Method</label>
                        <select 
                          value={formData.contactPreference} 
                          onChange={e => setFormData({...formData, contactPreference: e.target.value})} 
                          className="w-full p-4 bg-white border-2 border-slate-300 md:border-slate-100 rounded-md md:rounded-xl text-xs font-bold outline-none appearance-none focus:border-purple-500"
                        >
                          <option value="WhatsApp">▼ Send via WhatsApp</option>
                          <option value="Phone Call">▼ Direct Phone Call</option>
                          <option value="Email">▼ Email Notification</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <button onClick={handleGetQuote} disabled={isSubmitting} className="flex justify-center items-center w-full mt-8 bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-purple-600 transition-all shadow-xl">
                    {isSubmitting ? <FaSpinner className="animate-spin" /> : 'Submit Quote Request'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: My Quotations List */}
      <AnimatePresence>
        {showCheckBooking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[150] bg-slate-900/90 flex items-center justify-center p-2">
            <div className="bg-white w-full max-w-4xl h-[90vh] rounded-xl px-4 py-6 md:p-10 flex flex-col relative overflow-hidden">
              <button onClick={() => setShowCheckBooking(false)} className="absolute top-6 right-6 text-slate-400 hover:text-red-500 transition-all"><FaTimes size={20} /></button>
              <div className="flex-1 overflow-y-auto custom-scrollbar md:pr-2">
                <h2 className="text-xl font-black uppercase italic mb-6 border-b pb-2">My <span className="text-purple-600">Quotations</span></h2>
                {/* Each Card in My Quotes */}
                {viewableBookings.length > 0 ? viewableBookings.map(b => (
                  <div key={b.id} className="p-4 bg-slate-50 border border-slate-200 md:rounded-xl mb-4 shadow-sm">
                    {editingBooking?.id === b.id ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input value={editingBooking.phone} onChange={e => setEditingBooking({...editingBooking, phone: e.target.value})} className="p-3 border rounded-xl text-xs" />
                          <input value={editingBooking.date} onChange={e => setEditingBooking({...editingBooking, date: e.target.value})} type="date" className="p-3 border rounded-xl text-xs" />
                          <button onClick={handleUpdateBooking} className="bg-purple-600 text-white py-2 rounded-xl font-black text-[10px] uppercase">Save Changes</button>
                        </div>
                    ) : (
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                        <div>
                          <p className="text-[8px] font-black uppercase text-slate-400">Order Ref: {b.id.slice(0,8).toUpperCase()}</p>
                          <h4 className="text-xs font-black uppercase text-slate-800">{b.serviceName}</h4>
                          <p className="text-[10px] text-slate-500">Offer: £{b.bidAmount} • {b.date} at {b.time}</p>
                          <p className="text-[10px] text-slate-400 italic">Estimate was: {b.estimateRange}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${b.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>{b.status}</span>
                          <button onClick={() => setEditingBooking(b)} className="p-2 text-slate-400 hover:text-purple-600"><FaEdit size={14}/></button>
                          <button onClick={() => setDeleteConfirm(b)} className="p-2 text-slate-400 hover:text-red-600"><FaTrash size={14}/></button>
                        </div>
                      </div>
                    )}
                  </div>
                )) : ( <div className='flex flex-col items-center justify-center py-24 text-slate-400'><FaSearch size={40} className='mb-4 opacity-10' /><p className='font-black uppercase text-xs tracking-widest'>No quotations found</p></div> )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl">
              <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
              <h3 className="font-black uppercase text-sm mb-2">Cancel Quote?</h3>
              <p className="text-[10px] text-slate-500 mb-6 uppercase tracking-widest font-bold">This request will be removed from our system.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-black text-[10px] uppercase">Keep it</button>
                <button onClick={handleDeleteBooking} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase">Yes, Delete</button>
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