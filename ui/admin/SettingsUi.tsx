"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FaSave, FaPlus, FaTrash, FaChevronDown, FaInfoCircle, FaPhone, FaQuestionCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function AdminSettingsUi() {
  const [activeSection, setActiveSection] = useState<string | null>('general');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    siteName: 'BostonClean',
    contact: { email: '', phone: '', address: '' },
    aboutContent: '',
    faqs: [{ question: '', answer: '' }]
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const docSnap = await getDoc(doc(db, 'settings', 'siteConfig'));
      if (docSnap.exists()) setSettings(docSnap.data() as any);
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      await setDoc(doc(db, 'settings', 'siteConfig'), settings);
      toast.success('All changes saved to database');
    } catch (e) {
      toast.error('Failed to save settings');
    }
  };

  const addFaq = () => setSettings({...settings, faqs: [...settings.faqs, {question: '', answer: ''}]});
  const removeFaq = (index: number) => {
    const newFaqs = settings.faqs.filter((_, i) => i !== index);
    setSettings({...settings, faqs: newFaqs});
  };

  if (loading) return <div className="text-orange-500 font-bold p-10">Loading Editor...</div>;

  const Accordion = ({ id, title, icon: Icon, children }: any) => (
    <div className="border border-white/5 bg-zinc-900/50 rounded-2xl overflow-hidden mb-4">
      <button 
        onClick={() => setActiveSection(activeSection === id ? null : id)}
        className="w-full flex items-center justify-between p-5 text-white hover:bg-white/5 transition-all"
      >
        <div className="flex items-center gap-3">
          <Icon className="text-orange-500" />
          <span className="font-bold uppercase tracking-widest text-xs">{title}</span>
        </div>
        <FaChevronDown className={`transition-transform ${activeSection === id ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {activeSection === id && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="p-6 border-t border-white/5 bg-black/20 space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Site Editor</h1>
        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all">
          <FaSave /> Save Changes
        </button>
      </div>

      <Accordion id="general" title="General & About Us" icon={FaInfoCircle}>
        <div>
          <label className="text-zinc-500 text-[10px] uppercase font-black mb-2 block">Site Name</label>
          <input value={settings.siteName} onChange={(e) => setSettings({...settings, siteName: e.target.value})} className="w-full bg-zinc-800 border-none rounded-xl p-4 text-white text-sm focus:ring-1 ring-orange-500" />
        </div>
        <div>
          <label className="text-zinc-500 text-[10px] uppercase font-black mb-2 block">About Page Content</label>
          <textarea rows={6} value={settings.aboutContent} onChange={(e) => setSettings({...settings, aboutContent: e.target.value})} className="w-full bg-zinc-800 border-none rounded-xl p-4 text-white text-sm focus:ring-1 ring-orange-500" />
        </div>
      </Accordion>

      <Accordion id="contact" title="Contact Information" icon={FaPhone}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-zinc-500 text-[10px] uppercase font-black mb-2 block">Public Email</label>
            <input value={settings.contact.email} onChange={(e) => setSettings({...settings, contact: {...settings.contact, email: e.target.value}})} className="w-full bg-zinc-800 border-none rounded-xl p-4 text-white text-sm" />
          </div>
          <div>
            <label className="text-zinc-500 text-[10px] uppercase font-black mb-2 block">Phone Number</label>
            <input value={settings.contact.phone} onChange={(e) => setSettings({...settings, contact: {...settings.contact, phone: e.target.value}})} className="w-full bg-zinc-800 border-none rounded-xl p-4 text-white text-sm" />
          </div>
        </div>
        <div>
          <label className="text-zinc-500 text-[10px] uppercase font-black mb-2 block">Office Address</label>
          <input value={settings.contact.address} onChange={(e) => setSettings({...settings, contact: {...settings.contact, address: e.target.value}})} className="w-full bg-zinc-800 border-none rounded-xl p-4 text-white text-sm" />
        </div>
      </Accordion>

      <Accordion id="faqs" title="Frequently Asked Questions" icon={FaQuestionCircle}>
        {settings.faqs.map((faq, index) => (
          <div key={index} className="p-4 bg-white/5 rounded-xl space-y-3 relative">
            <button onClick={() => removeFaq(index)} className="absolute top-4 right-4 text-zinc-600 hover:text-red-500"><FaTrash size={12}/></button>
            <input placeholder="Question" value={faq.question} onChange={(e) => {
              const newFaqs = [...settings.faqs];
              newFaqs[index].question = e.target.value;
              setSettings({...settings, faqs: newFaqs});
            }} className="w-full bg-transparent border-b border-white/10 p-2 text-white font-bold" />
            <textarea placeholder="Answer" value={faq.answer} onChange={(e) => {
              const newFaqs = [...settings.faqs];
              newFaqs[index].answer = e.target.value;
              setSettings({...settings, faqs: newFaqs});
            }} className="w-full bg-transparent p-2 text-zinc-400 text-sm" />
          </div>
        ))}
        <button onClick={addFaq} className="w-full py-3 border-2 border-dashed border-white/10 rounded-xl text-zinc-500 hover:text-white hover:border-orange-500 transition-all flex items-center justify-center gap-2">
          <FaPlus /> Add New FAQ
        </button>
      </Accordion>
    </div>
  );
}