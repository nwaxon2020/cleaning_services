"use client";

import { useState, useEffect, useCallback } from 'react';
import { db, storage } from '@/lib/firebase';
import { 
  collection, addDoc, query, orderBy, onSnapshot, 
  serverTimestamp, deleteDoc, 
  doc, updateDoc, setDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  FaPlus, FaTrash, FaGlobe, FaCloudUploadAlt, 
  FaSpinner, FaArrowUp, FaArrowDown, FaQuoteLeft, FaMagic, FaSave
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function SlideshowEditor() {
  const [slides, setSlides] = useState<any[]>([]);
  const [slideUrl, setSlideUrl] = useState('');
  const [slideQuote, setSlideQuote] = useState('');
  const [slideFile, setSlideFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageType, setImageType] = useState<'url' | 'file'>('url');
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Global Attract States
  const [attract, setAttract] = useState('');
  const [originalAttract, setOriginalAttract] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [savingGlobal, setSavingGlobal] = useState(false);

  useEffect(() => {
    // Listen to Slides
    const unsubSlides = onSnapshot(
      query(collection(db, "global_slides"), orderBy("order", "asc")),
      (snap) => setSlides(snap.docs.map(d => ({id: d.id, ...d.data()})))
    );

    // Listen to Global Attract Setting
    const unsubAttract = onSnapshot(doc(db, "settings", "slideshow"), (snap) => {
      if (snap.exists()) {
        const val = snap.data().attract || '';
        setAttract(val);
        setOriginalAttract(val);
      }
    });

    return () => { unsubSlides(); unsubAttract(); };
  }, []);

  // Dirty Check for Global Attract
  useEffect(() => {
    setIsDirty(attract !== originalAttract);
  }, [attract, originalAttract]);

  useEffect(() => {
    if (imageType === 'url' && slideUrl) {
      setPreview(slideUrl);
    } else if (imageType === 'file' && slideFile) {
      const objectUrl = URL.createObjectURL(slideFile);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreview(null);
    }
  }, [slideUrl, slideFile, imageType]);

  const saveGlobalSettings = async () => {
    setSavingGlobal(true);
    try {
      await setDoc(doc(db, "settings", "slideshow"), {
        attract: attract,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setOriginalAttract(attract);
      setIsDirty(false);
      toast.success("Global text updated");
    } catch (e) {
      toast.error("Failed to save");
    } finally {
      setSavingGlobal(false);
    }
  };

  const discardChanges = () => {
    setAttract(originalAttract);
    setIsDirty(false);
    toast.success("Changes discarded");
  };

  const handleAddSlide = async () => {
    if (imageType === 'url' && !slideUrl) return toast.error("Enter URL");
    if (imageType === 'file' && !slideFile) return toast.error("Select File");
    if (!slideQuote) return toast.error("Enter a quote");

    setUploading(true);
    try {
      let finalUrl = slideUrl;
      if (imageType === 'file' && slideFile) {
        const storageRef = ref(storage, `global_slides/${Date.now()}_${slideFile.name}`);
        const snap = await uploadBytes(storageRef, slideFile);
        finalUrl = await getDownloadURL(snap.ref);
      }

      const nextOrder = slides.length > 0 ? Math.max(...slides.map(s => s.order ?? 0)) + 1 : 0;

      await addDoc(collection(db, "global_slides"), {
        url: finalUrl,
        quote: slideQuote,
        order: nextOrder,
        createdAt: serverTimestamp()
      });

      setSlideUrl('');
      setSlideQuote('');
      setSlideFile(null);
      setPreview(null);
      toast.success("Slide added");
    } catch (e) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const moveSlide = async (id: string, direction: 'up' | 'down') => {
    const index = slides.findIndex(s => s.id === id);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const currentSlide = slides[index];
    const targetSlide = slides[targetIndex];

    try {
      await Promise.all([
        updateDoc(doc(db, "global_slides", currentSlide.id), { order: targetSlide.order }),
        updateDoc(doc(db, "global_slides", targetSlide.id), { order: currentSlide.order })
      ]);
      toast.success("Position updated");
    } catch (e) { toast.error("Failed to move"); }
  };

  return (
    <div className="min-h-screen bg-white md:p-8">
      
      {/* UNSAVED CHANGES BAR */}
      <AnimatePresence>
        {isDirty && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="w-full fixed top-3 md:top-1 md:left-29 right-0 z-50 px-2 md:px-4">
            <div className="max-w-4xl mx-auto bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-4 md:gap-2 items-center justify-between border border-white/10">
              <div className="w-full text-xs font-black uppercase tracking-widest flex justify-center md:justify-start items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" /> Unsaved Global Settings
              </div>
              <div className="w-full flex justify-center gap-4">
                <button onClick={discardChanges} className="w-full md:w-50 text-xs font-black border border-gray-600 md:px-8 p-4 rounded-2xl uppercase hover:text-orange-500 transition-colors">Discard</button>
                <button onClick={saveGlobalSettings} disabled={savingGlobal} className="w-full md:w-50 text-xs md:px-8 p-4 bg-orange-600 text-white rounded-xl font-black uppercase flex justify-center items-center gap-2">
                  {savingGlobal ? <FaSpinner className="animate-spin" /> : <FaSave />} Save
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto">
        <header className="mb-10 text-center md:text-left">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
            Global <span className="text-orange-600">Slideshow</span>
          </h1>
          <p className="text-slate-500 text-sm mt-2">Manage images and quotes for the website slideshow</p>
        </header>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 md:p-6 mb-10">
          <div className="max-w-md mx-auto space-y-4">
            <div className="flex gap-2">
              <button onClick={() => { setImageType('url'); setSlideFile(null); }} className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 ${imageType === 'url' ? 'border-orange-600 bg-orange-50' : 'border-slate-200'}`}><FaGlobe className="inline mr-2"/> URL</button>
              <button onClick={() => { setImageType('file'); setSlideUrl(''); }} className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 ${imageType === 'file' ? 'border-orange-600 bg-orange-50' : 'border-slate-200'}`}><FaCloudUploadAlt className="inline mr-2"/> File</button>
            </div>

            <div className={imageType === 'url' ? 'block' : 'hidden'}>
              <input value={slideUrl} onChange={(e) => setSlideUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
            </div>
            
            <div className={imageType === 'file' ? 'block' : 'hidden'}>
              <input type="file" accept="image/*" onChange={(e) => setSlideFile(e.target.files?.[0] || null)} className="w-full p-2 bg-slate-50 border border-dashed rounded-lg text-sm" />
            </div>

            <div className="relative">
                <FaQuoteLeft className="absolute top-4 left-3 text-slate-300 text-xs" />
                <input value={slideQuote} onChange={(e) => setSlideQuote(e.target.value)} placeholder="Enter slide quote/caption..." className="w-full p-3 pl-8 bg-slate-50 border border-slate-200 rounded-lg text-sm italic" />
            </div>

            <AnimatePresence>
              {preview && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-4">
                  <div className="relative aspect-video w-full max-w-[300px] mx-auto bg-slate-100 rounded-lg overflow-hidden border-2 border-orange-500 shadow-md">
                    <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                    {uploading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><FaSpinner className="animate-spin text-orange-600" /></div>}
                  </div>
                  <button onClick={handleAddSlide} disabled={uploading} className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/20">
                    {uploading ? <FaSpinner className="animate-spin" /> : <FaPlus />} Add Slide
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4 mt-12 pt-8 border-t">
            {slides.map((slide, index) => (
              <div key={slide.id} className="relative group aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                <img src={slide.url || ""} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-black/70 md:opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <button onClick={() => moveSlide(slide.id, 'up')} disabled={index === 0} className="p-1.5 bg-white rounded-lg disabled:opacity-30"><FaArrowUp size={10} /></button>
                  <button onClick={() => moveSlide(slide.id, 'down')} disabled={index === slides.length-1} className="p-1.5 bg-white rounded-lg disabled:opacity-30"><FaArrowDown size={10} /></button>
                  <button onClick={() => setDeleteTarget(slide.id)} className="p-1.5 bg-red-600 text-white rounded-lg"><FaTrash size={10} /></button>
                </div>
              </div>
            ))}
          </div>

          {/* GLOBAL ATTRACT INPUT SECTION */}
          <div className="mt-10 pt-8 border-t border-slate-100">
            <label className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 mb-3">
              <FaMagic className="text-orange-500" /> Global Attract Text
            </label>
            <div className="relative">
                <input 
                    value={attract} 
                    onChange={(e) => setAttract(e.target.value)} 
                    placeholder="e.g. EXCLUSIVE OFFERS" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black uppercase tracking-widest focus:ring-2 focus:ring-orange-500/20 outline-none" 
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">GLOBAL</div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 italic">This text will appear across all slides in the main slideshow.</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white max-w-sm w-full p-8 rounded-2xl text-center shadow-2xl">
              <h3 className="font-black uppercase mb-2">Delete Image?</h3>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Cancel</button>
                <button onClick={async () => {
                  if (deleteTarget) {
                    await deleteDoc(doc(db, "global_slides", deleteTarget));
                    setDeleteTarget(null);
                    toast.success("Deleted");
                  }
                }} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}