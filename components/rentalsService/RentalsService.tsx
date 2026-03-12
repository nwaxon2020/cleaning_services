"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaMinus, FaTimes, FaShoppingBag } from 'react-icons/fa';
import PaymentGateway from '@/components/bookings/PaymentGateway'; 

import ShippingInfo from '@/components/bookings/ShippingInfo';

export default function RentalsServiceUi() {
  const [slides, setSlides] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [cart, setCart] = useState<{ [key: string]: any }>({});
  
  // UI States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // --- LOCAL STORAGE LOGIC ---
  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('isundunrin_rental_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(cart).length > 0) {
      localStorage.setItem('isundunrin_rental_cart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('isundunrin_rental_cart');
    }
  }, [cart]);

  // 1. Fetch Real-time Data
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

  // 2. Hero Slideshow Timer
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides]);

  // 3. Cart Logic
  const toggleItem = (item: any) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[item.id]) {
        delete newCart[item.id];
      } else {
        newCart[item.id] = { ...item, quantity: 1 };
      }
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
      <div className="relative h-[65vh] w-full overflow-hidden">
        <AnimatePresence mode="wait">
          {slides.length > 0 ? (
            <motion.img
              key={currentSlide}
              src={slides[currentSlide]?.url}
              initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-slate-200 animate-pulse" />
          )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 flex flex-col items-center justify-center text-white text-center p-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-6xl text-orange-500 font-black uppercase italic tracking-tighter">
              Isundunrin <span className="text-blue-500">Rentals</span>
            </h1>
            <p className="bg-black/60 rounded p-0.5 mt-4 text-sm md:text-base font-bold tracking-[0.3em] uppercase opacity-90">
              Premium Material Hire • Bristol & Southwest
            </p>
          </motion.div>
        </div>
      </div>

      {/* RENTAL INVENTORY */}
      <div className="max-w-7xl mx-auto px-4 py-16 pb-40">
        {categories.map((cat, idx) => {
          const catItems = items.filter(i => i.categoryId === cat.id);
          if (catItems.length === 0) return null;
          const theme = colorThemes[idx % colorThemes.length];

          return (
            <section key={cat.id} className={`mb-16 p-8 rounded-3xl ${theme.lightBg}`} style={{ boxShadow: `0 10px 30px -15px ${theme.accent}` }}>
              <div className="flex items-center gap-4 mb-10">
                <span className={`h-1 flex-1 ${theme.bg} rounded-full`}></span>
                <h2 className={`text-sm font-bold uppercase italic tracking-widest px-6 py-3 ${theme.bg} text-white rounded-full shadow-lg`}>
                  {cat.name}
                </h2>
                <span className={`h-1 flex-1 ${theme.bg} rounded-full`}></span>
              </div>
              <div className="flex flex-wrap justify-center gap-6">
                {catItems.map(item => {
                  const isSelected = !!cart[item.id];
                  return (
                    <motion.div
                      whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }}
                      onClick={() => toggleItem(item)}
                      key={item.id}
                      className={`w-[280px] cursor-pointer p-6 rounded-[2rem] transition-all duration-300 border-2 shadow-md ${
                        isSelected ? `${theme.border} ${theme.lightBg} ring-4 ${theme.text} ring-opacity-20` : `${theme.cardBg} border-transparent hover:${theme.border} hover:shadow-xl`
                      }`}
                    >
                      {isSelected && (
                        <div className={`absolute top-4 right-4 ${theme.bg} text-white w-6 h-6 rounded-full flex items-center justify-center`}>
                          <FaShoppingBag size={10} />
                        </div>
                      )}
                      <h3 className="font-black text-slate-800 text-lg mb-1">{item.name}</h3>
                      <p className={`text-[10px] ${theme.text} font-bold uppercase tracking-wider mb-4 line-clamp-2`}>{item.description || "Premium Hire Item"}</p>
                      <div className="flex items-end justify-between">
                        <span className={`text-2xl font-black ${theme.heading} italic`}>£{item.price}</span>
                        <span className={`text-[10px] ${theme.text} font-black uppercase`}>Per Hire</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* FLOATING ACTION BAR */}
      <AnimatePresence>
        {Object.keys(cart).length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="sticky bottom-3 left-1/2 -translate-x-1/2 z-[50] w-[90%] max-w-[22rem]"
          >
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="w-full bg-slate-900 text-white p-3 rounded-[2.5rem] font-black uppercase italic tracking-widest flex justify-between items-center shadow-2xl hover:scale-[1.02] transition-all"
            >
              <span className="text-xs flex items-center gap-2"><FaShoppingBag /> Continue to Checkout</span>
              <span className="bg-blue-600 px-3 py-1 rounded-full text-xs">{Object.keys(cart).length} Items</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CENTERED OVERLAY DRAWER */}
      <AnimatePresence>
        {isCheckoutOpen && (
            <motion.div
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4"
            >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white w-full max-w-lg md:max-w-4xl h-[98vh] shadow-2xl p-6 md:p-6 flex flex-col rounded-md md:rounded-xl relative overflow-hidden"
            >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black uppercase italic leading-none">
                      Your <span className="text-blue-600">Items</span>
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                      Review your selection before payment
                    </p>
                  </div>
                  <button 
                      onClick={() => setIsCheckoutOpen(false)} 
                      className="p-3 bg-slate-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-all hover:rotate-90"
                  >
                      <FaTimes size={15} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <div className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-1">
                      {Object.values(cart).map(item => {
                        const itemTheme = colorThemes[categories.findIndex(cat => cat.id === item.categoryId) % colorThemes.length];
                        return (
                            <div 
                              key={item.id} 
                              className={`flex items-center justify-between py-1 px-2 ${itemTheme?.lightBg || 'bg-slate-50'} rounded-lg border ${itemTheme?.cardBorder || 'border-slate-100'} transition-transform hover:scale-[1.02]`}
                            >
                              <div className="flex-1 flex items-center justify-between mr-2 ">
                                  <h4 className={`font-bold text-slate-800 text-xs uppercase ${itemTheme?.text} line-clamp-1`}>
                                  {item.name}
                                  </h4>
                                  <p className={`text-xs ${itemTheme?.text} font-bold`}>£{item.price}</p>
                              </div>
                              <div className="flex items-center gap-3 bg-white px-2 rounded-xl border-2 border-slate-100 shadow-xs">
                                  <button onClick={() => updateQty(item.id, -1)} className="text-slate-400 hover:text-red-500"><FaMinus size={8}/></button>
                                  <span className="font-bold w-4 text-center">{item.quantity}</span>
                                  <button onClick={() => updateQty(item.id, 1)} className={`${itemTheme?.text} hover:opacity-70`}><FaPlus size={8}/></button>
                              </div>
                            </div>
                        );
                      })}
                  </div>

                  {/* DROP THE SHIPPING COMPONENT HERE */}
                  <ShippingInfo totalPrice={totalPrice} />

                </div>

                <div className="pt-2 border-t-2 border-dashed border-slate-200 mt-6 bg-white">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                    <div className="flex justify-between md:block items-end">
                      <span className="text-slate-500 font-black uppercase text-[10px] tracking-[0.2em] block mb-1">Estimated Total</span>
                      <span className="text-2xl md:text-3xl font-black text-slate-900 italic tracking-tighter leading-none">£{totalPrice.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="w-full md:w-auto md:px-8 bg-blue-600 text-white py-3 rounded-xl font-bold uppercase italic tracking-tighter text-lg shadow-xl hover:bg-blue-700 hover:scale-[1.03] transition-all flex items-center justify-center gap-3"
                    >
                      Secure Checkout <FaShoppingBag size={14} />
                    </button>
                  </div>
                  <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest">By clicking pay now you agree to our rental terms and conditions</p>
                </div>
            </motion.div>
            </motion.div>
        )}
        </AnimatePresence>

      <PaymentGateway 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        totalAmount={totalPrice}
        customerOrder={Object.values(cart)}
        serviceType="Rental Services"
        onSuccess={() => { 
          setCart({}); 
          setIsCheckoutOpen(false); 
          setShowPaymentModal(false); 
          localStorage.removeItem('isundunrin_rental_cart'); // Clear storage on success
        }}
      />
    </div>
  );
}