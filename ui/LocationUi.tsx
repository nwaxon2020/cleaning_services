'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  FiMapPin, FiPhone, FiMail, FiClock, 
  FiNavigation, FiZap 
} from 'react-icons/fi';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const LocationUi = () => {
  const router = useRouter();

  // --- REAL-TIME STATES ---
  const [siteSettings, setSiteSettings] = useState<any>({});
  const [contact, setContact] = useState<any>({});

  // --- DATA FETCHING ---
  useEffect(() => {
    // Listen to Site Identity (Name, Branding)
    const unsubSite = onSnapshot(doc(db, "settings", "site"), (snap) => {
      if (snap.exists()) setSiteSettings(snap.data());
    });

    // Listen to Contact Info (Address, Map, Phone, Email)
    const unsubContact = onSnapshot(doc(db, "settings", "contact_info"), (snap) => {
      if (snap.exists()) setContact(snap.data());
    });

    return () => { unsubSite(); unsubContact(); };
  }, []);

  // --- ROBUST EXTRACT URL LOGIC ---
  const getCleanMapUrl = (rawUrl: string) => {
    if (!rawUrl) return null;
    
    let cleanUrl = rawUrl.trim();

    // 1. If it's a full <iframe> tag, extract the 'src' value
    if (cleanUrl.includes('<iframe')) {
      const match = cleanUrl.match(/src="([^"]+)"/);
      if (match && match[1]) {
        cleanUrl = match[1];
      }
    }

    // 2. Decode HTML entities (like & to &) which break the 'pb' parameter
    if (typeof document !== 'undefined') {
      const txt = document.createElement("textarea");
      txt.innerHTML = cleanUrl;
      cleanUrl = txt.value;
    }

    // 3. Force HTTPS for Google Maps Embed security
    if (cleanUrl.startsWith('http://')) {
      cleanUrl = cleanUrl.replace('http://', 'https://');
    }

    return cleanUrl;
  };

  // Format the full address string
  const fullAddress = `${contact.officeAddress || ''} ${contact.officeCity || ''} ${contact.officePostcode || ''}`.trim();
  
  // Resolve Map Source
  const mapSource = getCleanMapUrl(contact.mapEmbedUrl) || 
    `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(fullAddress || 'Bristol, UK')}`;
  
  const directMapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  return (
    <div className="bg-[#050505] min-h-screen pt-24 pb-20 overflow-hidden relative text-white">
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
            The <span className="text-orange-600">{siteSettings.siteName || "Bristol"}</span> Hub
          </motion.h1>
          <p className="text-zinc-500 mt-6 max-w-xl text-sm font-medium leading-relaxed">
            From our strategic center in {contact.officeCity || "the city"}, we synchronize high-standard logistics across the entire region to deliver excellence to your doorstep.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* --- LEFT SIDE: CONTACT CARDS --- */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Main Address Card */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-zinc-900/50 backdrop-blur-xl p-8 rounded-lg md:rounded-[2rem] border border-white relative overflow-hidden group shadow-[0_0_20px_rgba(255,255,255,0.05)]"
            >
              <div className="relative z-10">
                <div className="w-14 h-14 bg-orange-600 text-white rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_20px_rgba(234,88,12,0.3)] group-hover:scale-110 transition-transform">
                  <FiMapPin size={24} />
                </div>
                <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2">Primary Station</h3>
                <p className="text-xl font-bold text-white leading-tight mb-8">
                  {fullAddress || "Address not set in editor"}
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
              <a href={`tel:${contact.generalPhone}`} className="bg-zinc-900/40 p-6 rounded-lg md:rounded-2xl border border-white/5 group hover:border-orange-500/30 transition-all">
                <FiPhone className="text-orange-600 mb-4" size={20} />
                <h4 className="text-[10px] font-black uppercase text-zinc-500 mb-1 tracking-widest">Voice Support</h4>
                <p className="text-sm font-bold text-white">{contact.generalPhone || "Not set"}</p>
              </a>
              
              <a href={`mailto:${contact.generalEmail}`} className="bg-zinc-900/40 p-6 rounded-lg md:rounded-2xl border border-white/5 group hover:border-orange-500/30 transition-all">
                <FiMail className="text-orange-600 mb-4" size={20} />
                <h4 className="text-[10px] font-black uppercase text-zinc-500 mb-1 tracking-widest">Digital Mail</h4>
                <p className="text-sm font-bold text-white truncate">{contact.generalEmail || "Not set"}</p>
              </a>

              <div className="bg-zinc-900/40 p-6 rounded-lg md:rounded-2xl border border-white/5 md:col-span-2 flex items-center justify-between">
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

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 pt-4">
              <button 
                onClick={() => router.push('/services')}
                className="w-full px-8 py-5 bg-white text-black rounded-lg md:rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-orange-600 hover:text-white transition-all flex items-center justify-center gap-3 shadow-xl"
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
              className="w-full h-full rounded-lg md:rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 bg-zinc-900 relative"
            >
              {mapSource && (
                <iframe
                  title="Location Map"
                  src={mapSource}
                  className="w-full h-full border-0 grayscale invert brightness-90 contrast-125 opacity-70 hover:opacity-100 hover:grayscale-0 hover:invert-0 transition-all duration-1000"
                  style={{ pointerEvents: 'auto' }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              )}
              {/* Overlay Gradient for Map Depth */}
              <div className="absolute inset-0 pointer-events-none border-8 md:border-[12px] border-black/50 rounded-lg md:rounded-[2.5rem] shadow-inner" />
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LocationUi;