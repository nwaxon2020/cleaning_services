"use client";

import { useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHome, FaPaintBrush, FaHeartbeat, FaGlassCheers, FaBed,
  FaTimes, FaCheckCircle, FaClock as FaClockRegular,
  FaLeaf as FaLeafRegular
} from 'react-icons/fa';
import { IconType } from 'react-icons';

interface Reason {
  icon: IconType;
  title: string;
  description: string;
  details: string;
  color: string;
}

const reasons: Reason[] = [
  // 1. Professional Cleaning Services
  {
    icon: FaHome,
    title: 'Professional Cleaning',
    description: 'Expert residential and commercial cleaning with hospital-grade standards',
    details: 'From deep cleaning to regular maintenance, our professional team ensures every corner sparkles. We use eco-friendly products and advanced equipment for a thorough clean that\'s safe for your family, pets, and the environment.',
    color: 'from-blue-500 to-cyan-600'
  },
  
  // 2. Decoration & Renovation
  {
    icon: FaPaintBrush,
    title: 'Decoration Services',
    description: 'Expert painting, tiling, flooring, and wall decoration',
    details: 'Transform your space with our professional decoration services. Whether it\'s interior painting, ceramic tiling, laminate flooring, or feature wall installation, our skilled craftsmen deliver stunning results that enhance your property\'s value and appeal.',
    color: 'from-purple-500 to-pink-600'
  },
  
  // 3. Health & Wellness
  {
    icon: FaHeartbeat,
    title: 'Health Services',
    description: 'Comprehensive care and support for your well-being',
    details: 'Your health matters to us. Our qualified health professionals provide confidential consultations, wellness programs, and personalized care. We work with you to create a healthier lifestyle in a comfortable, supportive environment.',
    color: 'from-green-500 to-emerald-600'
  },
  
  // 4. Event Rentals
  {
    icon: FaGlassCheers,
    title: 'Event Rentals',
    description: 'Quality tableware, cutlery, and display equipment for every occasion',
    details: 'Make your event unforgettable with our premium rental collection. From elegant charger plates and cutlery to stunning food displayers and serving ware, we provide everything you need for weddings, parties, and corporate events.',
    color: 'from-amber-500 to-orange-600'
  },
  
  // 5. B&B & Hospitality
  {
    icon: FaBed,
    title: 'B&B Services',
    description: 'Specialized cleaning and maintenance for guest accommodations',
    details: 'Keep your guests coming back with our professional B&B cleaning services. We handle room turnover, deep cleaning, laundry, and common area maintenance, ensuring your property always meets the highest hospitality standards.',
    color: 'from-indigo-500 to-blue-600'
  },
  
  // 6. 100% Satisfaction
  {
    icon: FaCheckCircle,
    title: 'Satisfaction Guaranteed',
    description: 'We stand behind every service with our 100% guarantee',
    details: 'Your satisfaction is our priority. If you\'re not completely happy with any service—cleaning, decoration, health consultation, or rental—notify us within 24 hours and we\'ll make it right at no additional cost. That\'s our promise.',
    color: 'from-red-500 to-rose-600'
  }
];

const WhyChooseUs = () => {
  const [selectedReason, setSelectedReason] = useState<Reason | null>(null);

  return (
    <section className="py-16 md:py-24 bg-[#050505] overflow-hidden relative">
      {/* Reduced Opacity Background Glow - No Blur on Mobile for speed */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-orange-500/5 hidden md:block blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">
            Why Choose <span className="text-orange-500">Isundunrin?</span>
          </h2>
          <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto">
            From cleaning to decoration, health to events—we deliver excellence across every service. Click a card to learn more.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {reasons.map((reason, index) => (
            <motion.div
              key={index}
              onClick={() => setSelectedReason(reason)}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              viewport={{ once: true }}
              style={{ willChange: 'transform' }}
              className="group relative p-6 rounded-2xl md:rounded-3xl bg-white/[0.04] border border-white/[0.05] cursor-pointer transition-all active:scale-95 overflow-hidden"
            >
              <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${reason.color} w-full opacity-40 group-hover:opacity-100 transition-opacity`} />

              <div className="flex flex-col items-start gap-4 relative z-10">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${reason.color} flex items-center justify-center shadow-lg transition-transform group-hover:scale-105`}>
                  <reason.icon className="text-xl text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">{reason.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{reason.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedReason && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop - Solid opacity is faster than blur */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReason(null)}
              className="absolute inset-0 bg-black/95 md:backdrop-blur-sm"
              style={{ willChange: 'opacity' }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-8 shadow-2xl z-[110]"
              style={{ willChange: 'transform, opacity' }}
            >
              <button 
                onClick={() => setSelectedReason(null)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white bg-white/5 rounded-full"
              >
                <FaTimes size={18} />
              </button>

              <div className={`w-14 h-14 mb-6 rounded-2xl bg-gradient-to-br ${selectedReason.color} flex items-center justify-center`}>
                <selectedReason.icon className="text-2xl text-white" />
              </div>

              <h3 className="text-2xl font-black text-white mb-4">{selectedReason.title}</h3>
              <p className="text-orange-500 font-medium italic mb-6 leading-relaxed">"{selectedReason.description}"</p>
              <div className="h-px w-full bg-white/10 mb-6" />
              <p className="text-gray-400 text-sm leading-relaxed mb-8">{selectedReason.details}</p>

              <button 
                onClick={() => setSelectedReason(null)}
                className="w-full py-4 bg-orange-500 text-white font-bold rounded-xl active:scale-95 hover:bg-orange-600 transition-all"
              >
                Close Details
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default WhyChooseUs;