"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { FaMagic, FaShieldAlt, FaClock, FaHeadset } from 'react-icons/fa';
import QuickBooking from "../booking/QuickBooking";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc } from "firebase/firestore";

const Hero = () => {
  const [slides, setSlides] = useState<any[]>([]);
  const [globalAttract, setGlobalAttract] = useState("");
  const [currentImage, setCurrentImage] = useState(0);
  const [loading, setLoading] = useState(true);
  // State for dynamic phone number
  const [contactData, setContactData] = useState<any>(null);

  // FETCH REAL-TIME DATA
  useEffect(() => {
    // 1. Fetch Slides
    const unsubSlides = onSnapshot(
      query(collection(db, "global_slides"), orderBy("order", "asc")),
      (snap) => {
        const slideData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setSlides(slideData);
        setLoading(false);
      }
    );

    // 2. Fetch Global Attract Text
    const unsubAttract = onSnapshot(doc(db, "settings", "slideshow"), (snap) => {
      if (snap.exists()) {
        setGlobalAttract(snap.data().attract || "");
      }
    });

    // 3. NEW: Fetch Global Contact Info (Phone Number)
    const unsubContact = onSnapshot(doc(db, "settings", "contact_info"), (snap) => {
      if (snap.exists()) {
        setContactData(snap.data());
      }
    });

    return () => {
      unsubSlides();
      unsubAttract();
      unsubContact();
    };
  }, []);

  // Interval logic to change images
  useEffect(() => {
    if (slides.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % slides.length);
    }, 10000); 
    
    return () => clearInterval(timer);
  }, [slides.length]);

  if (loading || slides.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const activeSlide = slides[currentImage];

  // Phone processing logic
  const displayPhone = contactData?.generalPhone || "+44 0000 000 000";
  const dialPhone = displayPhone.replace(/\s+/g, '');

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with dynamic image rotation */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImage}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url("${activeSlide.url}")`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent"></div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-28 pb-20 md:py-33">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="z-10"
          >
            {/* Updated Mobile Phone Link */}
            <Link href={`tel:${dialPhone}`} className="md:hidden mb-6 w-fit bg-black/50 backdrop-blur-md rounded-full text-[10px] flex items-center gap-2 px-4 py-2 border border-white/10 font-bold text-gray-50 hover:bg-gray-900 transition-all">
              <FaHeadset className="text-orange-500" /> 
              <span>{displayPhone}</span>
            </Link>

            {/* FIXED HEIGHT CONTAINER TO PREVENT SHAKING */}
            <div className="mb-2 h-auto min-h-[120px] md:min-h-[180px] lg:min-h-[200px] flex items-center">
              <AnimatePresence mode="wait">
                <motion.h1 
                  key={currentImage}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-[0.95]"
                >
                  {activeSlide.quote}{' '}
                  <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-orange-500 block md:inline mt-2 md:mt-0">
                    in Bristol, UK
                  </span>
                </motion.h1>
              </AnimatePresence>
            </div>
            
            {/* GLOBAL ATTRACT TEXT */}
            <div className="h-auto md:h-16 flex items-start mt-4">
              {globalAttract && (
                <p className="text-base md:text-lg text-gray-300 mb-8 max-w-lg leading-relaxed font-medium">
                  {globalAttract}
                </p>
              )}
            </div>

            <div className="mt-1 md:mt-15 flex flex-col md:flex-row gap-4">
              <Link
                href="/services"
                className="text-center w-full md:w-auto bg-orange-600 text-white px-10 py-4 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-orange-700 transition-all transform hover:scale-105 shadow-xl shadow-orange-600/20"
              >
                Book Now
              </Link>
              <Link
                href="/about"
                className="text-center w-full md:w-auto bg-white/10 backdrop-blur-md text-white px-10 py-4 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10"
              >
                Learn More
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 md:gap-6 mt-12 pt-8 border-t border-white/10">
              {[
                { icon: FaMagic, value: '500+', label: 'Happy Clients' },
                { icon: FaShieldAlt, value: '100%', label: 'Eco-Friendly' },
                { icon: FaClock, value: '24/7', label: 'Availability' },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <stat.icon className="text-xl md:text-2xl text-orange-500 mb-2" />
                  <div className="text-base md:text-lg font-black text-white">{stat.value}</div>
                  <div className="text-[8px] md:text-[10px] uppercase font-bold tracking-widest text-gray-500">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Column - Booking Form Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full max-w-[35rem] relative lg:absolute lg:top-34 lg:right-8 mt-10 lg:mt-0 z-20"
          >
            <QuickBooking />
          </motion.div>
        </div>
      </div>

      {/* Dynamic Slide Indicators */}
      <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex gap-2 z-30">
        {slides.map((_, idx) => (
          <button 
            key={idx} 
            onClick={() => setCurrentImage(idx)}
            className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentImage ? "w-10 bg-orange-500" : "w-3 bg-white/20 hover:bg-white/40"}`}
          />
        ))}
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>
    </div>
  );
};

export default Hero;