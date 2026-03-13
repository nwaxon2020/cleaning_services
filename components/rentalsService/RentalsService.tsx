"use client";

import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs, where, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaMinus, FaTimes, FaShoppingBag, FaSearch, FaLock, FaEnvelope, FaWhatsapp, FaPhone } from 'react-icons/fa';
import PaymentGateway from '@/components/bookings/PaymentGateway'; 
import ShippingInfo from '@/components/bookings/ShippingInfo';
import toast from 'react-hot-toast';
import emailjs from '@emailjs/browser';

export default function RentalsServiceUi() {
  const [slides, setSlides] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [cart, setCart] = useState<{ [key: string]: any }>({});
  
  // UI States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDetailsItem, setSelectedDetailsItem] = useState<any>(null);
  const [showCheckOrder, setShowCheckOrder] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [viewableOrders, setViewableOrders] = useState<any[] | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '', phone: '', email: '',
    contactPreference: 'WhatsApp'
  });

  // Load cart and user info
  useEffect(() => {
    const savedCart = localStorage.getItem('isundunrin_rental_cart');
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (e) { console.error(e); }
    }
    if (auth.currentUser) {
      setFormData(prev => ({...prev, fullName: auth.currentUser?.displayName || '', email: auth.currentUser?.email || ''}));
    }
  }, []);

  useEffect(() => {
    if (Object.keys(cart).length > 0) {
      localStorage.setItem('isundunrin_rental_cart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('isundunrin_rental_cart');
    }
  }, [cart]);

  // Fetch Real-time Data
  useEffect(() => {
    const unsubSlides = onSnapshot(query(collection(db, "renting_slides"), orderBy("createdAt", "desc")), (snap) => {
      setSlides(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubCats = onSnapshot(query(collection(db, "renting_categories"), orderBy("createdAt", "desc")), (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubItems = onSnapshot(query(collection(db, "renting_items"), orderBy("createdAt", "desc")), (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubSlides(); unsubCats(); unsubItems(); };
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides]);

  const toggleItem = (item: any) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[item.id]) { delete newCart[item.id]; } 
      else { newCart[item.id] = { ...item, quantity: 1 }; }
      return newCart;
    });
  };

  const removeItem = (id: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[id];
      return newCart;
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (!newCart[id]) return prev;
      const newQty = (newCart[id].quantity || 1) + delta;
      if (newQty > 0) newCart[id].quantity = newQty;
      return newCart;
    });
  };

  const checkPasscode = async () => {
    const q = query(collection(db, "renting_orders"), where("passcode", "==", passcodeInput));
    const snap = await getDocs(q);
    if (snap.empty) return toast.error("Incorrect passcode");
    setViewableOrders(snap.docs.map(d => ({id: d.id, ...d.data()})));
  };

  const handleForgotPasscode = async () => {
    if (!formData.email) return toast.error("Enter your email in checkout form first");
    const loadingToast = toast.loading("Sending recovery email...");
    try {
      const q = query(collection(db, "renting_orders"), where("email", "==", formData.email));
      const snap = await getDocs(q);
      if (snap.empty) throw new Error("No orders found for this email");
      
      const lastOrder = snap.docs[0].data();
      await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', {
        to_email: formData.email,
        passcode: lastOrder.passcode,
      }, 'YOUR_PUBLIC_KEY');
      toast.success("Passcode sent to your email!", { id: loadingToast });
    } catch (e: any) { toast.error(e.message || "Failed to send email", { id: loadingToast }); }
  };

  const totalPrice = Object.values(cart).reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const colorThemes = [
    { bg: 'bg-fuchsia-600', lightBg: 'bg-fuchsia-50', border: 'border-fuchsia-600', text: 'text-fuchsia-600', heading: 'text-fuchsia-700', cardBg: 'bg-white', cardBorder: 'border-fuchsia-200', accent: 'fuchsia' },
    { bg: 'bg-emerald-600', lightBg: 'bg-emerald-50', border: 'border-emerald-600', text: 'text-emerald-600', heading: 'text-emerald-700', cardBg: 'bg-white', cardBorder: 'border-emerald-200', accent: 'emerald' },
    { bg: 'bg-amber-600', lightBg: 'bg-amber-50', border: 'border-amber-600', text: 'text-amber-600', heading: 'text-amber-700', cardBg: 'bg-white', cardBorder: 'border-amber-200', accent: 'amber' },
    { bg: 'bg-rose-600', lightBg: 'bg-rose-50', border: 'border-rose-600', text: 'text-rose-600', heading: 'text-rose-700', cardBg: 'bg-white', cardBorder: 'border-rose-200', accent: 'rose' },
    { bg: 'bg-violet-600', lightBg: 'bg-violet-50', border: 'border-violet-600', text: 'text-violet-600', heading: 'text-violet-700', cardBg: 'bg-white', cardBorder: 'border-violet-200', accent: 'violet' },
    { bg: 'bg-cyan-600', lightBg: 'bg-cyan-50', border: 'border-cyan-600', text: 'text-cyan-600', heading: 'text-cyan-700', cardBg: 'bg-white', cardBorder: 'border-cyan-200', accent: 'cyan' }
  ];

  return (
    <div className="pb-12 relative min-h-screen bg-[#F8FAFC]">
      {/* HERO SLIDESHOW */}
      <div className="relative h-[45vh] md:h-[65vh] w-full overflow-hidden">
        <AnimatePresence mode="wait">
          {slides.length > 0 ? (
            <motion.img
              key={currentSlide} src={slides[currentSlide]?.url}
              initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }} className="absolute inset-0 w-full h-full object-cover"
            />
          ) : ( <div className="absolute inset-0 bg-slate-200 animate-pulse" /> )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 flex flex-col items-center justify-center text-white text-center p-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-6xl text-orange-500 font-black uppercase italic tracking-tighter">
              Isundunrin <span className="text-blue-500">Rentals</span>
            </h1>
            <p className='hidden md:block text-sm px-3 py-1 rounded-md bg-black/80 tracking-[0.2em]'>Premium materials at your disposal</p>
            <button 
              onClick={() => setShowCheckOrder(true)}
              className="md:hidden mt-4 mx-auto bg-black/80 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white hover:text-blue-600 transition-all"
            >
              <FaSearch /> My Orders
            </button>
          </motion.div>
        </div>
      </div>

      <div className='hidden my-2 mx-4 text-right md:flex justify-end'>
        <button 
          onClick={() => setShowCheckOrder(true)}
          className="w-[15rem] bg-black text-white backdrop-blur-md px-4 py-3 rounded-full text-[10px] font-black uppercase tracking-widest flex justify-center items-center gap-2 hover:bg-white hover:text-blue-600 transition-all"
        >
          <FaSearch /> My Orders
        </button>
      </div>

      {/* RENTAL INVENTORY */}
      <div className="max-w-7xl mx-auto px-2 md:px-4 py-4 md:py-16 md:pb-40">
        {categories.map((cat, idx) => {
          const catItems = items.filter(i => i.categoryId === cat.id);
          if (catItems.length === 0) return null;
          const theme = colorThemes[idx % colorThemes.length];

          return (
            <section key={cat.id} className={`px-3 py-5 md:mb-16 md:p-8 rounded-md md:rounded-3xl ${theme.lightBg}`} style={{ boxShadow: `0 10px 30px -15px ${theme.accent}` }}>
              <div className="flex items-center gap-4 mb-10">
                <span className={`h-1 flex-1 ${theme.bg} rounded-full`}></span>
                <h2 className={`text-sm font-bold uppercase italic tracking-widest px-6 py-3 ${theme.bg} text-white rounded-full shadow-lg`}>
                  {cat.name}
                </h2>
                <span className={`h-1 flex-1 ${theme.bg} rounded-full`}></span>
              </div>
              <div className="grid grid-cols-2 md:flex flex-wrap justify-center gap-3 md:gap-6">
                {catItems.map(item => {
                  const isSelected = !!cart[item.id];
                  return (
                    <motion.div
                      key={item.id} whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }}
                      className={`mb-5 relative flex flex-col md:w-[280px] cursor-pointer rounded-lg md:rounded-[2rem] overflow-hidden transition-all duration-300 md:border-2 ${
                        isSelected ? `${theme.border} ring-4 ${theme.text} ring-opacity-20` : `border-transparent shadow-md hover:${theme.border} hover:shadow-xl`
                      } ${theme.cardBg}`}
                    >
                      <div className="p-3 md:p-6 flex-1" onClick={() => toggleItem(item)}>
                        {isSelected && (
                          <div className={`absolute top-4 right-4 ${theme.bg} text-white w-6 h-6 rounded-full flex items-center justify-center`}>
                            <FaShoppingBag size={10} />
                          </div>
                        )}
                        <h3 className="font-black text-slate-800 text-sm md:text-lg mb-1">{item.name}</h3>
                        <p className={`text-[8px] md:text-[10px] ${theme.text} font-bold uppercase tracking-wider mb-2 md:mb-4 line-clamp-2`}>{item.description || "Premium Hire Item"}</p>
                        <div className="flex items-end justify-between">
                          <span className={`text-xl md:text-2xl font-black ${theme.heading} italic`}>£{item.price}</span>
                          <span className={`text-[10px] ${theme.text} font-black uppercase`}>Per Hire</span>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedDetailsItem(item); }}
                        className={`${theme.bg} text-white text-[9px] md:text-[10px] py-2 md:py-3 font-black uppercase tracking-widest hover:brightness-90 transition-all`}
                      >
                        View Details
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* ITEM DETAILS OVERLAY */}
      <AnimatePresence>
        {selectedDetailsItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedDetailsItem(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white p-6 md:p-8 rounded-xl md:rounded-3xl max-w-lg w-full relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setSelectedDetailsItem(null)} className="absolute top-2 md:top-4 right-2 md:right-4 p-2 bg-slate-100 rounded-full hover:bg-red-500 hover:text-white transition-all"><FaTimes /></button>
              <h2 className="text-xl font-black text-slate-900 uppercase italic mb-2 leading-none">{selectedDetailsItem.name}</h2>
              <div className="h-1 w-20 bg-blue-600 mb-6 rounded-full"></div>
              <p className="text-slate-600 text-sm leading-relaxed mb-8">{selectedDetailsItem.description || "Premium hire item."}</p>
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 font-black uppercase text-[10px] block mb-1">Price</span>
                  <span className="text-3xl font-black text-slate-900 italic">£{selectedDetailsItem.price}</span>
                </div>
                <button onClick={() => { toggleItem(selectedDetailsItem); setSelectedDetailsItem(null); }} className={`${cart[selectedDetailsItem.id] ? 'bg-red-500' : 'bg-slate-900'} text-sm text-white px-6 py-3 rounded-xl font-black uppercase italic tracking-widest transition-all`}>
                  {cart[selectedDetailsItem.id] ? 'Remove Item' : 'Add to Hire'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING ACTION BAR */}
      <AnimatePresence>
        {Object.keys(cart).length > 0 && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="mx-auto sticky bottom-4 md:bottom-3 md:left-1/2 md:-translate-x-1/2 z-[10] w-[90%] max-w-[22rem]">
            <button onClick={() => setIsCheckoutOpen(true)} className="w-full bg-slate-900 text-white p-2 md:p-3 rounded-[2.5rem] font-black uppercase italic tracking-widest flex justify-between items-center shadow-2xl hover:scale-[1.02] transition-all">
              <span className="text-[11px] md:text-xs flex items-center gap-2"><FaShoppingBag /> Continue to Checkout</span>
              <span className="bg-blue-600 p-2 md:px-3 md:py-1 rounded-full text-xs">{Object.keys(cart).length} Items</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHECKOUT DRAWER */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-1 md:p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-lg md:max-w-4xl h-[98vh] shadow-2xl p-1.5 py-6 md:p-6 flex flex-col rounded-md md:rounded-xl relative overflow-hidden">
              <div className="px-2 flex justify-between items-center mb-2">
                <h2 className="text-xl font-black uppercase italic leading-none">Items <span className="text-blue-600">Selected</span></h2>
                <button onClick={() => setIsCheckoutOpen(false)} className="p-3 bg-slate-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"><FaTimes size={15} /></button>
              </div>

              <div className="flex-1 overflow-y-auto md:pr-2 custom-scrollbar space-y-6">
                {/* Items selected for rentals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  {Object.values(cart).map(item => {
                    const itemTheme = colorThemes[categories.findIndex(cat => cat.id === item.categoryId) % colorThemes.length];
                    return (
                      <div key={item.id} className={`m-1 flex items-center justify-between py-1 px-2 ${itemTheme?.lightBg || 'bg-slate-50'} rounded-lg border transition-transform hover:scale-[1.02]`}>
                        <button onClick={() => removeItem(item.id)} className="mr-1 md:mr-2 p-1 text-slate-400 hover:text-red-600"><FaTimes size={12} /></button>
                        <div className="flex-1 flex items-center justify-between mr-2 "><h4 className={`font-bold text-slate-800 text-xs uppercase ${itemTheme?.text}`}>{item.name}</h4><p className={`mx-1 text-xs ${itemTheme?.text} font-bold`}>£{item.price}</p></div>
                        
                        {/* QUANTITY INPUT SECTION */}
                        <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border-2 border-slate-100 shadow-xs">
                          <button 
                            onClick={() => updateQty(item.id, -1)} 
                            className="text-slate-400 hover:text-red-500 p-1"
                          >
                            <FaMinus size={8}/>
                          </button>
                          
                          <input 
                            type="number" 
                            min="1"
                            value={item.quantity} 
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              // Logic: If input is empty, NaN, or less than 1, default to 1
                              const sanitizedVal = (isNaN(val) || val < 1) ? 1 : val;
                              
                              setCart(prev => ({
                                ...prev,
                                [item.id]: { ...prev[item.id], quantity: sanitizedVal }
                              }));
                            }}
                            onBlur={(e) => {
                              // Extra safety: If they leave the input empty, reset to 1
                              if (e.target.value === "") {
                                updateQty(item.id, 0); // This triggers a re-render to the default 1
                              }
                            }}
                            className="w-12 text-center text-xs font-black bg-transparent outline-none border-none focus:ring-0 p-0"
                          />
                          
                          <button 
                            onClick={() => updateQty(item.id, 1)} 
                            className={`${itemTheme?.text} hover:opacity-70 p-1`}
                          >
                            <FaPlus size={8}/>
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>

                {/* Shipping Info */}
                <ShippingInfo totalPrice={totalPrice} />

                {/* CUSTOMER INFO SECTION */}
                <div className="bg-slate-50/50 p-5 rounded-md border border-slate-200/60 shadow-inner space-y-4">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse"></div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Delivery & Contact Info</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="relative group">
                      <label className="absolute -top-2 left-3 bg-white px-2 text-[9px] font-black uppercase text-blue-600 z-10 rounded-full border border-slate-100 shadow-sm">Full Name</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={formData.fullName} 
                          onChange={e => setFormData({...formData, fullName: e.target.value})} 
                          placeholder="e.g. John Doe" 
                          className="w-full p-3 bg-white border-2 border-slate-100 rounded-2xl text-xs font-bold outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-50 placeholder:text-slate-300" 
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div className="relative group">
                      <label className="absolute -top-2 left-3 bg-white px-2 text-[9px] font-black uppercase text-blue-600 z-10 rounded-full border border-slate-100 shadow-sm">WhatsApp / Phone</label>
                      <div className="relative">
                        <input 
                          type="tel" 
                          value={formData.phone} 
                          onChange={e => setFormData({...formData, phone: e.target.value})} 
                          placeholder="+44..." 
                          className="w-full p-3 bg-white border-2 border-slate-100 rounded-2xl text-xs font-bold outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-50 placeholder:text-slate-300" 
                        />
                        <FaWhatsapp className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 opacity-50" size={16} />
                      </div>
                    </div>

                    {/* Email Address */}
                    <div className="relative group md:col-span-1">
                      <label className="absolute -top-2 left-3 bg-white px-2 text-[9px] font-black uppercase text-blue-600 z-10 rounded-full border border-slate-100 shadow-sm">Email Address</label>
                      <div className="relative">
                        <input 
                          type="email" 
                          value={formData.email} 
                          onChange={e => setFormData({...formData, email: e.target.value})} 
                          placeholder="your@email.com" 
                          className="w-full p-3 bg-white border-2 border-slate-100 rounded-2xl text-xs font-bold outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-50 placeholder:text-slate-300" 
                        />
                        <FaEnvelope className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 opacity-50" size={14} />
                      </div>
                    </div>

                    {/* Preferred Contact */}
                    <div className="relative group">
                      <label className="absolute -top-2 left-3 bg-white px-2 text-[9px] font-black uppercase text-blue-600 z-10 rounded-full border border-slate-100 shadow-sm">Contact Preference</label>
                      <select 
                        value={formData.contactPreference} 
                        onChange={e => setFormData({...formData, contactPreference: e.target.value})} 
                        className="w-full p-3 bg-white border-2 border-slate-100 rounded-2xl text-xs font-bold outline-none appearance-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-50 cursor-pointer"
                      >
                        <option value="WhatsApp">Send via WhatsApp</option>
                        <option value="Phone Call">Direct Phone Call</option>
                        <option value="Email">Email Notification</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <FaPhone size={12} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t-2 border-dashed border-slate-200 mt-6 bg-white">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                  <div><span className="text-slate-500 font-black uppercase text-[10px] block mb-1">Estimated Total</span><span className="text-2xl md:text-3xl font-black text-slate-900 italic">£{totalPrice.toFixed(2)}</span></div>
                  <button onClick={() => { if(!formData.fullName || !formData.phone || !formData.email) return toast.error("Complete your details"); setShowPaymentModal(true); }} className="w-full md:w-auto md:px-8 bg-blue-600 text-white py-3 rounded-xl font-bold uppercase italic text-lg shadow-xl hover:bg-blue-700 flex items-center justify-center gap-3">
                    Secure Checkout <FaShoppingBag size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MY ORDERS MODAL */}
      <AnimatePresence>
        {showCheckOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[150] bg-slate-900/95 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl h-[80vh] rounded-3xl p-6 flex flex-col relative">
              <button onClick={() => { setShowCheckOrder(false); setViewableOrders(null); }} className="absolute top-6 right-6 text-slate-400"><FaTimes size={20} /></button>
              {!viewableOrders ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xs mx-auto">
                  <FaLock className="text-slate-200 text-5xl mb-6" />
                  <h2 className="text-2xl font-black uppercase italic mb-4">Track Order</h2>
                  <input maxLength={4} value={passcodeInput} onChange={e => setPasscodeInput(e.target.value)} placeholder="Passcode" className="w-full text-center text-4xl font-black tracking-[0.4em] p-4 bg-slate-50 border rounded-2xl mb-4 outline-none focus:border-blue-500" />
                  <button onClick={checkPasscode} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase">Verify Order</button>
                  <button onClick={handleForgotPasscode} className="mt-4 text-[10px] font-black text-slate-400 underline uppercase tracking-widest">Forgot Code?</button>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <h2 className="text-xl font-black uppercase italic mb-6">My <span className="text-blue-600">Hire History</span></h2>
                  {viewableOrders.map(order => (
                    <div key={order.id} className="p-4 bg-slate-50 border rounded-2xl mb-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black uppercase text-slate-400">Order ID: {order.id.slice(0,8)}</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${order.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{order.status}</span>
                      </div>
                      <div className="space-y-1">
                        {order.items?.map((item:any, i:number) => (
                          <p key={i} className="text-xs font-bold text-slate-700">{item.quantity}x {item.name}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PaymentGateway 
        isOpen={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)} 
        totalAmount={totalPrice} 
        customerOrder={Object.values(cart)} 
        serviceType="Rental Services" 
        onSuccess={async () => { 
          const passcode = Math.floor(1000 + Math.random() * 9000).toString();
          await addDoc(collection(db, "renting_orders"), {
            ...formData,
            items: Object.values(cart),
            total: totalPrice,
            passcode,
            status: 'paid',
            createdAt: serverTimestamp()
          });
          
          await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', {
            to_name: formData.fullName,
            to_email: formData.email,
            passcode: passcode,
            total_amount: totalPrice.toFixed(2),
            order_items: Object.values(cart).map(i => `${i.quantity}x ${i.name}`).join(', ')
          }, 'YOUR_PUBLIC_KEY');

          toast.success(`Success! Passcode: ${passcode}`, { duration: 8000 });
          setCart({}); setIsCheckoutOpen(false); setShowPaymentModal(false); 
          localStorage.removeItem('isundunrin_rental_cart'); 
        }} 
      />
    </div>
  );
}