"use client";

import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaMinus, FaTimes, FaShoppingBag, FaSearch, FaEnvelope, FaGoogle, FaUserLock, FaWhatsapp, FaSpinner, FaMapMarkerAlt, FaExclamationTriangle, FaTrash, FaEyeSlash, FaBell, FaCalendarAlt, FaClock } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RentalsServiceUi() {
  const [slides, setSlides] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [cart, setCart] = useState<{ [key: string]: any }>({});
  const [whatsappNumber, setWhatsappNumber] = useState("+2347034632037");

  //route
  const router = useRouter();
  
  // UI States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedDetailsItem, setSelectedDetailsItem] = useState<any>(null);
  const [showCheckOrder, setShowCheckOrder] = useState(false);
  const [viewableOrders, setViewableOrders] = useState<any[]>([]);
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [hiddenOrderIds, setHiddenOrderIds] = useState<string[]>([]);
  const [showHideConfirm, setShowHideConfirm] = useState(false);
  const [orderToHide, setOrderToHide] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [followUpLoading, setFollowUpLoading] = useState<string | null>(null);

  // Time slots
  const TIME_SLOTS = [
    "6:00 AM - 7:00 AM",
    "7:00 AM - 8:00 AM",
    "8:00 AM - 9:00 AM",
    "9:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "12:00 PM - 1:00 PM",
    "1:00 PM - 2:00 PM",
    "2:00 PM - 3:00 PM",
    "3:00 PM - 4:00 PM",
    "4:00 PM - 5:00 PM",
    "5:00 PM - 6:00 PM",
    "6:00 PM - 7:00 PM",
    "7:00 PM - 8:00 PM",
    "8:00 PM - 9:00 PM"
  ];

  // Form State
  const [formData, setFormData] = useState({
    fullName: '', 
    phone: '', 
    email: '',
    address: '',
    contactPreference: 'WhatsApp',
    date: '',
    time: ''
  });

  // Get today's date in YYYY-MM-DD format for min date attribute
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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

  // Load hidden orders from localStorage
  useEffect(() => {
    if (user) {
      const savedHidden = localStorage.getItem(`rental-hidden-orders-${user.uid}`);
      if (savedHidden) {
        setHiddenOrderIds(JSON.parse(savedHidden));
      }
    } else {
      setHiddenOrderIds([]);
    }
  }, [user]);

  // Save hidden orders to localStorage
  useEffect(() => {
    if (user && hiddenOrderIds.length > 0) {
      localStorage.setItem(`rental-hidden-orders-${user.uid}`, JSON.stringify(hiddenOrderIds));
    }
    if (user && hiddenOrderIds.length === 0) {
      localStorage.removeItem(`rental-hidden-orders-${user.uid}`);
    }
  }, [hiddenOrderIds, user]);

  // Fetch WhatsApp number from admin settings
  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const contactRef = doc(db, "settings", "contact_info");
        const contactSnap = await getDoc(contactRef);
        
        if (contactSnap.exists()) {
          const data = contactSnap.data();
          const phone = data.generalPhone || "";
          const formattedPhone = phone.replace(/\s+/g, '').replace(/[^0-9]/g, '');
          if (formattedPhone) {
            setWhatsappNumber(formattedPhone);
          }
        }
      } catch (error) {
        console.error("Error fetching contact info:", error);
      }
    };
    fetchContactInfo();
  }, []);

  // --- LOGIC: AUTO-SLIDE HERO ---
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Fetch User Orders (Live Receipt Data) - Filter out hidden orders
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "renting_orders"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const allOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Filter out hidden orders from view
      setViewableOrders(allOrders.filter(order => !hiddenOrderIds.includes(order.id)));
    });
    return () => unsub();
  }, [user, hiddenOrderIds]);

  // Active orders count (pending, paid, processing)
  const activeOrderCount = viewableOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled' && o.status !== 'completed').length;

  const handleOrdersClick = () => {
    if (!user) setShowAuthOverlay(true);
    else setShowCheckOrder(true);
  };

  // Handle hiding order from user view
  const handleHideOrder = (orderId: string) => {
    setHiddenOrderIds(prev => [...prev, orderId]);
    toast.success('Order removed from your view');
    setShowHideConfirm(false);
    setOrderToHide(null);
  };

  // Restore all hidden orders
  const restoreHiddenOrders = () => {
    if (user) {
      setHiddenOrderIds([]);
      localStorage.removeItem(`rental-hidden-orders-${user.uid}`);
      toast.success('All hidden orders restored');
    }
  };

  // Handle follow-up via WhatsApp
  const handleFollowUp = async (order: any) => {
    setFollowUpLoading(order.id);
    
    try {
      // Get the contact preference from the order
      const contactMethod = order.contactPreference || 'WhatsApp';
      const contactMethodIcon = contactMethod === 'WhatsApp' ? '📱' : 
                                contactMethod === 'Phone Call' ? '📞' : '📧';
      
      // Prepare items list for the message
      const itemsList = order.items?.map((item: any) => 
        `  • *${item.name}*: ${item.quantity}x @ £${item.price} each = *£${(item.price * item.quantity).toFixed(2)}*`
      ).join('\n');
      
      const totalAmount = order.total?.toFixed(2) || '0.00';
      const orderIdShort = order.id.slice(0, 8).toUpperCase();
      
      const whatsappMessage = `*🔔 RENTAL ORDER FOLLOW-UP REQUEST*\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `*📋 ORDER INFORMATION*\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `*Order ID:* ${orderIdShort}\n` +
        `*Status:* ${order.status || 'Pending'}\n` +
        `*Total Amount:* *£${totalAmount}*\n` +
        `*Date:* ${order.date || 'Not specified'}\n` +
        `*Time:* ${order.time || 'Not specified'}\n\n` +
        
        `*📦 ITEMS ORDERED:*\n${itemsList}\n\n` +
        
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `*👤 CUSTOMER DETAILS*\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `*Name:* ${order.fullName || order.customerInfo?.name || 'N/A'}\n` +
        `*Phone:* ${order.phone || order.customerInfo?.phone || 'N/A'}\n` +
        `*Email:* ${order.email || order.customerInfo?.email || 'N/A'}\n` +
        `*Preferred Contact:* ${contactMethodIcon} ${contactMethod}\n` +
        `*Address:* ${order.address || order.customerInfo?.address || 'N/A'}\n\n` +
        
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `⚡ *Please follow up on this order at your earliest convenience* ⚡\n` +
        `━━━━━━━━━━━━━━━━━━━━━`;

      const encodedMessage = encodeURIComponent(whatsappMessage);
      window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
      
      toast.success("Follow-up request sent via WhatsApp!");
      
    } catch (error) {
      console.error("Error sending follow-up:", error);
      toast.error("Failed to send follow-up");
    } finally {
      setFollowUpLoading(null);
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

  // Prepare order data for submission
  const prepareOrderData = () => {
    return {
      userId: user?.uid,
      fullName: formData.fullName,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      contactPreference: formData.contactPreference,
      date: formData.date,
      time: formData.time,
      items: Object.values(cart),
      total: totalPrice,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
  };

  // Send order to backend (Firestore)
  const handleSendOrder = async () => {
    if (!user) {
      toast.error("Please sign in to place order");
      setShowAuthOverlay(true);
      return;
    }

    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.email.trim() || !formData.address.trim() || !formData.date || !formData.time) {
      return toast.error("Please fill in all contact, delivery, and scheduling fields");
    }

    if (Object.keys(cart).length === 0) {
      return toast.error("Your cart is empty");
    }

    setIsSubmitting(true);

    try {
      const orderData = prepareOrderData();
      await addDoc(collection(db, "renting_orders"), orderData);
      
      toast.success("Order sent successfully!");
      
      // Clear cart and close checkout
      setCart({});
      setIsCheckoutOpen(false);
      localStorage.removeItem('isundunrin_rental_cart');
      
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send order via WhatsApp
  const handleSendViaWhatsApp = async () => {
    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.email.trim() || !formData.address.trim() || !formData.date || !formData.time) {
      return toast.error("Please fill in all contact, delivery, and scheduling fields");
    }

    if (Object.keys(cart).length === 0) {
      return toast.error("Your cart is empty");
    }

    setIsSubmitting(true);

    try {
      // Save to backend first (optional - can be removed if you don't want to save)
      if (user) {
        const orderData = prepareOrderData();
        await addDoc(collection(db, "renting_orders"), orderData);
      }

      // Prepare WhatsApp message
      const itemsBreakdown = Object.values(cart).map((item: any) => {
        const category = categories.find(cat => cat.id === item.categoryId);
        const categoryName = category?.name || '';
        const itemTotal = item.price * item.quantity;
        return `  • *${item.name}* ${categoryName ? `(${categoryName})` : ''}\n    *Quantity:* ${item.quantity}x\n    *Price:* £${item.price} each\n    *Subtotal:* *£${itemTotal.toFixed(2)}*`;
      }).join('\n\n');

      const contactMethodIcon = formData.contactPreference === 'WhatsApp' ? '📱' : 
                               formData.contactPreference === 'Phone Call' ? '📞' : '📧';

      const whatsappMessage = `*🔔 NEW RENTAL ORDER*\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `*📦 RENTAL ORDER DETAILS*\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `${itemsBreakdown}\n\n` +
        `*💰 TOTAL AMOUNT:* *£${totalPrice.toFixed(2)}*\n` +
        `*📅 PREFERRED DATE:* ${formData.date}\n` +
        `*⏰ PREFERRED TIME:* ${formData.time}\n\n` +
        
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `*👤 CUSTOMER INFORMATION*\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `*Name:* ${formData.fullName}\n` +
        `*Phone:* ${formData.phone}\n` +
        `*Email:* ${formData.email}\n` +
        `*Preferred Contact:* ${contactMethodIcon} ${formData.contactPreference}\n` +
        `*Address:* ${formData.address}\n\n` +
        
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `⚡ *Please review and respond within 24 hours* ⚡\n` +
        `━━━━━━━━━━━━━━━━━━━━━`;

      const encodedMessage = encodeURIComponent(whatsappMessage);
      window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
      
      toast.success("Order sent via WhatsApp!");
      
      // Clear cart and close checkout
      setCart({});
      setIsCheckoutOpen(false);
      localStorage.removeItem('isundunrin_rental_cart');
      
    } catch (error) {
      console.error("Error sending WhatsApp:", error);
      toast.error("Failed to send order");
    } finally {
      setIsSubmitting(false);
    }
  };

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
                
                {/* CONTACT FORM */}
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

                {/* DATE & TIME SELECTION SECTION */}
                <div className="bg-slate-50/50 p-3 md:p-5 rounded-md border border-slate-200/60 shadow-inner space-y-4">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse"></div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Your Event Date</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative group">
                      <label className="absolute -top-2 left-3 bg-white px-2 text-[9px] font-black uppercase text-blue-600 z-10 rounded-full border border-slate-300 md:border-slate-100 shadow-sm">Preferred Date</label>
                      <div className="relative">
                        <input 
                          type="date" 
                          value={formData.date} 
                          onChange={e => setFormData({...formData, date: e.target.value})} 
                          min={getTodayDate()}
                          className="w-full p-4 bg-white border-2 border-slate-300 md:border-slate-100 rounded-md md:rounded-xl text-xs font-bold outline-none focus:border-blue-500" 
                        />
                        <FaCalendarAlt className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 opacity-50" size={14} />
                      </div>
                    </div>

                    <div className="relative group">
                      <label className="absolute -top-2 left-3 bg-white px-2 text-[9px] font-black uppercase text-blue-600 z-10 rounded-full border border-slate-300 md:border-slate-100 shadow-sm">Preferred Time</label>
                      <div className="relative">
                        <select 
                          value={formData.time} 
                          onChange={e => setFormData({...formData, time: e.target.value})} 
                          className="w-full p-4 bg-white border-2 border-slate-300 md:border-slate-100 rounded-md md:rounded-xl text-xs font-bold outline-none appearance-none focus:border-blue-500"
                        >
                          <option value="">Select Time Slot</option>
                          {TIME_SLOTS.map(slot => (
                            <option key={slot} value={slot}>{slot}</option>
                          ))}
                        </select>
                        <FaClock className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 opacity-50" size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t-2 border-dashed border-slate-200 mt-6 bg-white">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                  <div><span className="text-slate-500 font-black uppercase text-[10px] block mb-1">Total Amount</span><span className="text-2xl md:text-3xl font-black text-slate-900 italic">£{totalPrice.toFixed(2)}</span></div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <button 
                      onClick={handleSendOrder} 
                      disabled={isSubmitting}
                      className="w-full md:w-auto md:px-8 bg-blue-600 text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-blue-700 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isSubmitting ? <FaSpinner className="animate-spin" /> : "Send Order"}
                    </button>
                    <button 
                      onClick={handleSendViaWhatsApp} 
                      disabled={isSubmitting}
                      className="w-full md:w-auto md:px-8 bg-green-600 text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-green-700 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <FaWhatsapp size={16} />
                      {isSubmitting ? "Sending..." : "Order via WhatsApp"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MY ORDERS MODAL */}
      <AnimatePresence>
        {showCheckOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] bg-slate-900/95 flex items-center justify-center p-2">
            <div className="bg-white w-full max-w-2xl h-[95vh] md:h-[80vh] md:rounded-xl p-3 md:p-6 flex flex-col relative shadow-2xl overflow-hidden">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-xl font-black uppercase italic">My <span className="text-blue-600">Rentals</span></h2>
                <div className="flex items-center gap-2">
                  {hiddenOrderIds.length > 0 && (
                    <button 
                      onClick={restoreHiddenOrders}
                      className="text-[10px] bg-slate-100 px-3 py-1 rounded-full font-black uppercase hover:bg-slate-200 transition-all"
                    >
                      Restore all
                    </button>
                  )}
                  <button onClick={() => setShowCheckOrder(false)} className="text-slate-400 hover:text-red-500 transition-all"><FaTimes size={20} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-hide md:pr-2">
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
                          <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                            order.status === 'pending' ? 'bg-orange-100 text-orange-600' : 
                            order.status === 'approved' ? 'bg-green-100 text-green-600' : 
                            order.status === 'cancelled' ? 'bg-red-100 text-red-600' : 
                            order.status === 'delivered' ? 'bg-blue-100 text-blue-600' : 
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {order.status}
                          </span>
                          {/* Hide button for all orders */}
                          <button 
                            onClick={() => {
                              setOrderToHide(order);
                              setShowHideConfirm(true);
                            }}
                            className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-full transition-all"
                            title="Hide from view"
                          >
                            <FaEyeSlash size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {order.items?.map((item:any, i:number) => ( 
                        <p key={i} className="text-xs font-black text-slate-700 uppercase">
                          {item.quantity}x {item.name}
                        </p>
                      ))}
                    </div>
                    {order.date && order.time && (
                      <div className="mt-2 text-[10px] text-slate-500 font-bold uppercase">
                        <span>📅 {order.date} • ⏰ {order.time}</span>
                      </div>
                    )}
                    <div className="mt-3 pt-2 border-t border-dashed flex justify-between items-center">
                      <span className="text-[9px] font-black uppercase text-slate-400">Delivery to: {order.address?.slice(0,25)}...</span>
                      <span className="font-black text-slate-900">£{order.total?.toFixed(2)}</span>
                    </div>
                    
                    {/* FOLLOW UP BUTTON */}
                    <div className="mt-3 pt-2 border-t border-dashed">
                      <button 
                        onClick={() => handleFollowUp(order)}
                        disabled={followUpLoading === order.id}
                        className="w-full py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                      >
                        {followUpLoading === order.id ? (
                          <FaSpinner className="animate-spin" size={12} />
                        ) : (
                          <FaBell size={12} />
                        )}
                        Follow Up on Order
                      </button>
                    </div>
                  </div>
                )) : ( 
                  <div className='flex flex-col items-center justify-center py-24 text-slate-400'>
                    <FaShoppingBag size={40} className='mb-4 opacity-10' />
                    <p className='font-black uppercase text-xs tracking-widest'>No orders found</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HIDE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showHideConfirm && orderToHide && (
          <div className="fixed inset-0 z-[350] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl"
            >
              <FaExclamationTriangle className="text-orange-500 text-4xl mx-auto mb-4" />
              <h3 className="font-black uppercase text-sm mb-2">Hide Order?</h3>
              <p className="text-[10px] text-slate-500 mb-6 uppercase tracking-widest font-bold">
                This will hide this order from your view. You can restore it later.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowHideConfirm(false);
                    setOrderToHide(null);
                  }} 
                  className="flex-1 py-3 bg-slate-100 rounded-xl font-black text-[10px] uppercase hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleHideOrder(orderToHide.id)} 
                  className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-black text-[10px] uppercase hover:bg-orange-700 transition-all"
                >
                  Yes, Hide
                </button>
              </div>
            </motion.div>
          </div>
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