"use client";

import { useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { FaShieldAlt, FaClock, FaLeaf, FaStar, FaUsers, FaAward, FaTimes } from 'react-icons/fa';
import { IconType } from 'react-icons';

interface Reason {
  icon: IconType;
  title: string;
  description: string;
  details: string;
  color: string;
}

const reasons: Reason[] = [
  {
    icon: FaShieldAlt,
    title: 'Fully Insured',
    description: 'All our services are fully insured for your peace of mind',
    details: 'We carry comprehensive public liability and employees’ liability insurance. This protects both you and our staff from any legal or financial worry.',
    color: 'from-emerald-500 to-teal-600'
  },
  {
    icon: FaClock,
    title: '24/7 Availability',
    description: 'Round-the-clock cleaning services whenever you need us',
    details: 'Whether it is an emergency spill or night-shift office cleaning, our team is available 24 hours a day, 7 days a week around your schedule.',
    color: 'from-orange-500 to-red-600'
  },
  {
    icon: FaLeaf,
    title: 'Eco-Friendly',
    description: 'Using environmentally safe products and sustainable practices',
    details: 'We use non-toxic, biodegradable cleaning agents safe for children and pets. Our technology reduces water waste ensuring a deep, responsible clean.',
    color: 'from-lime-400 to-green-600'
  },
  {
    icon: FaStar,
    title: 'Trained Staff',
    description: 'Professional, vetted, and thoroughly trained cleaners',
    details: 'Every member undergoes a strict background check and intensive training. We employ professionals who understand the science of sanitation.',
    color: 'from-cyan-400 to-blue-600'
  },
  {
    icon: FaUsers,
    title: 'Local Team',
    description: 'Proudly serving the Boston, UK community',
    details: 'Based in Boston, we care about our reputation within our own community. When you call us, you’re talking to a neighbor, not a franchise.',
    color: 'from-violet-500 to-purple-600'
  },
  {
    icon: FaAward,
    title: 'Satisfaction',
    description: '100% guaranteed or we\'ll re-clean for free',
    details: 'If you aren’t 100% happy, notify us within 24 hours and we will return to re-clean that specific area immediately, free of charge.',
    color: 'from-rose-500 to-pink-600'
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
            Why Choose <span className="text-orange-500">Us?</span>
          </h2>
          <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto">
            Experience the difference of a professional touch. Click a card to learn more.
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
                className="w-full py-4 bg-orange-500 text-white font-bold rounded-xl active:scale-95"
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