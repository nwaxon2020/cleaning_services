"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, } from 'firebase/firestore';
import { 
  FiShield, FiEye, FiLock, FiRefreshCw, 
  FiCheckCircle, FiChevronRight, 
  FiClock, FiCalendar, FiChevronLeft, FiZap, FiTrash2,
  FiHome, FiInfo, FiHeart, FiPackage
} from 'react-icons/fi';

// Define types for the policy data
interface PolicyData {
  title: string;
  subtitle: string;
  effectiveDate: string;
  footerEmail: string;
  footerAddress: string;
  footerNote: string;
}

interface SectionsData {
  collectionIntro: string;
  collectionItems: string[];
  usagePoints: string[];
  usageRecurringNote: string;
  refundGuarantee: string;
  refundEligibilityPoints: string[];
  refundClaimNote: string;
  refundTimelinePoints: string[];
  securityIntro: string;
  securityPoints: string[];
  securityCompliance: string;
  deletionIntro: string;
  deletionIncludes: string[];
  deletionInstruction: string;
  deletionNote: string;
  cleaningPolicyPoints: string[];
  decorationPolicyPoints: string[];
  healthPolicyPoints: string[];
  rentalPolicyPoints: string[];
}

const PrivacyPageUi = () => {
  const [activeSection, setActiveSection] = useState('collection');
  const [currentImg, setCurrentImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ===== STATE FOR FIREBASE DATA =====
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [policyData, setPolicyData] = useState<PolicyData>({
    title: 'Privacy & Service Policy',
    subtitle: 'Ensuring trust and transparency across every service',
    effectiveDate: 'March 11, 2026',
    footerEmail: 'privacy@isundunrin.co.uk',
    footerAddress: 'Data Protection Officer, Isundunrin Services, Bristol, UK',
    footerNote: 'Last updated: March 11, 2026. We may update this policy periodically. Continued use of our services constitutes acceptance of any changes.'
  });

  const [sectionsData, setSectionsData] = useState<SectionsData>({
    // Section 01
    collectionIntro: 'To provide the highest standard of cleaning, decoration, health services, and event rentals, we collect specific details necessary for logistics, safety, and service delivery. This information is never sold to third parties.',
    collectionItems: [
      'Property Access Details - Keys, codes, or access instructions for cleaning and decoration services',
      'Service Requirements - Specific needs for each service type (cleaning preferences, decoration specifications, health consultation details, rental quantities)',
      'Contact Information - Name, phone, email, and address for all service communications',
      'Payment Identifiers - Secure payment processing through encrypted gateways',
      'Health Information - Relevant medical history when booking health services (with explicit consent)',
      'Event Details - Dates, guest counts, and setup requirements for rental services',
      'Feedback & Reviews - Your opinions help us improve all our services',
      'Site Usage Data - Analytics to enhance your browsing experience'
    ],
    
    // Section 02
    usagePoints: [
      'Scheduling professional cleaners, decorators, health practitioners, and delivery personnel',
      'Processing secure payments across all services',
      'Communicating service updates, appointment reminders, and follow-ups',
      'Customizing your service experience based on preferences and history',
      'Improving our service offerings through anonymized analytics'
    ],
    usageRecurringNote: 'For recurring clients, sensitive information (like key-holding details or health records) is stored in an encrypted vault accessible only by authorized management personnel.',
    
    // Section 03
    refundGuarantee: '100% Satisfaction Guarantee',
    refundEligibilityPoints: [
      'A scheduled service is missed by our team without notification',
      'The service does not meet our quality standards (cleaning, decoration work, health consultations, or rental item condition)',
      'Items rented arrive damaged or not as described'
    ],
    refundClaimNote: 'Claims must be filed within 24 hours of service completion through your account dashboard or by contacting support.',
    refundTimelinePoints: [
      'Approved refunds are processed to the original payment method within 3-5 business days',
      'For cancellations made with less than 24 hours\' notice, a 20% administrative fee may apply',
      'For rental cancellations, deposits are fully refundable up to 7 days before the event',
      'Decoration project deposits are partially refundable based on materials already purchased'
    ],
    
    // Section 04
    securityIntro: 'We employ industry-standard SSL encryption for all transactions across our platform. Our staff across all service divisions are:',
    securityPoints: [
      'Fully DBS checked and vetted',
      'Trained in data protection protocols',
      'Sign strict non-disclosure agreements regarding the privacy of your home, office, health information, or event details'
    ],
    securityCompliance: 'All sensitive data is stored in compliance with UK data protection regulations (GDPR).',
    
    // Section 05
    deletionIntro: 'We respect your \'Right to be Forgotten\' under UK data protection law. Users may request the complete removal of their personal data, including:',
    deletionIncludes: [
      'Booking history across all services',
      'Review logs and feedback',
      'Profile identifiers and contact details',
      'Stored access instructions',
      'Health records (with consent withdrawal)'
    ],
    deletionInstruction: 'The direct link to manage and delete your personal data is located in your account settings under "Privacy & Data". Note: You must be signed in with email & password to proceed with deletion. Account deletion is permanent and cannot be undone.',
    deletionNote: 'Deletion requests are processed within 30 days.',
    
    // Section 06
    cleaningPolicyPoints: [
      'We reserve the right to refuse service if the property poses health or safety risks',
      'Valuable items should be secured before our team arrives',
      'Damage caused by our team is covered by our insurance'
    ],
    decorationPolicyPoints: [
      'Quotes are valid for 30 days',
      'Material costs may fluctuate based on availability',
      'Final payment is due upon completion and your satisfaction'
    ],
    healthPolicyPoints: [
      'All consultations are confidential',
      'Cancel health appointments at least 24 hours in advance',
      'Emergency contact information must be provided'
    ],
    rentalPolicyPoints: [
      'Security deposits required for all rentals',
      'Items must be returned in clean condition',
      'Late returns incur daily fees'
    ]
  });

  // ===== FETCH DATA FROM FIREBASE IN REAL-TIME =====
  useEffect(() => {
    // Fetch hero images
    const imagesQuery = query(collection(db, "policy_hero_images"), orderBy("order", "asc"));
    const unsubImages = onSnapshot(imagesQuery, (snapshot) => {
      const images = snapshot.docs.map(doc => doc.data().url);
      setHeroImages(images);
      setLoading(false);
    });

    // Fetch policy settings
    const unsubSettings = onSnapshot(doc(db, "settings", "policy"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPolicyData(prev => ({
          ...prev,
          title: data.title || prev.title,
          subtitle: data.subtitle || prev.subtitle,
          effectiveDate: data.effectiveDate || prev.effectiveDate,
          footerEmail: data.footerEmail || prev.footerEmail,
          footerAddress: data.footerAddress || prev.footerAddress,
          footerNote: data.footerNote || prev.footerNote
        }));
      }
    });

    // Fetch policy sections
    const unsubSections = onSnapshot(doc(db, "settings", "policy_sections"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSectionsData(prev => ({
          ...prev,
          // Section 01
          collectionIntro: data.collectionIntro || prev.collectionIntro,
          collectionItems: data.collectionItems || prev.collectionItems,
          
          // Section 02
          usagePoints: data.usagePoints || prev.usagePoints,
          usageRecurringNote: data.usageRecurringNote || prev.usageRecurringNote,
          
          // Section 03
          refundGuarantee: data.refundGuarantee || prev.refundGuarantee,
          refundEligibilityPoints: data.refundEligibilityPoints || prev.refundEligibilityPoints,
          refundClaimNote: data.refundClaimNote || prev.refundClaimNote,
          refundTimelinePoints: data.refundTimelinePoints || prev.refundTimelinePoints,
          
          // Section 04
          securityIntro: data.securityIntro || prev.securityIntro,
          securityPoints: data.securityPoints || prev.securityPoints,
          securityCompliance: data.securityCompliance || prev.securityCompliance,
          
          // Section 05
          deletionIntro: data.deletionIntro || prev.deletionIntro,
          deletionIncludes: data.deletionIncludes || prev.deletionIncludes,
          deletionInstruction: data.deletionInstruction || prev.deletionInstruction,
          deletionNote: data.deletionNote || prev.deletionNote,
          
          // Section 06
          cleaningPolicyPoints: data.cleaningPolicyPoints || prev.cleaningPolicyPoints,
          decorationPolicyPoints: data.decorationPolicyPoints || prev.decorationPolicyPoints,
          healthPolicyPoints: data.healthPolicyPoints || prev.healthPolicyPoints,
          rentalPolicyPoints: data.rentalPolicyPoints || prev.rentalPolicyPoints
        }));
      }
    });

    return () => {
      unsubImages();
      unsubSettings();
      unsubSections();
    };
  }, []);

  // ===== IMAGE SLIDER EFFECT =====
  useEffect(() => {
    if (heroImages.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentImg((prev) => (prev + 1) % heroImages.length);
    }, 25000);
    
    return () => clearInterval(timer);
  }, [heroImages.length]);

  // Use hero images from Firebase, fallback to empty array
  const displayImages = heroImages.length > 0 ? heroImages : [];

  const sections = [
    { id: 'collection', title: 'Data Collection', icon: <FiEye /> },
    { id: 'usage', title: 'Usage Policy', icon: <FiShield /> },
    { id: 'payback', title: 'Refunds & Guarantees', icon: <FiRefreshCw /> },
    { id: 'security', title: 'Security Standards', icon: <FiLock /> },
    { id: 'deletion', title: 'Data Rights & Erasure', icon: <FiTrash2 /> },
    { id: 'serviceSpecific', title: 'Service Policies', icon: <FiPackage /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] relative">
      
      {/* --- HERO HEADER --- */}
      <section className="relative h-[25vh] md:h-[30vh] flex items-center justify-center overflow-hidden z-[100] bg-black">
        <div className="absolute inset-0 bg-black z-[5]" />

        <AnimatePresence mode="wait">
          {displayImages.length > 0 ? (
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
                src={displayImages[currentImg]} 
                className="w-full h-full object-cover" 
                alt="Legal" 
              />
            </motion.div>
          ) : (
            <div className="absolute inset-0 z-[10] bg-gradient-to-r from-slate-900 to-slate-800" />
          )}
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
              {policyData.title.split(' ')[0]} <span className="text-orange-500">{policyData.title.split(' ').slice(1).join(' ')}</span>
            </h1>
            <div className="flex flex-col md:flex-row items-center justify-center gap-3">
               <p className="text-white/60 text-[9px] font-bold uppercase tracking-[0.3em]">
                {policyData.subtitle}
              </p>
              <div className="hidden md:block w-1 h-1 bg-white/30 rounded-full" />
              <div className="inline-flex items-center gap-2 text-orange-500">
                <FiCalendar className="text-[10px]" />
                <span className="text-[9px] font-black uppercase tracking-widest">Effective: {policyData.effectiveDate}</span>
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
              <p className="text-slate-500 text-sm leading-relaxed mb-8">{sectionsData.collectionIntro}</p>
              <div className="grid grid-cols-1 gap-4">
                {sectionsData.collectionItems?.map((item: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-orange-200 transition-colors">
                    <FiCheckCircle className="text-orange-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-slate-700">{item}</span>
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
              <div className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-6 rounded-2xl border-l-4 border-orange-500 shadow-sm">
                <ul className="space-y-2">
                  {sectionsData.usagePoints?.map((point: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-orange-500 font-bold">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                {sectionsData.usageRecurringNote && (
                  <p className="mt-4 pt-4 border-t border-slate-200 text-slate-500">
                    {sectionsData.usageRecurringNote}
                  </p>
                )}
              </div>
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
                    <h4 className="font-black text-[11px] uppercase tracking-widest text-orange-500 mb-2">{sectionsData.refundGuarantee}</h4>
                    <ul className="text-slate-300 text-sm leading-relaxed space-y-2">
                      {sectionsData.refundEligibilityPoints?.map((point: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-orange-500">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                    {sectionsData.refundClaimNote && (
                      <p className="mt-3 text-slate-400 text-sm">{sectionsData.refundClaimNote}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-5">
                  <FiClock className="text-orange-500 mt-1 shrink-0" size={24} />
                  <div>
                    <h4 className="font-black text-[11px] uppercase tracking-widest text-orange-500 mb-2">Processing Time</h4>
                    <ul className="text-slate-300 text-sm leading-relaxed space-y-2">
                      {sectionsData.refundTimelinePoints?.map((point: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-orange-500">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
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
              <div className="p-8 bg-orange-600/5 border border-orange-500/20 rounded-3xl">
                <p className="text-slate-900 text-sm leading-relaxed mb-4">{sectionsData.securityIntro}</p>
                <ul className="space-y-2 mb-4">
                  {sectionsData.securityPoints?.map((point: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-orange-500 font-bold">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-slate-600 italic">{sectionsData.securityCompliance}</p>
              </div>
            </section>

            {/* 05. Deletion & Data Rights */}
            <section id="deletion" className="scroll-mt-32">
              <div className="flex items-center gap-4 mb-8 text-red-600">
                <div className="p-4 bg-red-50 rounded-2xl"><FiTrash2 size={24}/></div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">05. Data Rights & Deletion</h2>
              </div>
              <div className="space-y-6">
                <p className="text-slate-600 text-sm leading-relaxed">{sectionsData.deletionIntro}</p>
                <ul className="space-y-2">
                  {sectionsData.deletionIncludes?.map((item: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                      <FiCheckCircle className="text-red-500 mt-1 shrink-0" size={14} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="p-6 bg-zinc-900 rounded-3xl border border-white/10 text-center">
                  <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-4">
                    Looking to remove your account?
                  </p>
                  <p className="text-white text-xs font-bold leading-relaxed mb-4">
                    {sectionsData.deletionInstruction}
                  </p>
                  {sectionsData.deletionNote && (
                    <p className="text-zinc-400 text-xs">{sectionsData.deletionNote}</p>
                  )}
                </div>
              </div>
            </section>

            {/* 06. Service-Specific Policies */}
            <section id="serviceSpecific" className="scroll-mt-32">
              <div className="flex items-center gap-4 mb-8 text-purple-600">
                <div className="p-4 bg-purple-50 rounded-2xl"><FiPackage size={24}/></div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">06. Service-Specific Policies</h2>
              </div>
              
              <div className="grid gap-6">
                {/* Cleaning Services */}
                {sectionsData.cleaningPolicyPoints?.length > 0 && (
                  <div className="border-l-4 border-blue-400 pl-4 py-2">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><FiHome className="text-blue-600" /> Cleaning Services</h3>
                    <ul className="space-y-2">
                      {sectionsData.cleaningPolicyPoints.map((item: string, index: number) => (
                        <li key={index} className="flex items-start gap-3 text-sm text-slate-600">
                          <FiCheckCircle className="text-blue-500 mt-1 shrink-0" size={14} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Decoration Services */}
                {sectionsData.decorationPolicyPoints?.length > 0 && (
                  <div className="border-l-4 border-purple-400 pl-4 py-2">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><FiInfo className="text-purple-600" /> Decoration Services</h3>
                    <ul className="space-y-2">
                      {sectionsData.decorationPolicyPoints.map((item: string, index: number) => (
                        <li key={index} className="flex items-start gap-3 text-sm text-slate-600">
                          <FiCheckCircle className="text-purple-500 mt-1 shrink-0" size={14} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Health Services */}
                {sectionsData.healthPolicyPoints?.length > 0 && (
                  <div className="border-l-4 border-green-400 pl-4 py-2">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><FiHeart className="text-green-600" /> Health Services</h3>
                    <ul className="space-y-2">
                      {sectionsData.healthPolicyPoints.map((item: string, index: number) => (
                        <li key={index} className="flex items-start gap-3 text-sm text-slate-600">
                          <FiCheckCircle className="text-green-500 mt-1 shrink-0" size={14} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Renting Services */}
                {sectionsData.rentalPolicyPoints?.length > 0 && (
                  <div className="border-l-4 border-orange-400 pl-4 py-2">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><FiPackage className="text-orange-600" /> Renting Services</h3>
                    <ul className="space-y-2">
                      {sectionsData.rentalPolicyPoints.map((item: string, index: number) => (
                        <li key={index} className="flex items-start gap-3 text-sm text-slate-600">
                          <FiCheckCircle className="text-orange-500 mt-1 shrink-0" size={14} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-sm text-slate-600">
                  <span className="font-bold">For questions about your data or our policies, contact:</span><br />
                  {policyData.footerEmail} | {policyData.footerAddress}
                </p>
                <p className="text-xs text-slate-400 mt-4">
                  {policyData.footerNote}
                </p>
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