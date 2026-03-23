"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import RentalsBooking from '@/components/bookings/admin/RentalsBooking';
import CleaningBooking from '@/components/bookings/admin/CleaningBooking';
import DecorationBooking from '@/components/bookings/admin/DecorationBooking';

export default function ServicesPageUi() {
  const [activeTab, setActiveTab] = useState('cleaning');
  const [isHydrated, setIsHydrated] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [counts, setCounts] = useState<{ [key: string]: number }>({
    cleaning: 0,
    rentals: 0,
    decoration: 0
  });

  // 1. Auth & Initial Hydration
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    
    const savedTab = localStorage.getItem('lastVisitedServiceTab');
    if (savedTab) {
      setActiveTab(savedTab);
    }
    
    setIsHydrated(true);
    return () => unsubAuth();
  }, []);

  // 2. Real-time Notification Listeners
  useEffect(() => {
    if (!user) return;

    // Get admin UID from rules
    const ADMIN_UID = 'BOCsVJ6dNzWC1HDrEM2TsisbalF3';
    const isActuallyAdmin = user.uid === ADMIN_UID;

    // Define categories with their collection names
    const categories = [
      { id: 'cleaning', col: 'cleaning_orders' },
      { id: 'rentals', col: 'renting_orders' },
      { id: 'decoration', col: 'decoration_bookings' }
    ];

    const unsubs = categories.map(cat => {
      let q;
      
      if (isActuallyAdmin) {
        // Admin: can query the entire collection
        q = query(collection(db, cat.col));
      } else {
        // Regular user: only their own documents (filtered by userId)
        q = query(collection(db, cat.col), where("userId", "==", user.uid));
      }

      return onSnapshot(q, 
        (snapshot) => {
          // Count documents with status "pending"
          const pendingCount = snapshot.docs.filter(doc => {
            const data = doc.data();
            return data.status === 'pending';
          }).length;
          
          setCounts(prev => ({ ...prev, [cat.id]: pendingCount }));
        },
        (error) => {
          // Silently fail - don't show errors in console for non-critical feature
          console.warn(`Could not fetch ${cat.col} counts:`, error.message);
          setCounts(prev => ({ ...prev, [cat.id]: 0 }));
        }
      );
    });

    return () => unsubs.forEach(unsub => unsub());
  }, [user]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    localStorage.setItem('lastVisitedServiceTab', tabId);
  };

  const tabs = [
    { id: 'cleaning', label: 'Cleaning' },
    { id: 'rentals', label: 'Rentals' },
    { id: 'decoration', label: 'Decoration' },
  ];

  const activeLabel = tabs.find(t => t.id === activeTab)?.label || "Cleaning";

  if (!isHydrated) return <div className="min-h-screen bg-[#020617]" />;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100">
      <header className="flex flex-col md:flex-row gap-2 md:gap-6 justify-center md:items-end p-4 md:p-8 pb-4 md:pb-6 text-center md:text-left border-b border-white/5 bg-[#020617] backdrop-blur-xl sticky top-0 z-20">
        
        <h1 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter text-white whitespace-nowrap">
          {activeLabel}<span className="text-blue-500"> Services</span>
        </h1>

        <div className="w-full mx-auto px-2 md:px-4">
          <div className="grid grid-cols-3 gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`relative py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}

                {/* Notification Badge */}
                <AnimatePresence>
                  {counts[tab.id] > 0 && (
                    <motion.span
                      key={`badge-${tab.id}`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#020617] shadow-lg font-bold"
                    >
                      {counts[tab.id]}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'cleaning' && <CleaningBooking />}
            {activeTab === 'rentals' && <RentalsBooking />}
            {activeTab === 'decoration' && <DecorationBooking />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}