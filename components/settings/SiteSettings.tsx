"use client";

import { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  FaSave, FaGlobe, FaSpinner, FaImage, 
  FaCloudUploadAlt, FaTimes, FaExclamationTriangle
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function SiteSettingsEditor() {
  // Site Information - Initialized with strings to prevent uncontrolled input errors
  const [siteName, setSiteName] = useState('BristolClean');
  const [siteSlogan, setSiteSlogan] = useState('');
  const [siteQuote, setSiteQuote] = useState('');
  const [footerText, setFooterText] = useState('');

  // Logo
  const [logoImageType, setLogoImageType] = useState<'url' | 'file'>('url');
  const [logoImageUrl, setLogoImageUrl] = useState('');
  const [logoImageFile, setLogoImageFile] = useState<File | null>(null);
  const [logoImagePreview, setLogoImagePreview] = useState<string | null>(null);

  // Favicon
  const [faviconType, setFaviconType] = useState<'url' | 'file'>('url');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);

  // SEO
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');

  // System States
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  useEffect(() => {
    const loadSiteSettings = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "settings", "site");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const fetched = {
            siteName: data.siteName || 'BristolClean',
            siteSlogan: data.siteSlogan || '',
            siteQuote: data.siteQuote || '',
            footerText: data.footerText || '',
            logoUrl: data.logoUrl || '',
            faviconUrl: data.faviconUrl || '',
            metaTitle: data.metaTitle || '',
            metaDescription: data.metaDescription || '',
            metaKeywords: data.metaKeywords || '',
          };
          
          setInitialData(fetched);
          setSiteName(fetched.siteName);
          setSiteSlogan(fetched.siteSlogan);
          setSiteQuote(fetched.siteQuote);
          setFooterText(fetched.footerText);
          setLogoImageUrl(fetched.logoUrl);
          setLogoImagePreview(fetched.logoUrl);
          setFaviconUrl(fetched.faviconUrl);
          setFaviconPreview(fetched.faviconUrl);
          setMetaTitle(fetched.metaTitle);
          setMetaDescription(fetched.metaDescription);
          setMetaKeywords(fetched.metaKeywords);
        }
      } catch (e) {
        toast.error("Failed to load site settings");
      } finally {
        setLoading(false);
      }
    };

    loadSiteSettings();
  }, []);

  // Dirty State Check - Compares current state against initialData
  const isDirty = initialData && (
    siteName !== initialData.siteName ||
    siteSlogan !== initialData.siteSlogan ||
    siteQuote !== initialData.siteQuote ||
    footerText !== initialData.footerText ||
    logoImageUrl !== initialData.logoUrl ||
    faviconUrl !== initialData.faviconUrl ||
    metaTitle !== initialData.metaTitle ||
    metaDescription !== initialData.metaDescription ||
    metaKeywords !== initialData.metaKeywords ||
    logoImageFile !== null ||
    faviconFile !== null
  );

  // Handlers
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearLogo = () => {
    setLogoImageUrl('');
    setLogoImageFile(null);
    setLogoImagePreview(null);
  };

  const handleFaviconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFaviconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setFaviconPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearFavicon = () => {
    setFaviconUrl('');
    setFaviconFile(null);
    setFaviconPreview(null);
  };

  const saveSiteSettings = async () => {
    setSaving(true);
    try {
      let finalLogoUrl = logoImageUrl;
      if (logoImageType === 'file' && logoImageFile) {
        const storageRef = ref(storage, `site/logo_${Date.now()}_${logoImageFile.name}`);
        const snap = await uploadBytes(storageRef, logoImageFile);
        finalLogoUrl = await getDownloadURL(snap.ref);
      }

      let finalFaviconUrl = faviconUrl;
      if (faviconType === 'file' && faviconFile) {
        const storageRef = ref(storage, `site/favicon_${Date.now()}_${faviconFile.name}`);
        const snap = await uploadBytes(storageRef, faviconFile);
        finalFaviconUrl = await getDownloadURL(snap.ref);
      }

      // 1. Create a clean snapshot of the data for comparison
      const updatedSnapshot = {
        siteName, siteSlogan, siteQuote, footerText,
        logoUrl: finalLogoUrl, faviconUrl: finalFaviconUrl,
        metaTitle, metaDescription, metaKeywords,
      };

      // 2. Save to Firestore including the server timestamp
      await setDoc(doc(db, "settings", "site"), {
        ...updatedSnapshot,
        updatedAt: serverTimestamp()
      });

      // 3. Immediately update initialData with the snapshot (excluding timestamp) 
      // This prevents the "Save twice" bug by clearing the dirty state instantly.
      setInitialData(updatedSnapshot);
      setLogoImageFile(null);
      setFaviconFile(null);
      
      toast.success("Site settings saved!");
    } catch (e) {
      toast.error("Failed to save settings");
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
    <div className="min-h-screen bg-white md:p-8 pb-32">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
            Site <span className="text-orange-600">Settings</span>
          </h1>
          <p className="text-slate-500 text-sm mt-2">Manage global site information, logo, and SEO</p>
        </header>

        <div className="space-y-8">
          <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 md:p-6">
            <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
              <FaGlobe className="text-orange-600" /> Site Identity
            </h2>
            <div className="grid gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Site Name</label>
                <input value={siteName || ""} onChange={(e) => setSiteName(e.target.value)} placeholder="BristolClean" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Site Slogan</label>
                <input value={siteSlogan || ""} onChange={(e) => setSiteSlogan(e.target.value)} placeholder="Slogan" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Site Quote</label>
                <textarea value={siteQuote || ""} onChange={(e) => setSiteQuote(e.target.value)} placeholder="Quote" rows={3} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Footer Text</label>
                <input value={footerText || ""} onChange={(e) => setFooterText(e.target.value)} placeholder="Footer" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" />
              </div>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 md:p-6">
            <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
              <FaImage className="text-orange-600" /> Company Logo
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <AnimatePresence>
                  {logoImagePreview && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-full h-48 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                      <img src={logoImagePreview} className="w-full h-full object-contain" alt="Logo Preview" />
                      <button onClick={clearLogo} className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-lg"><FaTimes size={12} /></button>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex gap-2">
                  <button onClick={() => setLogoImageType('url')} className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 ${logoImageType === 'url' ? 'border-orange-600 bg-orange-50' : 'border-slate-200'}`}>URL</button>
                  <button onClick={() => setLogoImageType('file')} className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 ${logoImageType === 'file' ? 'border-orange-600 bg-orange-50' : 'border-slate-200'}`}>Upload</button>
                </div>
                {logoImageType === 'url' ? (
                  <input value={logoImageUrl || ""} onChange={(e) => { setLogoImageUrl(e.target.value); setLogoImagePreview(e.target.value); }} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" />
                ) : (
                  <input type="file" accept="image/*" onChange={handleLogoFileChange} className="w-full p-2 bg-slate-50 border border-dashed rounded-lg" />
                )}
              </div>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 md:p-6">
            <h2 className="text-xl font-black uppercase mb-6">SEO Settings</h2>
            <div className="grid gap-6">
              <input value={metaTitle || ""} onChange={(e) => setMetaTitle(e.target.value)} placeholder="Meta Title" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" />
              <textarea value={metaDescription || ""} onChange={(e) => setMetaDescription(e.target.value)} placeholder="Meta Description" rows={3} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" />
              <input value={metaKeywords || ""} onChange={(e) => setMetaKeywords(e.target.value)} placeholder="Keywords" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" />
            </div>
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
                <button onClick={saveSiteSettings} disabled={saving} className="w-full  md:w-50 text-xs md:px-8 p-4 bg-orange-600 text-white rounded-xl font-black uppercase text-xs flex justify-center items-center gap-2">
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
              <h3 className="text-xl font-black uppercase mb-2">Discard Changes?</h3>
              <p className="text-slate-500 text-sm mb-8">Are you sure you want to revert your changes? This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDiscardModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-black uppercase text-xs">Stay</button>
                <button onClick={() => window.location.reload()} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black uppercase text-xs">Discard</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}