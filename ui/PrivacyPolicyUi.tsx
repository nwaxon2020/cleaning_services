"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  FiShield, FiEye, FiLock, FiRefreshCw, 
  FiCheckCircle, FiChevronRight, 
  FiInfo, FiClock, FiCalendar, FiChevronLeft, FiZap, FiTrash2 
} from 'react-icons/fi';

const HERO_IMAGES = [
  "https://thecleaningladies.ca/media/images/action-shot3.jpg?width=768&height=550&loading=eager",
  "https://maidinparadiseflorida.com/wp-content/uploads/2024/02/cheerful-black-lady-holding-bucket-of-cleaning-sup-2023-11-27-05-24-08-utc1.png",
  "https://static.vecteezy.com/system/resources/thumbnails/069/923/000/small/professional-african-american-man-cleaning-office-desk-with-cloth-and-cleaning-supplies-photo.jpeg",
  "https://img.freepik.com/free-photo/professional-cleaning-service-person-using-vacuum-cleaner-office_23-2150520631.jpg",
];

const PrivacyPageUi = () => {
  const [activeSection, setActiveSection] = useState('collection');
  const [currentImg, setCurrentImg] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImg((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 25000);
    setLastUpdated(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
    return () => clearInterval(timer);
  }, []);

  const legal = {
    policyTitle: "Privacy & Service Policy",
    policySubtitle: "Ensuring trust and transparency in every clean",
    policySections: {
      collection: {
        intro: "To provide the highest standard of cleaning, we collect specific details necessary for logistics and security. This information is never sold to third parties.",
        checklist: ["Property Access Details", "Service Requirements", "Contact Information", "Payment Identifiers", "Feedback & Reviews", "Site Usage Data"]
      },
      usage: {
        content: "Your data is used strictly for scheduling professional cleaners, processing secure payments, and communicating service updates. For recurring clients, key-holding information is stored in an encrypted vault accessible only by management."
      },
      payback: {
        eligibility: "Refunds are eligible if a scheduled clean is missed by our team or if the service does not meet our 100% Satisfaction Guarantee. Claims must be filed within 24 hours of service.",
        timeline: "Approved refunds are processed to the original payment method within 3-5 business days. For cancellations made by the client with less than 24 hours' notice, a 20% administrative fee may apply."
      },
      security: {
        content: "We employ industry-standard SSL encryption for all transactions. Our staff are fully vetted and sign strict non-disclosure agreements regarding the privacy of your home or office."
      },
      deletion: {
        content: "We respect your 'Right to be Forgotten'. Users may request the complete removal of their personal data, including booking history, review logs, and profile identifiers, at any time through our automated portal."
      }
    }
  };

  const sections = [
    { id: 'collection', title: 'Data Collection', icon: <FiEye /> },
    { id: 'usage', title: 'Usage Policy', icon: <FiShield /> },
    { id: 'payback', title: 'Refunds & Guarantees', icon: <FiRefreshCw /> },
    { id: 'security', title: 'Security Standards', icon: <FiLock /> },
    { id: 'deletion', title: 'Data Rights & Erasure', icon: <FiTrash2 /> },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] relative">
      
      {/* --- HERO HEADER --- */}
      <section className="relative h-[25vh] md:h-[30vh] flex items-center justify-center overflow-hidden z-[100] bg-black">
        <div className="absolute inset-0 bg-black z-[5]" />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentImg}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0 z-[10]"
          >
            <div className="absolute inset-0 bg-black/70 z-20" />
            <img 
              src={HERO_IMAGES[currentImg]} 
              className="w-full h-full object-cover" 
              alt="Legal" 
            />
          </motion.div>
        </AnimatePresence>

        <div className="relative z-[30] text-center px-6">
          <button 
            onClick={() => router.back()}
            className="my-4 inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95"
          >
            <FiChevronLeft /> Return Back
          </button>
          
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-5xl font-black uppercase italic text-white tracking-tighter leading-none mb-3">
              {legal.policyTitle.split(' ')[0]} <span className="text-orange-500">{legal.policyTitle.split(' ').slice(1).join(' ')}</span>
            </h1>
            <div className="flex flex-col md:flex-row items-center justify-center gap-3">
               <p className="text-white/60 text-[9px] font-bold uppercase tracking-[0.3em]">
                {legal.policySubtitle}
              </p>
              <div className="hidden md:block w-1 h-1 bg-white/30 rounded-full" />
              <div className="inline-flex items-center gap-2 text-orange-500">
                <FiCalendar className="text-[10px]" />
                <span className="text-[9px] font-black uppercase tracking-widest">Effective: {lastUpdated}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- MAIN BODY --- */}
      <div className="max-w-6xl mx-auto py-12 md:py-16 md:px-6 relative z-[20]">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          <div className="hidden lg:block sticky top-32 space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  const element = document.getElementById(section.id);
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${
                  activeSection === section.id 
                  ? 'bg-slate-900 text-white shadow-xl shadow-orange-600/10 scale-[1.02]' 
                  : 'bg-white text-slate-400 hover:bg-slate-50 border border-slate-100'
                }`}
              >
                <span className="flex items-center gap-3">{section.icon} {section.title}</span>
                <FiChevronRight className={activeSection === section.id ? 'text-orange-500' : ''} />
              </button>
            ))}
          </div>

          <div className="lg:col-span-3 space-y-12 bg-white p-6 md:p-16 md:rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-50">
            
            {/* 01. Collection */}
            <section id="collection" className="scroll-mt-32">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl"><FiEye size={24}/></div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">01. Data Collection</h2>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">{legal.policySections.collection.intro}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {legal.policySections.collection.checklist.map((item) => (
                  <div key={item} className="flex items-center gap-3 p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-orange-200 transition-colors">
                    <FiCheckCircle className="text-orange-500" />
                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 02. Usage */}
            <section id="usage" className="scroll-mt-32">
              <div className="flex items-center gap-4 mb-8 text-orange-600">
                <div className="p-4 bg-orange-50 rounded-2xl"><FiShield size={24}/></div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">02. Usage Policy</h2>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-6 rounded-2xl border-l-4 border-orange-500 shadow-sm">
                {legal.policySections.usage.content}
              </p>
            </section>

            {/* 03. Payback */}
            <section id="payback" className="scroll-mt-32 p-8 md:p-12 bg-slate-900 md:rounded-[2.5rem] text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/20 blur-3xl -mr-16 -mt-16" />
              <div className="flex items-center gap-4 mb-10">
                <div className="p-4 bg-white/10 text-orange-500 rounded-2xl"><FiRefreshCw size={24}/></div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">03. Satisfaction & Refunds</h2>
              </div>
              <div className="grid gap-8">
                <div className="flex items-start gap-5">
                  <FiCheckCircle className="text-orange-500 mt-1 shrink-0" size={24} />
                  <div>
                    <h4 className="font-black text-[11px] uppercase tracking-widest text-orange-500 mb-2">100% Guarantee</h4>
                    <p className="text-slate-300 text-sm leading-relaxed">{legal.policySections.payback.eligibility}</p>
                  </div>
                </div>
                <div className="flex items-start gap-5">
                  <FiClock className="text-orange-500 mt-1 shrink-0" size={24} />
                  <div>
                    <h4 className="font-black text-[11px] uppercase tracking-widest text-orange-500 mb-2">Processing Time</h4>
                    <p className="text-slate-300 text-sm leading-relaxed">{legal.policySections.payback.timeline}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 04. Security */}
            <section id="security" className="scroll-mt-32">
              <div className="flex items-center gap-4 mb-8 text-orange-600">
                <div className="p-4 bg-orange-50 rounded-2xl"><FiLock size={24}/></div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">04. Security Standards</h2>
              </div>
              <div className="p-8 bg-orange-600/5 border border-orange-500/20 rounded-3xl flex items-start gap-5">
                <FiInfo className="text-orange-600 mt-1 shrink-0" size={24} />
                <p className="text-slate-900 text-xs font-black leading-relaxed uppercase tracking-tight">
                  {legal.policySections.security.content}
                </p>
              </div>
            </section>

            {/* 05. Deletion & Data Rights */}
            <section id="deletion" className="scroll-mt-32">
              <div className="flex items-center gap-4 mb-8 text-red-600">
                <div className="p-4 bg-red-50 rounded-2xl"><FiTrash2 size={24}/></div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">05. Data Rights & Deletion</h2>
              </div>
              <div className="space-y-6">
                <p className="text-slate-600 text-sm leading-relaxed">
                  {legal.policySections.deletion.content}
                </p>
                <div className="p-6 bg-zinc-900 rounded-3xl border border-white/10 text-center">
                  <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-4">
                    Looking to remove your account?
                  </p>
                  <p className="text-white text-xs font-bold leading-relaxed mb-4">
                    The direct link to manage and delete your personal data is located at the <span className="text-orange-500">footer of this website</span> under the "Active Section". Note you must be signed in with email & password to proceed
                  </p>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>

      <section className="py-24 px-6 bg-white relative z-[20]">
        <div className="max-w-5xl mx-auto bg-[#050505] rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/20 blur-[120px] -mr-48 -mt-48" />
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 uppercase tracking-tighter relative z-10">
              Ready for a <span className="text-orange-500 italic">Fresh</span> Start?
            </h2>
            <button 
              onClick={() => router.push('/services')}
              className="px-10 py-4 bg-orange-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-orange-700 transition-all shadow-xl shadow-orange-600/40 relative z-10 flex items-center gap-2 mx-auto"
            >
              Book Now <FiZap />
            </button>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPageUi;