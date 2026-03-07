"use client";

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, FiMinus, FiHelpCircle, FiCalendar, 
  FiCreditCard, FiCheckCircle, FiShield, FiMessageSquare,
  FiArrowRight, FiSearch, FiX 
} from 'react-icons/fi';
import Link from 'next/link';
import { FaMessage } from 'react-icons/fa6';

const FaqPageUi = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const mockContent = {
    faqSubtitle: "Everything you need to know about our professional cleaning standards",
    faqCategories: [
      {
        category: "Booking & Scheduling",
        questions: [
          { q: "How do I book a cleaning session?", a: "You can book directly through our online portal by selecting a service, choosing an available date, and confirming your details." },
          { q: "Can I reschedule or cancel my booking?", a: "Yes, you can reschedule or cancel up to 24 hours before your appointment without any fee." },
          { q: "Do I need to be home during the cleaning?", a: "No, many of our clients provide us with a spare key or entry code. All our staff are fully vetted." }
        ]
      },
      {
        category: "Payments & Pricing",
        questions: [
          { q: "What payment methods do you accept?", a: "We accept all major credit/debit cards, bank transfers, and secure online payments. We do not accept cash." },
          { q: "Are there any hidden fees?", a: "None at all. The price you see during booking is the final price." }
        ]
      },
      {
        category: "Service Standards",
        questions: [
          { q: "What cleaning products do you use?", a: "We use high-quality, eco-friendly, and non-toxic cleaning products safe for pets and children." },
          { q: "What if I am not happy with the service?", a: "We offer a 100% Satisfaction Guarantee. Notify us within 24 hours for a free re-clean." }
        ]
      },
      {
        category: "Security & Account",
        questions: [
          { q: "How is my personal information protected?", a: "We use industry-standard SSL encryption. Your payment info is processed through secure gateways." },
          { 
            q: "How can I delete my account and personal data?", 
            a: "You can permanently delete your account and profile data through your settings. This cannot be undone.",
            link: "/delete-account",
            linkText: "Go to Deletion Page"
          }
        ]
      }
    ]
  };

  // --- Search Logic ---
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return mockContent.faqCategories;
    
    return mockContent.faqCategories.map(cat => ({
      ...cat,
      questions: cat.questions.filter(q => 
        q.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
        q.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(cat => cat.questions.length > 0);
  }, [searchQuery]);

  const getIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('book') || cat.includes('schedul')) return <FiCalendar />;
    if (cat.includes('pay') || cat.includes('pric')) return <FiCreditCard />;
    if (cat.includes('service') || cat.includes('standard')) return <FiCheckCircle />;
    return <FiShield />;
  };

  return (
    <div className="bg-[#F9FAFB] min-h-screen pt-22 md:pt-28 pb-20 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="text-center mb-3">
          <div className="flex justify-center items-center gap-3">
            <h1 className="text-3xl md:text-5xl font-black uppercase italic text-slate-900 tracking-tighter">
              Common <span className="text-orange-600">Inquiries</span>
            </h1>
          </div>
          <p className="text-slate-500 mt-2 text-[10px] font-bold uppercase tracking-[0.3em]">
            {mockContent.faqSubtitle}
          </p>
        </div>

        {/* --- SEARCH BAR --- */}
        <div className="relative max-w-2xl mx-auto mb-16">
          <div className="relative group">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-600 transition-colors" size={20} />
            <input 
              type="text"
              placeholder="Search for a question (e.g. 'delete account', 'payment')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl py-2 pl-14 pr-14 text-sm font-medium outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 transition-all shadow-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-5 top-1/2 -translate-y-1/2 p-1 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
              >
                <FiX size={14} className="text-slate-500" />
              </button>
            )}
          </div>
        </div>

        {/* --- FAQ CONTENT --- */}
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category, catIndex) => (
            <motion.div layout key={category.category} className="mb-12">
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
                    <div key={qIndex} className={`bg-white rounded-2xl border transition-all duration-300 ${isOpen ? 'border-orange-500 shadow-xl shadow-orange-500/5' : 'border-slate-100'}`}>
                      <button onClick={() => setActiveIndex(isOpen ? null : globalIndex)} className="w-full flex items-center justify-between p-5 text-left">
                        <span className={`text-xs md:text-sm font-bold uppercase tracking-tight ${isOpen ? 'text-orange-600' : 'text-slate-800'}`}>
                          {item.q}
                        </span>
                        <div className={`p-1.5 rounded-lg ${isOpen ? 'bg-orange-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                          {isOpen ? <FiMinus size={14} /> : <FiPlus size={14} />}
                        </div>
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="px-6 pb-6 pt-5 text-[12px] md:text-[13px] text-slate-500 leading-relaxed border-t border-slate-50 mx-5">
                              {item.a}
                              {item.link && (
                                <div className="mt-4">
                                  <Link href={item.link} className="inline-flex items-center gap-2 text-orange-600 font-black uppercase text-[10px] tracking-widest hover:underline">
                                    {item.linkText} <FiArrowRight />
                                  </Link>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))
        ) : (
          /* Empty State */
          <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
            <FiHelpCircle className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-900 font-black uppercase text-sm tracking-tighter">No results for "{searchQuery}"</p>
            <button onClick={() => setSearchQuery("")} className="text-orange-600 text-[10px] font-bold uppercase mt-2 hover:underline">Clear Search</button>
          </div>
        )}

        {/* --- SUPPORT CTA --- */}
        <div className="mt-20 p-10 bg-slate-900 rounded-[2.5rem] text-center relative overflow-hidden shadow-2xl">
          <div className="flex flex-col items-center relative z-10">
            <FiMessageSquare size={24} className='mb-1 text-orange-500 font-black'/>
            <h3 className="text-white font-black uppercase text-lg mb-2 italic tracking-tighter">Still have questions?</h3>
            <p className="text-slate-400 text-[10px] mb-8 font-bold uppercase tracking-widest">
              Our support team is active and ready to help
            </p>
            <button onClick={() => window.location.href = '/chat'} className="bg-orange-600 text-white px-10 py-4 rounded-xl text-[10px] font-black uppercase mt-6 transition-all hover:scale-105">
              Open Live Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaqPageUi;