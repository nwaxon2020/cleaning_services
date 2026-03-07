'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  FiMapPin, FiPhone, FiMail, FiClock, 
  FiArrowRight, FiNavigation, FiZap 
} from 'react-icons/fi';

const LocationUi = () => {
  const router = useRouter();

  // --- MOCK DATA ---
  const mockSettings = {
    address: "Market Place, Bristol, Lincolnshire PE21 6EH, United Kingdom",
    contactPhone: "+44 1205 367890",
    contactEmail: "hello@Bristolclean.co.uk",
  };

  const previewMapUrl = `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(mockSettings.address)}`;
  // Note: For a zero-config version without API key, we use the standard search embed
  const simpleMapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mockSettings.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  
  const directMapLink = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mockSettings.address)}`;

  return (
    <div className="bg-[#050505] min-h-screen pt-24 pb-20 overflow-hidden relative">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 blur-[150px] rounded-full -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-600/5 blur-[120px] rounded-full -ml-48 -mb-48" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        
        {/* --- HEADER SECTION --- */}
        <div className="mb-12 md:mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-4"
          >
            <div className="w-1 h-4 bg-orange-600 rounded-full" />
            <span className="text-orange-500 font-black uppercase text-[10px] tracking-[0.4em]">
              Regional Coverage
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none"
          >
            The <span className="text-orange-600">Bristol</span> Hub
          </motion.h1>
          <p className="text-zinc-500 mt-6 max-w-xl text-sm font-medium leading-relaxed">
            From our strategic center in Market Place, we synchronize high-standard cleaning logistics across the entire Lincolnshire region.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* --- LEFT SIDE: CONTACT CARDS --- */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Main Address Card - Updated with White Border */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-zinc-900/50 backdrop-blur-xl p-8 rounded-[2rem] border border-white relative overflow-hidden group shadow-[0_0_20px_rgba(255,255,255,0.05)]"
            >
              <div className="relative z-10">
                <div className="w-14 h-14 bg-orange-600 text-white rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_20px_rgba(234,88,12,0.3)] group-hover:scale-110 transition-transform">
                  <FiMapPin size={24} />
                </div>
                <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2">Primary Station</h3>
                <p className="text-xl font-bold text-white leading-tight mb-8">
                  {mockSettings.address}
                </p>
                <a 
                  href={directMapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-orange-500 font-black text-[10px] uppercase tracking-widest hover:gap-4 transition-all"
                >
                  Initiate Navigation <FiNavigation />
                </a>
              </div>
              <div className="absolute -right-4 -bottom-4 text-white/[0.02] font-black text-9xl select-none uppercase italic pointer-events-none">
                HQ
              </div>
            </motion.div>

            {/* Support Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a href={`tel:${mockSettings.contactPhone}`} className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5 group hover:border-orange-500/30 transition-all">
                <FiPhone className="text-orange-600 mb-4" size={20} />
                <h4 className="text-[10px] font-black uppercase text-zinc-500 mb-1 tracking-widest">Voice Support</h4>
                <p className="text-sm font-bold text-white">{mockSettings.contactPhone}</p>
              </a>
              
              <a href={`mailto:${mockSettings.contactEmail}`} className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5 group hover:border-orange-500/30 transition-all">
                <FiMail className="text-orange-600 mb-4" size={20} />
                <h4 className="text-[10px] font-black uppercase text-zinc-500 mb-1 tracking-widest">Digital Mail</h4>
                <p className="text-sm font-bold text-white truncate">{mockSettings.contactEmail}</p>
              </a>

              <div className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5 md:col-span-2 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <FiClock className="text-orange-500" size={20} />
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-zinc-500 mb-1 tracking-widest">Operating Window</h4>
                    <p className="text-xs font-bold text-white uppercase tracking-tighter">Mon - Sat: 08:00 — 19:00</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-orange-600/10 text-orange-500 rounded-full text-[8px] font-black uppercase tracking-tighter border border-orange-500/20 animate-pulse">
                  System Active
                </div>
              </div>
            </div>

            {/* Quick Actions - Updated to /services */}
            <div className="flex flex-wrap gap-3 pt-4">
              <button 
                onClick={() => router.push('/services')}
                className="w-full px-8 py-5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-orange-600 hover:text-white transition-all flex items-center justify-center gap-3 shadow-xl"
              >
                View Professional Services <FiZap />
              </button>
            </div>
          </div>

          {/* --- RIGHT SIDE: INTERACTIVE MAP --- */}
          <div className="lg:col-span-7 h-[450px] md:h-[680px] lg:sticky lg:top-24">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full h-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 bg-zinc-900 relative"
            >
              <iframe
                title="BristolClean Dark Map"
                src={simpleMapUrl}
                className="w-full h-full border-0 grayscale invert brightness-90 contrast-125 opacity-70 hover:opacity-100 hover:grayscale-0 hover:invert-0 transition-all duration-1000 overflow-hidden"
                style={{ pointerEvents: 'auto' }}
              />
              {/* Overlay Gradient for Map Depth */}
              <div className="absolute inset-0 pointer-events-none border-[12px] border-black/50 rounded-[2.5rem] shadow-inner" />
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LocationUi;