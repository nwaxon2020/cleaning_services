"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, FiMinus, FiHelpCircle, FiCalendar, 
  FiCreditCard, FiCheckCircle, FiShield, FiMessageSquare 
} from 'react-icons/fi';

const FaqPageUi = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // --- MOCK DATA ---
  const mockContent = {
    faqSubtitle: "Everything you need to know about our professional cleaning standards",
    faqCategories: [
      {
        category: "Booking & Scheduling",
        questions: [
          { q: "How do I book a cleaning session?", a: "You can book directly through our online portal by selecting a service, choosing an available date, and confirming your details. Alternatively, you can call our Boston office during business hours." },
          { q: "Can I reschedule or cancel my booking?", a: "Yes, you can reschedule or cancel up to 24 hours before your appointment without any fee. Cancellations within 24 hours may incur a small administrative charge." },
          { q: "Do I need to be home during the cleaning?", a: "No, many of our clients provide us with a spare key or entry code. All our staff are fully vetted and insured for your peace of mind." }
        ]
      },
      {
        category: "Payments & Pricing",
        questions: [
          { q: "What payment methods do you accept?", a: "We accept all major credit/debit cards, bank transfers, and secure online payments via our website. We do not currently accept cash for safety reasons." },
          { q: "Are there any hidden fees?", a: "None at all. The price you see during booking is the final price, inclusive of all cleaning supplies and equipment." }
        ]
      },
      {
        category: "Service Standards",
        questions: [
          { q: "What cleaning products do you use?", a: "We use high-quality, eco-friendly, and non-toxic cleaning products that are safe for pets, children, and the environment while maintaining hospital-grade sanitization." },
          { q: "What if I am not happy with the service?", a: "We offer a 100% Satisfaction Guarantee. If you are not happy with any area we cleaned, notify us within 24 hours and we will return to re-clean it for free." }
        ]
      }
    ]
  };

  const getIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('book') || cat.includes('schedul')) return <FiCalendar />;
    if (cat.includes('pay') || cat.includes('pric')) return <FiCreditCard />;
    if (cat.includes('service') || cat.includes('standard')) return <FiCheckCircle />;
    return <FiShield />;
  };

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="bg-[#F9FAFB] min-h-screen pt-22 md:pt-28 pb-20 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="text-center mb-16">
          <div className="flex justify-center items-center md:gap-3">
            <h1 className="text-3xl md:text-5xl font-black uppercase italic text-slate-900 tracking-tighter">
              Common <span className="text-orange-600">Inquiries</span>
            </h1>
            <div className="p-4 bg-orange-600/10 rounded-2xl text-orange-600 shadow-sm">
              <FiHelpCircle size={32} />
            </div>
          </div>
         
          <p className="text-slate-500 mt-1 text-[10px] font-bold uppercase tracking-[0.3em]">
            {mockContent.faqSubtitle}
          </p>
        </div>

        {/* --- FAQ CONTENT --- */}
        {mockContent.faqCategories.map((category, catIndex) => (
          <div key={catIndex} className="mb-12">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-200 pb-3">
              <span className="text-orange-600 text-xl">{getIcon(category.category)}</span>
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">
                {category.category}
              </h2>
            </div>

            <div className="space-y-4">
              {category.questions.map((item, qIndex) => {
                const globalIndex = catIndex * 100 + qIndex; 
                const isOpen = activeIndex === globalIndex;

                return (
                  <div 
                    key={qIndex} 
                    className={`bg-white rounded-2xl border transition-all duration-300 ${
                      isOpen ? 'border-orange-500 shadow-xl shadow-orange-500/5' : 'border-slate-100 hover:border-orange-200'
                    }`}
                  >
                    <button 
                      onClick={() => toggleAccordion(globalIndex)} 
                      className="w-full flex items-center justify-between p-5 text-left"
                    >
                      <span className={`text-xs md:text-sm font-bold uppercase tracking-tight transition-colors ${
                        isOpen ? 'text-orange-600' : 'text-slate-800'
                      }`}>
                        {item.q}
                      </span>
                      <div className={`p-1.5 rounded-lg transition-all ${
                        isOpen ? 'bg-orange-600 text-white rotate-180' : 'bg-slate-50 text-slate-400'
                      }`}>
                        {isOpen ? <FiMinus size={14} /> : <FiPlus size={14} />}
                      </div>
                    </button>
                    
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }} 
                          animate={{ height: 'auto', opacity: 1 }} 
                          exit={{ height: 0, opacity: 0 }} 
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6 pt-0 text-[12px] md:text-[13px] text-slate-500 leading-relaxed border-t border-slate-50 mx-5 mt-2 pt-5">
                            {item.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* --- SUPPORT CTA --- */}
        <div className="mt-20 p-10 bg-slate-900 rounded-[2.5rem] text-center relative overflow-hidden shadow-2xl">
          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/20 blur-3xl -mr-16 -mt-16" />
          
          <div className="relative z-10">
            <div className="flex justify-center mb-4 text-orange-500">
              <FiMessageSquare size={24} />
            </div>
            <h3 className="text-white font-black uppercase text-lg mb-2 italic tracking-tighter">
              Still have questions?
            </h3>
            <p className="text-slate-400 text-[10px] mb-8 font-bold uppercase tracking-widest">
              Our support team is active and ready to help
            </p>
            <button 
              onClick={() => window.location.href = '/chat'} 
              className="bg-orange-600 text-white px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-700 hover:scale-105 transition-all shadow-xl shadow-orange-600/20"
            >
              Open Live Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaqPageUi;