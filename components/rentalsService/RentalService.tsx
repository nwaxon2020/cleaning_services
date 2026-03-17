"use client";

import { useState, useEffect } from 'react';
// Added 'doc', 'updateDoc', 'deleteDoc' for the cancellation and delete features
import { db, auth } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaMinus, FaTimes, FaShoppingBag, FaSearch, FaEnvelope, FaGoogle, FaUserLock, FaWhatsapp, FaPhone, FaMapMarkerAlt, FaExclamationTriangle, FaTrash } from 'react-icons/fa';
import PaymentGateway from '@/components/bookings/PaymentGateway'; 
import ShippingInfo from '@/components/bookings/ShippingInfo';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RentalsServiceUi() {
  const [slides, setSlides] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [cart, setCart] = useState<{ [key: string]: any }>({});

  //route
  const router = useRouter();
  
  // UI States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDetailsItem, setSelectedDetailsItem] = useState<any>(null);
  const [showCheckOrder, setShowCheckOrder] = useState(false);
  const [viewableOrders, setViewableOrders] = useState<any[]>([]);
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  
  // Delete Cancelled Orders or Delivered Orders
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<any>(null);

  // State for Cancellation
  const [orderToCancel, setOrderToCancel] = useState<any>(null);

  // Form State - REMOVED postalCode
  const [formData, setFormData] = useState({
    fullName: '', 
    phone: '', 
    email: '',
    address: '',
    contactPreference: 'WhatsApp'
  });

  // Auth Listener
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      if (u) {
        setFormData(prev => ({ 
            ...prev, 
            fullName: u.displayName || prev.fullName, 
            email: u.email || prev.email 
        }));
        setShowAuthOverlay(false);
      }
    });
    return () => unsub();
  }, []);

  // --- LOGIC: AUTO-SLIDE HERO ---
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Fetch User Orders (Live Receipt Data)
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "renting_orders"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setViewableOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  // Logic for the Red Bubble (Active orders only)
  const activeOrderCount = viewableOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;

  const handleOrdersClick = () => {
    if (!user) setShowAuthOverlay(true);
    else setShowCheckOrder(true);
  };

  // --- LOGIC: CANCELLATION & REFUND CALCULATION ---
  const handleCancelConfirm = async () => {
    if (!orderToCancel) return;
    const refundAmount = orderToCancel.total * 0.85; // 85% of original (15% fee)

    try {
      // 1. Save to canceled_rent_order collection
      await addDoc(collection(db, "canceled_rent_order"), {
        originalOrderId: orderToCancel.id,
        customerName: orderToCancel.fullName,
        phone: orderToCancel.phone,
        email: orderToCancel.email,
        address: orderToCancel.address,
        items: orderToCancel.items,
        pricePaid: orderToCancel.total,
        refundAmount: refundAmount,
        canceledAt: serverTimestamp()
      });

      // 2. Update status in original renting_orders collection
      const orderRef = doc(db, "renting_orders", orderToCancel.id);
      await updateDoc(orderRef, { status: 'cancelled' });

      toast.success("Order cancelled. Refund processing.");
      setOrderToCancel(null);
    } catch (error) {
      toast.error("Failed to cancel order.");
      console.error(error);
    }
  };

  // --- LOGIC: DELETE CANCELLED ORDER (User View Only) ---
  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, "renting_orders", orderId));
      toast.success("Order removed from your view");
    } catch (error) {
      toast.error("Failed to delete order");
      console.error(error);
    }
  };

  // Real-time Data Listeners
  useEffect(() => {
    onSnapshot(query(collection(db, "renting_slides"), orderBy("createdAt", "desc")), (snap) => setSlides(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(query(collection(db, "renting_categories"), orderBy("createdAt", "desc")), (snap) => setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    onSnapshot(query(collection(db, "renting_items"), orderBy("createdAt", "desc")), (snap) => setItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  // Cart Logic
  useEffect(() => {
    const savedCart = localStorage.getItem('isundunrin_rental_cart');
    if (savedCart) { try { setCart(JSON.parse(savedCart)); } catch (e) { console.error(e); } }
  }, []);

  useEffect(() => {
    if (Object.keys(cart).length > 0) localStorage.setItem('isundunrin_rental_cart', JSON.stringify(cart));
    else localStorage.removeItem('isundunrin_rental_cart');
  }, [cart]);

  const toggleItem = (item: any) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[item.id]) delete newCart[item.id];
      else newCart[item.id] = { ...item, quantity: 1 };
      return newCart;
    });
  };

  const removeItem = (id: string) => { setCart(prev => { const newCart = { ...prev }; delete newCart[id]; return newCart; }); };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (!newCart[id]) return prev;
      const newQty = (newCart[id].quantity || 1) + delta;
      if (newQty > 0) newCart[id].quantity = newQty;
      return newCart;
    });
  };

  const googleSignIn = async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); toast.success("Signed in!"); } 
    catch (error) { toast.error("Auth failed"); }
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
      {/* HERO & ORDERS BUTTONS */}
      <div className="relative h-[45vh] md:h-[70vh] w-full overflow-hidden">
        <AnimatePresence mode="wait">
          {slides.length > 0 ? (
            <motion.img key={currentSlide} src={slides[currentSlide]?.url} initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }} className="absolute inset-0 w-full h-full object-cover" />
          ) : ( <div className="absolute inset-0 bg-slate-200 animate-pulse" /> )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 flex flex-col items-center justify-center text-white text-center p-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-5xl text-orange-500 font-black uppercase italic tracking-tighter">Isundunrin <span className="text-blue-500">Rentals</span></h1>
            <p className='hidden md:block text-sm px-3 py-1 rounded-md bg-black/80 tracking-[0.2em]'>Premium materials at your disposal</p>
            
            {/* MOBILE ORDERS BUTTON WITH RED BUBBLE */}
            <div className="relative inline-block mt-4 md:hidden">
                <button onClick={handleOrdersClick} className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl border border-white/10">
                    <FaSearch /> My Orders
                </button>
                {activeOrderCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                        {activeOrderCount}
                    </span>
                )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* DESKTOP ORDERS BUTTON WITH RED BUBBLE */}
      <div className='hidden my-2 mx-4 text-right md:flex justify-end'>
        <div className="relative">
            <button onClick={handleOrdersClick} className="w-[15rem] bg-black text-white backdrop-blur-md px-4 py-3 rounded-full text-[10px] font-black uppercase tracking-widest flex justify-center items-center gap-2 shadow-xl hover:bg-zinc-900 transition-colors">
            <FaSearch /> My Orders
            </button>
            {activeOrderCount > 0 && (
                <span className="absolute -top-3 -right-2 bg-red-600 text-white text-[10px] font-bold h-6 w-6 rounded-full flex items-center justify-center shadow-lg animate-pulse border-2 border-[#F8FAFC]">
                    {activeOrderCount}
                </span>
            )}
        </div>
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
                <h2 className={`text-sm font-bold uppercase italic tracking-widest px-6 py-3 ${theme.bg} text-white rounded-full shadow-lg`}>{cat.name}</h2>
                <span className={`h-1 flex-1 ${theme.bg} rounded-full`}></span>
              </div>
              <div className="grid grid-cols-2 md:flex flex-wrap justify-center gap-3 md:gap-6">
                {catItems.map(item => {
                  const isSelected = !!cart[item.id];
                  return (
                    <motion.div key={item.id} whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }} className={`mb-5 relative flex flex-col md:w-[280px] cursor-pointer rounded-lg md:rounded-[2rem] overflow-hidden transition-all duration-300 md:border-2 ${isSelected ? `${theme.border} ring-4 ${theme.text} ring-opacity-20` : `border-transparent shadow-md hover:${theme.border} hover:shadow-xl`} ${theme.cardBg}`}>
                      <div className="p-3 md:p-6 flex-1" onClick={() => toggleItem(item)}>
                        {isSelected && <div className={`absolute top-4 right-4 ${theme.bg} text-white w-6 h-6 rounded-full flex items-center justify-center`}><FaShoppingBag size={10} /></div>}
                        <h3 className="font-black text-slate-800 text-sm md:text-lg mb-1">{item.name}</h3>
                        <p className={`text-[8px] md:text-[10px] ${theme.text} font-bold uppercase tracking-wider mb-2 md:mb-4 line-clamp-2`}>{item.description || "Premium Hire Item"}</p>
                        <div className="flex items-end justify-between"><span className={`text-xl md:text-2xl font-black ${theme.heading} italic`}>£{item.price}</span><span className={`text-[10px] ${theme.text} font-black uppercase`}>Per Hire</span></div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedDetailsItem(item); }} className={`${theme.bg} text-white text-[9px] md:text-[10px] py-2 md:py-3 font-black uppercase tracking-widest hover:brightness-90 transition-all`}>View Details</button>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* CHECKOUT DRAWER */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-1 md:p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-lg md:max-w-4xl h-[98vh] shadow-2xl px-1.5 pt-8 md:p-6 flex flex-col rounded-md md:rounded-xl relative overflow-hidden">
              <div className="px-2 flex justify-between items-center mb-2"><h2 className="text-xl font-black uppercase italic leading-none">Checkout <span className="text-blue-600">Review</span></h2><button onClick={() => setIsCheckoutOpen(false)} className="p-3 bg-slate-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"><FaTimes size={15} /></button></div>
              
              <div className="flex-1 overflow-y-auto scrollbar-hide md:pr-2 space-y-16 md:space-y-8">
                {/* ITEMS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">{Object.values(cart).map(item => { const itemTheme = colorThemes[categories.findIndex(cat => cat.id === item.categoryId) % colorThemes.length]; return (<div key={item.id} className={`m-1 flex items-center justify-between py-1 px-2 ${itemTheme?.lightBg || 'bg-slate-50'} rounded-lg border transition-transform hover:scale-[1.02]`}><button onClick={() => removeItem(item.id)} className="mr-1 md:mr-2 p-1 text-slate-400 hover:text-red-600"><FaTimes size={12} /></button><div className="flex-1 flex items-center justify-between mr-2 "><h4 className={`font-bold text-slate-800 text-xs uppercase ${itemTheme?.text}`}>{item.name}</h4><p className={`mx-1 text-xs ${itemTheme?.text} font-bold`}>£{item.price}</p></div><div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border-2 border-slate-100 shadow-xs"><button onClick={() => updateQty(item.id, -1)} className="text-slate-400 hover:text-red-500 p-1"><FaMinus size={8}/></button><input type="number" min="1" value={item.quantity} onChange={(e) => { const val = parseInt(e.target.value); const sanitizedVal = (isNaN(val) || val < 1) ? 1 : val; setCart(prev => ({ ...prev, [item.id]: { ...prev[item.id], quantity: sanitizedVal } })); }} className="w-12 text-center text-xs font-black bg-transparent outline-none border-none focus:ring-0 p-0" /><button onClick={() => updateQty(item.id, 1)} className={`${itemTheme?.text} hover:opacity-70 p-1`}><FaPlus size={8}/></button></div></div>); })}</div>
                
                <ShippingInfo totalPrice={totalPrice} />

                {/* CONTACT FORM DESIGN FROM RENTALS */}
                <div className="bg-slate-50/50 p-3 md:p-5 rounded-md border border-slate-200/60 shadow-inner space-y-4">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <div className="h-2 w-2 bg-purple-600 rounded-full animate-pulse"></div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Delivery & Contact Info</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ADDRESS FIELD - NOW FULL WIDTH */}
                    <div className="relative group md:col-span-2">
                      <label className="absolute -top-2 left-3 bg-white px-2 text-[9px] font-black uppercase text-purple-600 z-10 rounded-full border border-slate-300 md:border-slate-100 shadow-sm">Full Address</label>
                      <div className="relative">
                        <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Street address, city, country" className="w-full p-4 bg-white border-2 border-slate-300 md:border-slate-100 rounded-md md:rounded-xl text-xs font-bold outline-none focus:border-purple-500" />
                        <FaMapMarkerAlt className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 opacity-50" size={14} />
                      </div>
                    </div>

                    <div className="relative group">
                      <label className="absolute -top-2 left-3 bg-white px-2 text-[9px] font-black uppercase text-purple-600 z-10 rounded-full border border-slate-300 md:border-slate-100 shadow-sm">Full Name</label>
                      <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full p-4 bg-white border-2 border-slate-300 md:border-slate-100 rounded-md md:rounded-xl text-xs font-bold outline-none focus:border-purple-500" />
                    </div>

                    <div className="relative group">
                      <label className="absolute -top-2 left-3 bg-white px-2 text-[9px] font-black uppercase text-purple-600 z-10 rounded-full border border-slate-300 md:border-slate-100 shadow-sm">WhatsApp / Phone</label>
                      <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+44 or your country code" className="w-full p-4 bg-white border-2 border-slate-300 md:border-slate-100 rounded-md md:rounded-xl text-xs font-bold outline-none focus:border-purple-500" />
                    </div>

                    <div className="relative group">
                      <label className="absolute -top-2 left-3 bg-white px-2 text-[9px] font-black uppercase text-purple-600 z-10 rounded-full border border-slate-300 md:border-slate-100 shadow-sm">Email Address</label>
                      <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-4 bg-white border-2 border-slate-300 md:border-slate-100 rounded-md md:rounded-xl text-xs font-bold outline-none focus:border-purple-500" />
                    </div>

                    <div className="relative group">
                      <label className="absolute -top-2 left-3 bg-white px-2 text-[9px] font-black uppercase text-purple-600 z-10 rounded-full border border-slate-300 md:border-slate-100 shadow-sm">Preferred Contact Method</label>
                      <select value={formData.contactPreference} onChange={e => setFormData({...formData, contactPreference: e.target.value})} className="w-full p-4 bg-white border-2 border-slate-300 md:border-slate-100 rounded-md md:rounded-xl text-xs font-bold outline-none appearance-none focus:border-purple-500">
                        <option value="WhatsApp">▼ Send via WhatsApp</option>
                        <option value="Phone Call">▼ Direct Phone Call</option>
                        <option value="Email">▼ Email Notification</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t-2 border-dashed border-slate-200 mt-6 bg-white">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                  <div><span className="text-slate-500 font-black uppercase text-[10px] block mb-1">Estimated Total</span><span className="text-2xl md:text-3xl font-black text-slate-900 italic">£{totalPrice.toFixed(2)}</span></div>
                  <button onClick={() => { 
                    // UPDATED VALIDATION - removed postalCode check
                    if(!formData.fullName.trim() || !formData.phone.trim() || !formData.email.trim() || !formData.address.trim()) {
                        return toast.error("Please fill in all contact and delivery fields");
                    }
                    if(!user) return setShowAuthOverlay(true); 
                    setShowPaymentModal(true); 
                  }} className="w-full md:w-auto md:px-8 bg-blue-600 text-white py-3 rounded-xl font-bold uppercase italic text-lg shadow-xl hover:bg-blue-700 flex items-center justify-center gap-3 transition-all active:scale-95">Secure Checkout <FaShoppingBag size={14} /></button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MY ORDERS MODAL (Live Receipt View) */}
      <AnimatePresence>
        {showCheckOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] bg-slate-900/95 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl h-[80vh] rounded-xl p-4 md:p-6 flex flex-col relative shadow-2xl overflow-hidden">
              <button onClick={() => setShowCheckOrder(false)} className="absolute top-6 right-6 md:right-11 text-slate-400 hover:text-red-500 transition-all"><FaTimes size={20} /></button>
              <div className="flex-1 overflow-y-auto scrollbar-hide md:pr-2">
                <h2 className="text-xl font-black uppercase italic mb-6 border-b pb-2">My <span className="text-blue-600">Rentals</span></h2>
                {viewableOrders.length > 0 ? viewableOrders.map(order => (
                  <div key={order.id} className="p-4 bg-slate-50 border border-slate-200 rounded md:rounded-xl mb-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className='flex flex-col'>
                          <span className="text-[10px] font-black uppercase text-slate-400">Order ID: {order.id.slice(0,8).toUpperCase()}</span>
                          <button 
                            onClick={() => router.push(`/receipts/${order.id}`)}
                            className="mt-2 w-full py-2 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2"
                          >
                            View Receipt
                          </button>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${order.status === 'paid' ? 'bg-green-100 text-green-600' : order.status === 'cancelled' ? 'bg-red-100 text-red-600' : order.status === 'delivered' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                    {order.status}
                                </span>
                                {/* DELETE BUTTON - Appears for cancelled AND delivered orders */}
                                {(order.status === 'cancelled' || order.status === 'delivered') && (
                                    <button 
                                        onClick={() => {
                                          setOrderToDelete(order);
                                          setShowDeleteConfirm(true);
                                        }}
                                        className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-full transition-all"
                                        title="Delete from view"
                                    >
                                        <FaTrash size={12} />
                                    </button>
                                )}
                            </div>
                            {/* CANCEL BUTTON - Only for non-cancelled, non-delivered orders */}
                            {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                <button 
                                    onClick={() => setOrderToCancel(order)}
                                    className="my-1 text-[9px] font-black uppercase text-red-500 underline hover:text-red-700 transition-colors"
                                >
                                    Cancel Order
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="space-y-1">{order.items?.map((item:any, i:number) => ( <p key={i} className="text-xs font-black text-slate-700 uppercase">{item.quantity}x {item.name}</p> ))}</div>
                    <div className="mt-3 pt-2 border-t border-dashed flex justify-between items-center"><span className="text-[9px] font-black uppercase text-slate-400">Delivery to: {order.address?.slice(0,25)}...</span><span className="font-black text-slate-900">£{order.total?.toFixed(2)}</span></div>
                  </div>
                )) : ( <div className='flex flex-col items-center justify-center py-24 text-slate-400'><FaShoppingBag size={40} className='mb-4 opacity-10' /><p className='font-black uppercase text-xs tracking-widest'>No orders found</p></div> )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

{/* DELETE CONFIRMATION MODAL */}
<AnimatePresence>
  {showDeleteConfirm && orderToDelete && (
    <div className="fixed inset-0 z-[350] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl"
      >
        <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
        <h3 className="font-black uppercase text-sm mb-2">Delete Order?</h3>
        <p className="text-[10px] text-slate-500 mb-6 uppercase tracking-widest font-bold">
          This will permanently remove this {orderToDelete.status} order from your view.
        </p>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              setShowDeleteConfirm(false);
              setOrderToDelete(null);
            }} 
            className="flex-1 py-3 bg-slate-100 rounded-xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              handleDeleteOrder(orderToDelete.id);
              setShowDeleteConfirm(false);
              setOrderToDelete(null);
            }} 
            className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase hover:bg-red-700 transition-all"
          >
            Yes, Delete
          </button>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>

      {/* CANCELLATION OVERLAY DIV */}
      <AnimatePresence>
        {orderToCancel && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white max-w-sm w-full p-4 md:p-6 rounded-xl shadow-2xl text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaExclamationTriangle size={24} />
                    </div>
                    <h2 className="text-xl font-black uppercase italic mb-4">Refund <span className="text-red-600">Notice</span></h2>
                    
                    <div className="bg-slate-50 p-3 rounded-xl mb-6 space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500">
                            <span>Paid Amount:</span>
                            <span>£{orderToCancel.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold uppercase text-red-500">
                            <span>Service Charge (15%):</span>
                            <span>- £{(orderToCancel.total * 0.15).toFixed(2)}</span>
                        </div>
                        <div className="pt-2 border-t border-dashed border-slate-200 flex justify-between font-black uppercase text-slate-900 italic">
                            <span>Expected Refund:</span>
                            <span className="text-lg">£{(orderToCancel.total * 0.85).toFixed(2)}</span>
                        </div>
                    </div>

                    <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed mb-8 tracking-wider px-2">
                        Cancelling this order will incur a 15% non-refundable service fee.
                    </p>

                    <div className="flex flex-col gap-3">
                        <button onClick={handleCancelConfirm} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200">
                            Proceed to Cancel
                        </button>
                        <button onClick={() => setOrderToCancel(null)} className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">
                            Keep My Order
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

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

      <PaymentGateway isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} totalAmount={totalPrice} customerOrder={Object.values(cart)} serviceType="Rental Services"
        onSuccess={async () => { 
          const docRef = await addDoc(collection(db, "renting_orders"), { 
            userId: user.uid, 
            ...formData, 
            items: Object.values(cart), 
            total: totalPrice, 
            status: 'paid', 
            createdAt: serverTimestamp() 
          });

          // Clear local state first
          setCart({}); 
          setIsCheckoutOpen(false); 
          setShowPaymentModal(false); 
          localStorage.removeItem('isundunrin_rental_cart'); 

          // Wait 500ms before redirecting to ensure Firestore index is ready
          setTimeout(() => {
            router.push(`/receipts/${docRef.id}`);
          }, 500);
        }}
      />

      {/* Sticky Checkout Bar */}
      <AnimatePresence>
        {Object.keys(cart).length > 0 && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="mx-auto sticky bottom-4 md:bottom-3 md:left-1/2 md:-translate-x-1/2 z-[10] w-[90%] max-w-[20rem]">
            <button onClick={() => setIsCheckoutOpen(true)} className="w-full bg-slate-900 text-white p-2 md:p-3 rounded-[2.5rem] font-black uppercase italic tracking-widest flex justify-between items-center shadow-2xl hover:scale-[1.02] transition-all">
              <span className="text-[11px] md:text-xs flex items-center gap-2"><FaShoppingBag /> Checkout Items</span>
              <span className="bg-blue-600 py-2 px-3 md:py-1 rounded-full text-xs font-black">items {Object.keys(cart).length}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ITEM DETAILS MODAL */}
      <AnimatePresence>
        {selectedDetailsItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedDetailsItem(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white p-4 md:p-8 rounded-xl md:rounded-3xl max-w-lg w-full relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setSelectedDetailsItem(null)} className="absolute top-2 md:top-4 right-2 md:right-4 p-2 bg-slate-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"><FaTimes /></button>
              <h2 className="text-xl font-black text-slate-900 uppercase italic mb-2 leading-none">{selectedDetailsItem.name}</h2>
              <div className="h-1 w-20 bg-blue-600 mb-6 rounded-full"></div>
              <p className="text-slate-600 text-sm leading-relaxed mb-8">{selectedDetailsItem.description || "Premium hire item."}</p>
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <div><span className="text-slate-400 font-black uppercase text-[10px] block mb-1">Price</span><span className="text-3xl font-black text-slate-900 italic">£{selectedDetailsItem.price}</span></div>
                <button onClick={() => { toggleItem(selectedDetailsItem); setSelectedDetailsItem(null); }} className={`${cart[selectedDetailsItem.id] ? 'bg-red-500' : 'bg-slate-900'} text-sm text-white px-6 py-3 rounded-xl font-black uppercase italic tracking-widest transition-all`}>{cart[selectedDetailsItem.id] ? 'Remove Item' : 'Add to Hire'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}