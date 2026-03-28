"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { 
  collection, doc, query, orderBy, onSnapshot 
} from 'firebase/firestore';
import { 
  FaUsers, FaAward, 
  FaRocket, FaStar, FaEnvelope, 
  FaPhoneAlt, FaMapMarkerAlt, FaLinkedin, FaTwitter
} from 'react-icons/fa';

export default function AboutUi() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  // --- FIREBASE STATES ---
  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [contact, setContact] = useState<any>({}); // Added contact state

  // --- DATA FETCHING ---
  useEffect(() => {
    const unsubSlides = onSnapshot(query(collection(db, "about_hero_slides"), orderBy("order", "asc")), (snap) => {
      setHeroSlides(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubTimeline = onSnapshot(query(collection(db, "about_timeline"), orderBy("year", "asc")), (snap) => {
      setTimeline(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubStaff = onSnapshot(query(collection(db, "about_staff"), orderBy("createdAt", "desc")), (snap) => {
      setStaff(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubSettings = onSnapshot(doc(db, "settings", "about_mission"), (snap) => {
      if (snap.exists()) setSettings(snap.data());
    });
    // Fetching the contact_info for the footer section
    const unsubContact = onSnapshot(doc(db, "settings", "contact_info"), (snap) => {
      if (snap.exists()) setContact(snap.data());
    });
    
    return () => { 
      unsubSlides(); unsubTimeline(); unsubStaff(); unsubSettings(); unsubContact(); 
    };
  }, []);

  useEffect(() => {
    if (heroSlides.length > 0) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % heroSlides.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [heroSlides]);

  // Fallback while loading
  if (!settings.hero && heroSlides.length === 0) return null;

  return (
    <div className="min-h-screen bg-white text-slate-900 pt-16 md:pt-20 pb-20 overflow-hidden">
      
      {/* --- SLIDING HERO SECTION --- */}
      <section className="relative h-[40vh] md:h-[70vh] flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 z-0"
          >
            <div className="absolute inset-0 bg-black/60 z-10" />
            {heroSlides.length > 0 && (
              <img 
                src={heroSlides[currentIndex].url} 
                className="w-full h-full object-cover" 
                alt="Hero Background" 
              />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="relative z-20 text-center px-6">
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-orange-500 font-black uppercase tracking-[0.3em] text-[10px] mb-4 block"
          >
            EST. 2018
          </motion.span>

          <div className="overflow-hidden mb-4">
            <AnimatePresence mode="wait">
              {heroSlides.length > 0 && (
                <motion.h1 
                  key={currentIndex}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -40 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase"
                  dangerouslySetInnerHTML={{ __html: heroSlides[currentIndex].title }}
                />
              )}
            </AnimatePresence>
          </div>
          
          <div className="h-10">
             <AnimatePresence mode="wait">
                {heroSlides.length > 0 && (
                  <motion.p 
                    key={currentIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.8 }}
                    className="text-white/90 max-w-xl mx-auto font-medium uppercase tracking-[0.1em] text-[12px] italic"
                  >
                    "{heroSlides[currentIndex].quote}"
                  </motion.p>
                )}
             </AnimatePresence>
          </div>

          <p className="text-white/60 max-w-xl mx-auto mt-8 font-medium uppercase tracking-[0.2em] text-[9px]">
            The standard of cleanliness in Bristol, UK
          </p>
        </div>
      </section>

      {/* --- HERO TEXT SECTION --- */}
      <section className="relative px-6 py-8 md:py-10 bg-slate-50">
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-6xl font-black tracking-tighter mb-3 text-slate-900 uppercase"
          >
            RESTORING <span className="text-orange-600 italic">{settings.hero || "COMFORT"}</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-slate-600 text-lg md:text-xl leading-relaxed"
          >
            {settings.subtitle}
          </motion.p>
        </div>
      </section>

      {/* --- TIMELINE SECTION --- */}
      <section className="py-10 md:py-24 px-6 border-b border-slate-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-16 text-center text-blue-900">Our Journey</h2>
          <div className="relative border-l-2 border-slate-100 ml-4 md:ml-0 md:flex md:border-l-0 md:border-t-2 md:justify-between">
            {timeline.map((item, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-8 md:pl-0 md:pt-10 md:w-1/4"
              >
                <div className="absolute -left-[9px] top-0 md:-top-[9px] md:left-0 w-4 h-4 rounded-full bg-orange-600 ring-4 ring-white" />
                <span className="text-orange-600 font-black text-2xl mb-2 block">{item.year}</span>
                <h3 className="text-slate-900 font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-blue-700 text-sm leading-relaxed pr-4">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CEO SPOTLIGHT --- */}
      <section className="py-24 px-4 md:px-6 bg-slate-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               className="relative"
            >
              <div className="absolute border-2 border-orange-100 rounded-3xl" />
              <img 
                src={settings.ceoImageUrl} 
                alt={settings.ceoName} 
                className="w-full h-[500px] object-cover rounded-2xl shadow-2xl shadow-slate-200"
              />
              <div className="absolute bottom-2 left-3 md:left-6 right-3 md:right-6 bg-white/95 backdrop-blur-md p-3 md:p-4 rounded-md md:rounded-xl shadow-xl border border-slate-100">
                 <p className="text-slate-700 italic text-sm mb-2">"{settings.motto}"</p>
                 <p className="text-orange-600 font-black text-xs uppercase tracking-widest">{settings.ceoName} — Founder</p>
                 <div className="mt-2 text-[10px] text-slate-500 font-bold tracking-tight">
                    <p className='font-black'>Tel: <a href={`tel:${settings.ceoPhone}`} className='text-blue-600 font-medium hover:underline'>{settings.ceoPhone}</a></p>
                    <p className="lowercase font-black">Email: <a href={`mailto@:${settings.ceoEmail}`} className='text-blue-600 font-medium hover:underline'>{settings.ceoEmail}</a></p>
                 </div>
              </div>
            </motion.div>

            <div className="space-y-8">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900">Letter from the <span className="text-orange-600">CEO</span></h2>
              <div className="w-20 h-1.5 bg-orange-600 rounded-full" />
              <p className="text-slate-600 leading-relaxed text-lg italic">
                {settings.vision}
              </p>
              <p className="text-slate-600 leading-relaxed">
                {settings.mission}
              </p>
              
              <div className="grid grid-cols-2 gap-6 pt-6">
                <div className="p-6 bg-white shadow-sm rounded-2xl border border-slate-100">
                  <h4 className="text-orange-600 text-3xl font-black mb-1">{settings.experience}</h4>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Active Clients</p>
                </div>
                <div className="p-6 bg-white shadow-sm rounded-2xl border border-slate-100">
                  <h4 className="text-orange-600 text-3xl font-black mb-1">{settings.clientsCount}</h4>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Satisfaction</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- MEET THE STAFF --- */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-900">Our Professional Staff</h2>
            <p className="text-slate-500 mt-1 font-medium">The experts behind your smile</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {staff.map((member, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group"
              >
                <div className="relative overflow-hidden rounded-2xl mb-2 shadow-md max-w-[320px] mx-auto">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full h-[380px] object-cover  md:grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-center">
                    <h4 className="text-lg font-bold text-slate-900 mb-1">{member.name}</h4>
                    <p className="text-orange-600 text-[10px] font-black uppercase tracking-widest mb-3">{member.role}</p>
                    <p className="text-slate-500 text-xs leading-relaxed mb-4 px-4">{member.bio}</p>
                    <div className="flex justify-center gap-4 text-slate-400">
                    <FaLinkedin className="hover:text-orange-600 cursor-pointer transition-colors" />
                    <FaTwitter className="hover:text-orange-600 cursor-pointer transition-colors" />
                    </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- MISSION & VISION WRITEUP --- */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-8 text-slate-900">Our Unwavering <span className="text-orange-600 italic">Mission</span></h2>
            <p className="text-lg text-slate-700 leading-relaxed mb-6 font-medium">
              At Isundunrin, our mission extends far beyond simply removing dust and grime. We are committed to redefining the standard of care across cleaning, decoration, health services, and event rentals.
            </p>
            <p className="text-slate-500 leading-relaxed italic border-l-4 border-orange-500 pl-6 text-left max-w-2xl mx-auto">
              "{settings.values}"
            </p>
          </motion.div>
        </div>
      </section>

      {/* --- CONTACT & INFO SECTION (POPULATED) --- */}
      <section className="py-20 px-6 bg-slate-900">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            <a href={`mailto:${contact.generalEmail}`} className="flex flex-col items-center text-center p-8 bg-white/5 rounded-3xl border border-white/5 hover:border-orange-500/30 transition-all group">
                <div className="w-14 h-14 bg-orange-600 text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FaEnvelope size={24} />
                </div>
                <h4 className="font-bold text-white text-lg mb-2">Email Us</h4>
                <p className="text-slate-400 text-sm italic">{contact.generalEmail}</p>
            </a>

            <a href={`tel:${contact.generalPhone}`} className="flex flex-col items-center text-center p-8 bg-white/5 rounded-3xl border border-white/5 hover:border-orange-500/30 transition-all group">
                <div className="w-14 h-14 bg-orange-600 text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FaPhoneAlt size={24} />
                </div>
                <h4 className="font-bold text-white text-lg mb-2">Call Support</h4>
                <p className="text-slate-400 text-sm italic">{contact.generalPhone}</p>
            </a>

            <button onClick={() => router.push('/location')} className="flex flex-col items-center text-center p-8 bg-white/5 rounded-3xl border border-white/5 hover:border-orange-500/30 transition-all group">
                <div className="w-14 h-14 bg-orange-600 text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FaMapMarkerAlt size={24} />
                </div>
                <h4 className="font-bold text-white text-lg mb-2">Our Office</h4>
                <p className="text-slate-400 text-sm italic">Market Place, {contact.officeCity} {contact.officePostcode}</p>
            </button>
        </div>
      </section>

      {/* --- RESTORED CTA --- */}
      <section className="py-24 px-2 md:px-6 bg-white">
        <div className="max-w-5xl mx-auto bg-orange-500 rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/20 blur-[120px] -mr-48 -mt-48" />
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-600/10 blur-[100px] -ml-32 -mb-32" />
           
           <h2 className="text-xl md:text-3xl md:text-5xl font-black text-white mb-6 uppercase tracking-tighter relative z-10">
             Ready for a <span className="text-black italic">Fresh</span> Start?
           </h2>
           <p className="text-sm md:text-base text-slate-200 mb-10 font-medium max-w-xl mx-auto relative z-10">
             Join over {settings.experience} satisfied clients and experience the difference of professional care.
           </p>
           <button className="text-sm md:text-base px-10 py-4 bg-black text-white rounded-lg md:rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-900 transition-all shadow-xl shadow-orange-600/40 relative z-10">
             Book Your Services Now
           </button>
        </div>
      </section>
    </div>
  );
}