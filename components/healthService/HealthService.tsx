"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { 
  FaWhatsapp, FaComments, FaEnvelope, 
  FaMapMarkerAlt, FaHeartbeat, FaStethoscope, 
  FaTooth, FaEye, FaBriefcaseMedical, FaClock 
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function HealthServiceUi() {
  const [slides, setSlides] = useState<string[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [contact, setContact] = useState({ phone: '', email: '', address: '', whatsapp: '' });
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    onSnapshot(doc(db, "settings", "health_slides"), (s) => {
      if (s.exists()) setSlides(s.data().urls || []);
    });

    onSnapshot(query(collection(db, "health_services"), orderBy("createdAt", "desc")), (s) => {
      setServices(s.docs.map(d => ({id: d.id, ...d.data()})));
    });

    onSnapshot(doc(db, "settings", "contact_info"), (s) => {
      if (s.exists()) {
        const d = s.data();
        setContact({
          phone: d.generalPhone || '',
          email: d.generalEmail || '',
          address: `${d.officeAddress}, ${d.officeCity}`,
          whatsapp: (d.generalPhone || '').replace(/\s+/g, '').replace('+', '')
        });
      }
    });
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides]);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'FaTooth': return <FaTooth />;
      case 'FaEye': return <FaEye />;
      case 'FaStethoscope': return <FaStethoscope />;
      case 'FaBriefcaseMedical': return <FaBriefcaseMedical />;
      default: return <FaHeartbeat />;
    }
  };

  return (
    <div className="bg-[#0B0F1A] min-h-screen text-slate-200">
      
      {/* 1. CLEAN SLIDER (No Overlaps) */}
      <section className="relative h-[40vh] md:h-[57vh] bg-slate-900 overflow-hidden">
        <AnimatePresence mode="wait">
          {slides.length > 0 ? (
            <motion.img
              key={currentSlide}
              src={slides[currentSlide]}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-600 font-black uppercase text-[10px]">Loading Visuals...</div>
          )}
        </AnimatePresence>
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-4">
          <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white">
            Healthcare <span className="text-emerald-500">Excellence</span>
          </h1>
          <p className="bg-black/60 rounded-md px-3 py-1 text-slate-300 text-[10px] md:text-xs uppercase font-black tracking-[0.3em] mt-2">Professional Medical Solutions</p>
        </div>
      </section>

      {/* 2. CONTACT & ADDRESS SECTION (Stacked Below) */}
      <section className="bg-[#111625] border-y border-slate-800 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* WhatsApp */}
            <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" className="flex items-center gap-4 p-4 bg-[#1C2333] rounded-2xl border border-slate-700/50 hover:border-emerald-500/50 transition-all group">
              <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><FaWhatsapp size={20}/></div>
              <div className="overflow-hidden">
                <p className="text-[9px] font-black uppercase text-slate-500">WhatsApp</p>
                <p className="text-xs font-bold text-slate-200 truncate">{contact.phone}</p>
              </div>
            </a>

            {/* Email */}
            <a href={`mailto:${contact.email}`} className="flex items-center gap-4 p-4 bg-[#1C2333] rounded-2xl border border-slate-700/50 hover:border-blue-500/50 transition-all group">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><FaEnvelope size={18}/></div>
              <div className="overflow-hidden">
                <p className="text-[9px] font-black uppercase text-slate-500">Email Address</p>
                <p className="text-xs font-bold text-slate-200 truncate">{contact.email}</p>
              </div>
            </a>

            {/* Chat */}
            <button onClick={() => window.location.href='/chat'} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-transparent hover:bg-emerald-50 transition-all group text-left">
              <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><FaComments size={18}/></div>
              <div>
                <p className="text-[9px] font-black uppercase text-slate-400">Consultation</p>
                <p className="text-xs font-black text-slate-900">Start Live Chat</p>
              </div>
            </button>
          </div>

          {/* Address Bar */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-slate-400 border-t border-slate-800/50 pt-6">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
              <FaMapMarkerAlt className="text-emerald-500" /> {contact.address}
            </div>
            <div className="hidden md:block w-1 h-1 bg-slate-700 rounded-full" />
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
              <FaClock className="text-emerald-500" /> 24/7 Response Available
            </div>
          </div>
        </div>
      </section>

      {/* 3. SERVICE CATALOG */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-center text-blue-300 mb-12 italic">Available Specialist Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <motion.div 
              key={service.id} 
              className="bg-[#161B29] p-8 rounded-[2rem] border border-slate-800 flex flex-col items-start hover:border-emerald-500/30 transition-all shadow-xl"
            >
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center text-2xl mb-6 border border-emerald-500/20">
                {getIcon(service.icon)}
              </div>
              
              <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/5 px-3 py-1 rounded-md mb-4 border border-emerald-500/10">
                {service.category}
              </span>

              <h3 className="text-xl font-black text-white mb-3 uppercase tracking-tight italic">
                {service.name}
              </h3>
              
              <p className="text-[11px] text-slate-400 leading-relaxed mb-8 flex-1">
                {service.description}
              </p>

              <button 
                onClick={() => window.location.href=`/chat?inquiry=${encodeURIComponent(service.name)}`}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg active:scale-95"
              >
                Inquire Service
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      <style jsx global>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0B0F1A; }
        ::-webkit-scrollbar-thumb { background: #1C2333; border-radius: 10px; }
      `}</style>
    </div>
  );
}