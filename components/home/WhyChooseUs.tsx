"use client";

import { useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { FaShieldAlt, FaClock, FaLeaf, FaStar, FaUsers, FaAward, FaTimes } from 'react-icons/fa';
import { IconType } from 'react-icons';

// --- Interface to fix the 'never' error ---
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
    details: 'We carry comprehensive public liability and employees’ liability insurance. This means in the unlikely event of accidental damage or injury, both you and our staff are protected. You can trust us in your home or office without any legal or financial worry.',
    color: 'from-emerald-500 to-teal-600'
  },
  {
    icon: FaClock,
    title: '24/7 Availability',
    description: 'Round-the-clock cleaning services whenever you need us',
    details: 'Whether it is an emergency spill before a big event or a night-shift office cleaning requirement, our team is available 24 hours a day, 7 days a week. We work around your schedule, not the other way around.',
    color: 'from-orange-500 to-red-600'
  },
  {
    icon: FaLeaf,
    title: 'Eco-Friendly',
    description: 'Using environmentally safe products and sustainable practices',
    details: 'We exclusively use non-toxic, biodegradable cleaning agents that are safe for children and pets. Our microfibre technology reduces water waste, ensuring a deep clean that doesn’t cost the earth.',
    color: 'from-lime-400 to-green-600'
  },
  {
    icon: FaStar,
    title: 'Trained Staff',
    description: 'Professional, vetted, and thoroughly trained cleaners',
    details: 'Every member of our team undergoes a strict background check and a 2-week intensive training program. We don’t just hire cleaners; we train professionals who understand the science of sanitation.',
    color: 'from-cyan-400 to-blue-600'
  },
  {
    icon: FaUsers,
    title: 'Local Team',
    description: 'Proudly serving the Boston, UK community',
    details: 'Based right here in Boston, we aren’t a faceless national franchise. We know the local area and we care about our reputation within our own community. When you call us, you’re talking to a neighbor.',
    color: 'from-violet-500 to-purple-600'
  },
  {
    icon: FaAward,
    title: 'Satisfaction',
    description: '100% guaranteed or we\'ll re-clean for free',
    details: 'Our quality control is second to none. If you aren’t 100% happy with any area we’ve cleaned, notify us within 24 hours and we will return to re-clean that specific area immediately, free of charge.',
    color: 'from-rose-500 to-pink-600'
  }
];

const WhyChooseUs = () => {
  // --- State explicitly typed to avoid 'never' error ---
  const [selectedReason, setSelectedReason] = useState<Reason | null>(null);

  return (
    <section className="py-16 md:py-24 bg-[#050505] overflow-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-orange-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
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
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`group relative p-6 rounded-xl md:rounded-3xl bg-white/[0.03] border cursor-pointer transition-all duration-300 active:scale-95 overflow-hidden`}
              style={{ borderColor: 'rgba(255,255,255,0.08)' }} // Default border
            >
              {/* CONSTANT SUBTLE COLOR GLOW */}
              <div className={`absolute inset-0 bg-gradient-to-br ${reason.color} opacity-[0.03] group-hover:opacity-10 transition-opacity duration-500`} />
              
              {/* BOTTOM ACCENT LINE - SHOWS UNIQUE COLOR ALWAYS */}
              <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${reason.color} w-full opacity-50 group-hover:opacity-100 transition-opacity`} />

              <div className="flex flex-col items-start gap-4 relative z-10">
                <div className={`w-12 h-12 rounded-xl md:rounded-2xl bg-gradient-to-br ${reason.color} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform`}>
                  <reason.icon className="text-xl text-white" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold text-white mb-2 transition-colors`}>
                    {reason.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {reason.description}
                  </p>
                </div>
              </div>

              {/* DYNAMIC BORDER ON HOVER */}
              <div className={`absolute inset-0 rounded-xl md:rounded-3xl border border-transparent group-hover:border-white/20 transition-all pointer-events-none`} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* OVERLAY MODAL */}
      <AnimatePresence>
        {selectedReason && (
          <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 overflow-hidden">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReason(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />

            {/* Content Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-xl p-8 shadow-2xl z-20"
            >
              <button 
                onClick={() => setSelectedReason(null)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white bg-white/5 rounded-full transition-colors"
              >
                <FaTimes size={18} />
              </button>

              <div className={`w-14 h-14 mb-6 rounded-2xl bg-gradient-to-br ${selectedReason.color} flex items-center justify-center`}>
                <selectedReason.icon className="text-2xl text-white" />
              </div>

              <h3 className="text-2xl font-black text-white mb-4">
                {selectedReason.title}
              </h3>
              
              <p className="text-orange-500 font-medium italic mb-6 leading-relaxed">
                "{selectedReason.description}"
              </p>

              <div className="h-px w-full bg-white/10 mb-6" />

              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                {selectedReason.details}
              </p>

              <button 
                onClick={() => setSelectedReason(null)}
                className="w-full py-4 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all active:scale-95"
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