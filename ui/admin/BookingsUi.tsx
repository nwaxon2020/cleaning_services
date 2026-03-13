"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import RentalsBooking from '@/components/bookings/RentalsBooking';
import CleaningBooking from '@/components/bookings/CleaningBooking';
import DecorationBooking from '@/components/bookings/DecorationBooking';

export default function ServicesPageUi() {
  const [activeTab, setActiveTab] = useState('cleaning');
  const [isHydrated, setIsHydrated] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Notification States
  const [counts, setCounts] = useState<{ [key: string]: number }>({
    cleaning: 0,
    rentals: 0,
    decoration: 0
  });

  // 1. Auth & Hydration
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((u) => setUser(u));
    const savedTab = localStorage.getItem('lastVisitedServiceTab');
    if (savedTab) setActiveTab(savedTab);
    setIsHydrated(true);
    return () => unsubAuth();
  }, []);

  // 2. Real-time Status-Based Notification Listeners
  useEffect(() => {
    if (!user) return;

    const categories = [
      { id: 'cleaning', col: 'cleaning_orders', statusMatch: ["paid", "processing", "confirmed"] },
      { id: 'rentals', col: 'renting_orders', statusMatch: ["paid", "processing", "confirmed"] },
      { id: 'decoration', col: 'decoration_bookings', statusMatch: ["pending"] } 
    ];

    const unsubs = categories.map(cat => {
      // Logic: If status matches, the bubble shows. If Admin changes status, bubble vanishes.
      const q = query(
        collection(db, cat.col), 
        where("userId", "==", user.uid),
        where("status", "in", cat.statusMatch)
      );

      return onSnapshot(q, (snap) => {
        setCounts(prev => ({ ...prev, [cat.id]: snap.size }));
      });
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

  const activeLabel = tabs.find(t => t.id === activeTab)?.label || "Bookings";

  if (!isHydrated) return <div className="min-h-screen bg-[#020617]" />;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100">
      {/* FIXED HEADER */}
      <header className="flex flex-col md:flex-row gap-2 md:gap-6 justify-center md:items-end p-4 md:p-8 pb-4 md:pb-6 text-center md:text-left border-b border-white/5 bg-[#020617]/50 backdrop-blur-xl sticky top-0 z-50">
        
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

                <AnimatePresence>
                  {counts[tab.id] > 0 && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#020617] shadow-lg"
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

      {/* DYNAMIC CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
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