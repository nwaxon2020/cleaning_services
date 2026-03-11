"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { 
  FaSave, FaPhone, FaUserTie, FaSpinner, FaGlobe, 
  FaExclamationTriangle, FaFacebook, FaInstagram, FaTwitter, FaLinkedin 
} from 'react-icons/fa'; // Added missing icon imports
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import SlideshowEditor from '@/components/settings/SlideShow';
import SiteSettingsEditor from '@/components/settings/SiteSettings';

export default function ContactEditorUi() {
  // General Contact
  const [generalPhone, setGeneralPhone] = useState('');
  const [generalEmail, setGeneralEmail] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [officeCity, setOfficeCity] = useState('');
  const [officePostcode, setOfficePostcode] = useState('');
  const [mapEmbedUrl, setMapEmbedUrl] = useState('');

  // CEO Contact
  const [ceoName, setCeoName] = useState('');
  const [ceoPhone, setCeoPhone] = useState('');
  const [ceoEmail, setCeoEmail] = useState('');
  const [ceoLinkedin, setCeoLinkedin] = useState('');
  const [ceoTwitter, setCeoTwitter] = useState('');

  // Social Media
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [linkedin, setLinkedin] = useState('');

  // System States
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  useEffect(() => {
    const loadContactInfo = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "settings", "contact_info");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const fetched = {
            generalPhone: data.generalPhone || '',
            generalEmail: data.generalEmail || '',
            officeAddress: data.officeAddress || '',
            officeCity: data.officeCity || '',
            officePostcode: data.officePostcode || '',
            mapEmbedUrl: data.mapEmbedUrl || '',
            ceoName: data.ceoName || '',
            ceoPhone: data.ceoPhone || '',
            ceoEmail: data.ceoEmail || '',
            ceoLinkedin: data.ceoLinkedin || '',
            ceoTwitter: data.ceoTwitter || '',
            facebook: data.facebook || '',
            instagram: data.instagram || '',
            twitter: data.twitter || '',
            linkedin: data.linkedin || '',
          };
          
          setInitialData(fetched);
          setGeneralPhone(fetched.generalPhone);
          setGeneralEmail(fetched.generalEmail);
          setOfficeAddress(fetched.officeAddress);
          setOfficeCity(fetched.officeCity);
          setOfficePostcode(fetched.officePostcode);
          setMapEmbedUrl(fetched.mapEmbedUrl);
          setCeoName(fetched.ceoName);
          setCeoPhone(fetched.ceoPhone);
          setCeoEmail(fetched.ceoEmail);
          setCeoLinkedin(fetched.ceoLinkedin);
          setCeoTwitter(fetched.ceoTwitter);
          setFacebook(fetched.facebook);
          setInstagram(fetched.instagram);
          setTwitter(fetched.twitter);
          setLinkedin(fetched.linkedin);
        }
      } catch (e) {
        toast.error("Failed to load contact info");
      } finally {
        setLoading(false);
      }
    };

    loadContactInfo();
  }, []);

  // Dirty State Check
  const isDirty = initialData && (
    generalPhone !== initialData.generalPhone ||
    generalEmail !== initialData.generalEmail ||
    officeAddress !== initialData.officeAddress ||
    officeCity !== initialData.officeCity ||
    officePostcode !== initialData.officePostcode ||
    mapEmbedUrl !== initialData.mapEmbedUrl ||
    ceoName !== initialData.ceoName ||
    ceoPhone !== initialData.ceoPhone ||
    ceoEmail !== initialData.ceoEmail ||
    ceoLinkedin !== initialData.ceoLinkedin ||
    ceoTwitter !== initialData.ceoTwitter ||
    facebook !== initialData.facebook ||
    instagram !== initialData.instagram ||
    twitter !== initialData.twitter ||
    linkedin !== initialData.linkedin
  );

  const saveContactInfo = async () => {
    setSaving(true);
    try {
      const updated = {
        generalPhone, generalEmail, officeAddress, officeCity, officePostcode, mapEmbedUrl,
        ceoName, ceoPhone, ceoEmail, ceoLinkedin, ceoTwitter,
        facebook, instagram, twitter, linkedin,
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, "settings", "contact_info"), updated);
      setInitialData(updated);
      toast.success("Contact information saved!");
    } catch (e) {
      toast.error("Failed to save contact info");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-8 pb-32">
      <div><SiteSettingsEditor /></div>
      <div><SlideshowEditor /></div>

      <div className="max-w-4xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
            Contact <span className="text-orange-600">Information</span>
          </h1>
          <p className="text-slate-500 text-sm mt-2">Manage all contact details displayed across the website</p>
        </header>

        <div className="space-y-8">
          <section className="bg-white border border-slate-200 md:rounded-xl shadow-sm md:p-6 p-4">
            <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
              <FaPhone className="text-orange-600" /> General Contact
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                <input value={generalPhone} onChange={(e) => setGeneralPhone(e.target.value)} placeholder="+44 1234 567890" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                <input value={generalEmail} onChange={(e) => setGeneralEmail(e.target.value)} placeholder="info@company.co.uk" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Street Address</label>
                <input value={officeAddress} onChange={(e) => setOfficeAddress(e.target.value)} placeholder="123 High Street" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">City</label>
                <input value={officeCity} onChange={(e) => setOfficeCity(e.target.value)} placeholder="Bristol" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Postcode</label>
                <input value={officePostcode} onChange={(e) => setOfficePostcode(e.target.value)} placeholder="PE21 7LX" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Google Maps Embed URL</label>
                <input value={mapEmbedUrl} onChange={(e) => setMapEmbedUrl(e.target.value)} placeholder="URL..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
              </div>
            </div>
          </section>

          <section className="bg-white border border-slate-200 md:rounded-xl shadow-sm md:p-6 p-4">
            <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
              <FaUserTie className="text-orange-600" /> CEO Contact
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">CEO Name</label>
                <input value={ceoName} onChange={(e) => setCeoName(e.target.value)} placeholder="Name" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">CEO Phone</label>
                <input value={ceoPhone} onChange={(e) => setCeoPhone(e.target.value)} placeholder="Phone" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">CEO Email</label>
                <input value={ceoEmail} onChange={(e) => setCeoEmail(e.target.value)} placeholder="Email" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">LinkedIn</label>
                <input value={ceoLinkedin} onChange={(e) => setCeoLinkedin(e.target.value)} placeholder="https://linkedin.com/in/username" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Twitter</label>
                <input value={ceoTwitter} onChange={(e) => setCeoTwitter(e.target.value)} placeholder="https://twitter.com/username" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" />
              </div>
            </div>
          </section>

          <section className="bg-white border border-slate-200 md:rounded-xl shadow-sm md:p-6 p-4">
            <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
              <FaGlobe className="text-orange-600" /> Social Media Links
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Facebook</label>
                <input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/page-name" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Instagram</label>
                <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/username" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Twitter</label>
                <input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://twitter.com/username" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">LinkedIn</label>
                <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/company/name" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" />
              </div>
            </div>

            <button onClick={saveContactInfo} disabled={saving} className="text-sm md:text-base w-full mt-6 px-10 py-3 bg-green-600 text-white rounded-md md:rounded-xl font-black uppercase tracking-widest shadow-lg flex justify-center items-center gap-3 hover:bg-green-700 transition-all">
              {saving ? <FaSpinner className="animate-spin" /> : <FaSave />} Save Contact Info
            </button>
          </section>
        </div>
      </div>

      <AnimatePresence>
        {isDirty && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="w-full fixed top-3 md:top-1 md:left-29 right-0 z-50 px-2 md:px-4">
            <div className="max-w-4xl mx-auto bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex flex-col md:flex-row  gap-4 md:gap-2 items-center justify-between border border-white/10">
              <div className="w-full text-xs font-black uppercase tracking-widest flex justify-center md:justify-start items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" /> Unsaved Changes
              </div>
              <div className="w-full flex justify-center gap-4">
                <button onClick={() => setShowDiscardModal(true)} className="w-full md:w-50 text-xs font-black border border-gray-600 md:px-8 p-4 rounded-2xl uppercase hover:text-orange-500 transition-colors">Discard</button>
                <button onClick={saveContactInfo} disabled={saving} className="w-full  md:w-50 text-xs md:px-8 p-4 bg-orange-600 text-white rounded-xl font-black uppercase text-xs flex justify-center items-center gap-2">
                  {saving ? <FaSpinner className="animate-spin" /> : <FaSave />} Save
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDiscardModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white max-w-sm w-full rounded-3xl p-8 text-center shadow-2xl">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6"><FaExclamationTriangle size={24} /></div>
              <h3 className="text-xl font-black uppercase mb-2">Discard Data?</h3>
              <p className="text-slate-500 text-sm mb-8">Are you sure you want to revert your contact info changes?</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDiscardModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-black uppercase text-xs">Stay</button>
                <button onClick={() => window.location.reload()} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black uppercase text-xs">Discard</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FIXED: Using current state instead of undefined 'settings' variable */}
      <div className="max-w-6xl mx-auto mt-12 pt-12 border-t border-slate-100 flex justify-center gap-8 text-slate-400">
        {facebook && (
          <a href={facebook} target="_blank" rel="noreferrer" className="hover:text-orange-500 transition-colors flex items-center gap-2 text-xs font-black uppercase">
            <FaFacebook /> Facebook
          </a>
        )}
        {instagram && (
          <a href={instagram} target="_blank" rel="noreferrer" className="hover:text-orange-500 transition-colors flex items-center gap-2 text-xs font-black uppercase">
            <FaInstagram /> Instagram
          </a>
        )}
        {twitter && (
          <a href={twitter} target="_blank" rel="noreferrer" className="hover:text-orange-500 transition-colors flex items-center gap-2 text-xs font-black uppercase">
            <FaTwitter /> Twitter
          </a>
        )}
        {linkedin && (
          <a href={linkedin} target="_blank" rel="noreferrer" className="hover:text-orange-500 transition-colors flex items-center gap-2 text-xs font-black uppercase">
            <FaLinkedin /> LinkedIn
          </a>
        )}
      </div>
    </div>
  );
}