"use client";

import { useState, useEffect, useCallback } from 'react';
import { db, storage } from '@/lib/firebase';
import { 
  collection, doc, setDoc, addDoc, 
  query, orderBy, onSnapshot, serverTimestamp,
  deleteDoc, updateDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  FaSave, FaTrash, FaImage, FaSpinner, FaTimes, FaEdit,
  FaUserTie, FaQuoteLeft, FaGem
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import AboutPreviewEditorUi from '@/components/settings/AboutPreviewsettings';

export default function AboutEditor() {
  // --- HERO SLIDES ---
  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [slideUrl, setSlideUrl] = useState('');
  const [slideFile, setSlideFile] = useState<File | null>(null);
  const [slidePreview, setSlidePreview] = useState<string | null>(null);
  const [slideTitle, setSlideTitle] = useState('');
  const [slideQuote, setSlideQuote] = useState('');
  const [imageType, setImageType] = useState<'url' | 'file'>('url');
  const [uploadingSlide, setUploadingSlide] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);

  // --- TIMELINE ITEMS ---
  const [timeline, setTimeline] = useState<any[]>([]);
  const [timelineYear, setTimelineYear] = useState('');
  const [timelineTitle, setTimelineTitle] = useState('');
  const [timelineDesc, setTimelineDesc] = useState('');
  const [timelineIcon, setTimelineIcon] = useState('FaRocket');
  const [editingTimelineId, setEditingTimelineId] = useState<string | null>(null);

  // --- STAFF MEMBERS ---
  const [staff, setStaff] = useState<any[]>([]);
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('');
  const [staffBio, setStaffBio] = useState('');
  const [staffImageUrl, setStaffImageUrl] = useState('');
  const [staffImageFile, setStaffImageFile] = useState<File | null>(null);
  const [staffImagePreview, setStaffImagePreview] = useState<string | null>(null);
  const [staffImageType, setStaffImageType] = useState<'url' | 'file'>('url');
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [uploadingStaff, setUploadingStaff] = useState(false);

  // --- MISSION & VISION ---
  const [missionText, setMissionText] = useState('');
  const [visionText, setVisionText] = useState('');
  const [coreValues, setCoreValues] = useState(''); 
  const [heroText, setHeroText] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [stats, setStats] = useState({ clients: '500+', satisfaction: '100%' });

  // --- CEO & STATS ---
  const [ceoName, setCeoName] = useState('');
  const [ceoPhone, setCeoPhone] = useState('');
  const [ceoEmail, setCeoEmail] = useState('');
  const [ceoImageUrl, setCeoImageUrl] = useState('');
  const [ceoImagePreview, setCeoImagePreview] = useState<string | null>(null);
  const [motto, setMotto] = useState('');
  const [experience, setExperience] = useState('');
  const [clientsCount, setClientsCount] = useState('');
  const [uploadingCeo, setUploadingCeo] = useState(false);

  // --- DIRTY TRACKING ---
  const [originalSettings, setOriginalSettings] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);

  // --- UI STATES ---
  const [deleteTarget, setDeleteTarget] = useState<{id: string, type: string, name: string} | null>(null);
  const [loading, setLoading] = useState(false);

  // --- DATA FETCHING ---
  useEffect(() => {
    const unsubSlides = onSnapshot(query(collection(db, "about_hero_slides"), orderBy("order", "asc")), (snap) => setHeroSlides(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubTimeline = onSnapshot(query(collection(db, "about_timeline"), orderBy("year", "asc")), (snap) => setTimeline(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubStaff = onSnapshot(query(collection(db, "about_staff"), orderBy("createdAt", "desc")), (snap) => setStaff(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubMission = onSnapshot(doc(db, "settings", "about_mission"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setMissionText(data.mission || '');
        setVisionText(data.vision || '');
        setCoreValues(data.values || ''); 
        setHeroText(data.hero || '');
        setHeroSubtitle(data.subtitle || '');
        setStats(data.stats || { clients: '500+', satisfaction: '100%' });
        setCeoImageUrl(data.ceoImageUrl || '');
        setCeoImagePreview(data.ceoImageUrl || null);
        setCeoName(data.ceoName || '');
        setCeoPhone(data.ceoPhone || '');
        setCeoEmail(data.ceoEmail || '');
        setMotto(data.motto || '');
        setExperience(data.experience || '');
        setClientsCount(data.clientsCount || '');
        setOriginalSettings(data);
      }
    });
    return () => { unsubSlides(); unsubTimeline(); unsubStaff(); unsubMission(); };
  }, []);

  // --- DIRTY CHECK LOGIC ---
  useEffect(() => {
    if (!originalSettings) return;
    const current = {
      mission: missionText, vision: visionText, values: coreValues,
      hero: heroText, subtitle: heroSubtitle, ceoImageUrl,
      ceoName, ceoPhone, ceoEmail, motto, experience, clientsCount
    };
    
    const hasChanged = Object.keys(current).some(key => current[key as keyof typeof current] !== originalSettings[key]);
    setIsDirty(hasChanged);
  }, [missionText, visionText, coreValues, heroText, heroSubtitle, ceoImageUrl, ceoName, ceoPhone, ceoEmail, motto, experience, clientsCount, originalSettings]);

  const discardChanges = useCallback(() => {
    if (originalSettings) {
      setMissionText(originalSettings.mission || '');
      setVisionText(originalSettings.vision || '');
      setCoreValues(originalSettings.values || '');
      setHeroText(originalSettings.hero || '');
      setHeroSubtitle(originalSettings.subtitle || '');
      setCeoImageUrl(originalSettings.ceoImageUrl || '');
      setCeoImagePreview(originalSettings.ceoImageUrl || null);
      setCeoName(originalSettings.ceoName || '');
      setCeoPhone(originalSettings.ceoPhone || '');
      setCeoEmail(originalSettings.ceoEmail || '');
      setMotto(originalSettings.motto || '');
      setExperience(originalSettings.experience || '');
      setClientsCount(originalSettings.clientsCount || '');
      setIsDirty(false);
      toast.success("Changes discarded");
    }
  }, [originalSettings]);

  // --- LOGIC ---

  const handleSlideFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSlideFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setSlidePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddSlide = async () => {
    if (!slideTitle || !slideQuote) return toast.error("Fill slide details");
    setUploadingSlide(true);
    try {
      let finalImageUrl = slideUrl;
      if (imageType === 'file' && slideFile) {
        const storageRef = ref(storage, `about/slides/${Date.now()}_${slideFile.name}`);
        const snap = await uploadBytes(storageRef, slideFile);
        finalImageUrl = await getDownloadURL(snap.ref);
      }
      const slideData = { url: finalImageUrl, title: slideTitle, quote: slideQuote, order: heroSlides.length, updatedAt: serverTimestamp() };
      if (editingSlideId) await updateDoc(doc(db, "about_hero_slides", editingSlideId), slideData);
      else await addDoc(collection(db, "about_hero_slides"), { ...slideData, createdAt: serverTimestamp() });
      resetSlideForm();
      toast.success("Slide saved");
    } catch (e) { toast.error("Error saving slide"); }
    finally { setUploadingSlide(false); }
  };

  const resetSlideForm = () => { 
    setSlideUrl(''); setSlideFile(null); setSlidePreview(null); setSlideTitle(''); setSlideQuote(''); setEditingSlideId(null); 
  };
  const handleEditSlide = (slide: any) => { 
    setEditingSlideId(slide.id); setSlideUrl(slide.url); setSlidePreview(slide.url); setSlideTitle(slide.title); setSlideQuote(slide.quote); 
  };

  const handleAddTimeline = async () => {
    if (!timelineYear || !timelineTitle || !timelineDesc) return toast.error("Fill timeline fields");
    try {
      const data = { year: timelineYear, title: timelineTitle, desc: timelineDesc, icon: timelineIcon, updatedAt: serverTimestamp() };
      if (editingTimelineId) await updateDoc(doc(db, "about_timeline", editingTimelineId), data);
      else await addDoc(collection(db, "about_timeline"), { ...data, createdAt: serverTimestamp() });
      resetTimelineForm();
      toast.success("Timeline saved");
    } catch (e) { toast.error("Error saving timeline"); }
  };

  const resetTimelineForm = () => { setTimelineYear(''); setTimelineTitle(''); setTimelineDesc(''); setTimelineIcon('FaRocket'); setEditingTimelineId(null); };

  const handleStaffImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setStaffImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setStaffImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddStaff = async () => {
    if (!staffName || !staffRole) return toast.error("Fill staff fields");
    setUploadingStaff(true);
    try {
      let finalImageUrl = staffImageUrl;
      if (staffImageFile) {
        const storageRef = ref(storage, `about/staff/${Date.now()}_${staffImageFile.name}`);
        const snap = await uploadBytes(storageRef, staffImageFile);
        finalImageUrl = await getDownloadURL(snap.ref);
      }
      const data = { name: staffName, role: staffRole, bio: staffBio, image: finalImageUrl, updatedAt: serverTimestamp() };
      if (editingStaffId) await updateDoc(doc(db, "about_staff", editingStaffId), data);
      else await addDoc(collection(db, "about_staff"), { ...data, createdAt: serverTimestamp() });
      resetStaffForm();
      toast.success(editingStaffId ? "Staff updated" : "Staff added");
    } catch (e) { toast.error("Error saving staff"); }
    finally { setUploadingStaff(false); }
  };

  const handleEditStaff = (member: any) => {
    setEditingStaffId(member.id); setStaffName(member.name); setStaffRole(member.role); setStaffBio(member.bio || ''); setStaffImageUrl(member.image); setStaffImagePreview(member.image);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetStaffForm = () => { setStaffName(''); setStaffRole(''); setStaffBio(''); setStaffImageUrl(''); setStaffImageFile(null); setStaffImagePreview(null); setEditingStaffId(null); };

  const handleCeoImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCeo(true);
    try {
      const storageRef = ref(storage, `about/ceo_${Date.now()}`);
      const snap = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snap.ref);
      setCeoImageUrl(url); setCeoImagePreview(url);
      toast.success("CEO image uploaded");
    } catch (e) { toast.error("Upload failed"); }
    finally { setUploadingCeo(false); }
  };

  const saveMissionVision = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "settings", "about_mission"), {
        mission: missionText, vision: visionText, values: coreValues, hero: heroText, subtitle: heroSubtitle,
        ceoImageUrl, ceoName, ceoPhone, ceoEmail, motto, experience, clientsCount, stats, updatedAt: serverTimestamp()
      });
      setIsDirty(false);
      toast.success("All changes saved");
    } catch (e) { toast.error("Error saving"); }
    finally { setLoading(false); }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try { await deleteDoc(doc(db, deleteTarget.type, deleteTarget.id)); toast.success("Deleted"); setDeleteTarget(null); }
    catch (e) { toast.error("Failed"); }
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      {/* UNSAVED CHANGES BAR - EXACT POSITIONING & STYLE */}
      <AnimatePresence>
        {isDirty && (
          <motion.div 
            initial={{ y: 100 }} 
            animate={{ y: 0 }} 
            exit={{ y: 100 }} 
            className="w-full fixed top-3 md:top-1 md:left-29 right-0 z-50 px-2 md:px-4"
          >
            <div className="max-w-4xl mx-auto bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-4 md:gap-2 items-center justify-between border border-white/10">
              <div className="w-full text-xs font-black uppercase tracking-widest flex justify-center md:justify-start items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" /> Unsaved Changes
              </div>
              <div className="w-full flex justify-center gap-4">
                <button 
                  onClick={discardChanges} 
                  className="w-full md:w-50 text-xs font-black border border-gray-600 md:px-8 p-4 rounded-2xl uppercase hover:text-orange-500 transition-colors"
                >
                  Discard
                </button>
                <button 
                  onClick={saveMissionVision} 
                  disabled={loading} 
                  className="w-full md:w-50 text-xs md:px-8 p-4 bg-orange-600 text-white rounded-xl font-black uppercase flex justify-center items-center gap-2"
                >
                  {loading ? <FaSpinner className="animate-spin" /> : <FaSave />} Save
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">About Page <span className="text-orange-600">Editor</span></h1>
        </header>

        <div className='mb-12 md:mb-16'><AboutPreviewEditorUi/></div>

        <div className="p-4 rounded-t-2xl bg-gradient-to-r from-orange-50 to-amber-50 border-b border-slate-200">
            <h2 className="text-xl font-black text-slate-900">About Page Main Editor</h2>
            <p className="text-sm text-slate-500 mt-1">Customize the main about page</p>
        </div>

        {/* HERO SLIDES */}
        <section className="bg-white border border-slate-200 md:rounded-b-xl shadow-sm p-4 md:p-6 mb-10">
          <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2"><FaImage className="text-orange-600" /> Hero Slideshow</h2>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <input value={slideTitle} onChange={(e) => setSlideTitle(e.target.value)} placeholder="Slide Title" className="w-full p-3 bg-slate-50 border rounded-lg font-bold" />
              <input value={slideQuote} onChange={(e) => setSlideQuote(e.target.value)} placeholder="Quote" className="w-full p-3 bg-slate-50 border rounded-lg" />
              <AnimatePresence>
                {slidePreview && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative aspect-video rounded-xl overflow-hidden border-2 border-orange-500 shadow-lg">
                    <img src={slidePreview} className="w-full h-full object-cover" alt="Preview" />
                    <button onClick={() => { setSlidePreview(null); setSlideFile(null); setSlideUrl(''); }} className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full"><FaTimes/></button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button onClick={() => setImageType('url')} className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 ${imageType === 'url' ? 'border-orange-600 bg-orange-50' : 'border-slate-200'}`}>URL</button>
                <button onClick={() => setImageType('file')} className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 ${imageType === 'file' ? 'border-orange-600 bg-orange-50' : 'border-slate-200'}`}>File</button>
              </div>
              {imageType === 'url' ? (
                <input value={slideUrl} onChange={(e) => { setSlideUrl(e.target.value); setSlidePreview(e.target.value); }} placeholder="Image URL" className="w-full p-3 bg-slate-50 border rounded-lg" />
              ) : (
                <input type="file" onChange={handleSlideFileChange} className="w-full p-2 bg-slate-50 border border-dashed rounded-lg" />
              )}
              <button onClick={handleAddSlide} disabled={uploadingSlide} className="w-full bg-orange-600 text-white py-4 rounded-lg font-black uppercase tracking-widest shadow-md">
                {uploadingSlide ? <FaSpinner className="animate-spin mx-auto" /> : (editingSlideId ? 'Update Slide' : 'Add Slide')}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {heroSlides.map((slide) => (
              <div key={slide.id} className="relative group border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-sm">
                <div className="relative aspect-video">
                    <img src={slide.url} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-black/70 md:opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onClick={() => handleEditSlide(slide)} className="p-2 bg-white rounded-lg text-slate-900"><FaEdit size={14} /></button>
                        <button onClick={() => setDeleteTarget({id: slide.id, type: 'about_hero_slides', name: slide.title})} className="p-2 bg-red-600 text-white rounded-lg"><FaTrash size={14} /></button>
                    </div>
                </div>
                <div className="p-3">
                  <h4 className="font-black text-xs uppercase text-slate-800 truncate">{slide.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* HERO TEXT SECTION */}
        <section className="bg-white border border-slate-200 md:rounded-xl shadow-sm p-4 md:p-6 mb-10">
          <h2 className="text-xl font-black uppercase mb-4">Hero Text Section</h2>
          <div className="space-y-4">
            <input value={heroText} onChange={(e) => setHeroText(e.target.value)} placeholder="Main Heading" className="w-full p-3 bg-slate-50 border rounded-lg" />
            <input value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} placeholder="Hero Subtitle" className="w-full p-3 bg-slate-50 border rounded-lg" />
          </div>
        </section>

        {/* CEO SECTION */}
        <section className="bg-white border border-slate-200 md:rounded-xl shadow-sm p-4 md:p-6 mb-10">
          <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2"><FaUserTie className="text-orange-600" /> Executive & Stats</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="relative aspect-square w-48 bg-slate-50 border-2 border-dashed rounded-2xl flex items-center justify-center overflow-hidden mb-4">
                {ceoImagePreview ? <img src={ceoImagePreview} className="w-full h-full object-cover" alt="CEO" /> : <FaUserTie className="text-slate-200 text-4xl" />}
              </div>
              <input type="file" accept="image/*" onChange={handleCeoImageChange} className="text-xs mb-4 block" />
              <input value={ceoName} onChange={(e)=>setCeoName(e.target.value)} placeholder="CEO Full Name" className="w-full p-3 bg-slate-50 border rounded-lg" />
              <input value={ceoPhone} onChange={(e)=>setCeoPhone(e.target.value)} placeholder="CEO Phone" className="w-full p-3 bg-slate-50 border rounded-lg" />
              <input value={ceoEmail} onChange={(e)=>setCeoEmail(e.target.value)} placeholder="CEO Email" className="w-full p-3 bg-slate-50 border rounded-lg" />
            </div>
            <div className="space-y-4">
              <div className="relative">
                <FaQuoteLeft className="absolute top-4 left-3 text-slate-200" />
                <input value={motto} onChange={(e)=>setMotto(e.target.value)} placeholder="Company Motto" className="w-full p-3 pl-10 bg-slate-50 border rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input value={experience} onChange={(e)=>setExperience(e.target.value)} placeholder="Experience (e.g. 15+)" className="w-full p-3 bg-slate-50 border rounded-lg" />
                <input value={clientsCount} onChange={(e)=>setClientsCount(e.target.value)} placeholder="Clients (e.g. 2,000+)" className="w-full p-3 bg-slate-50 border rounded-lg" />
              </div>
            </div>
          </div>
        </section>

        {/* TIMELINE */}
        <section className="bg-white border border-slate-200 md:rounded-xl shadow-sm p-4 md:p-6 mb-10">
          <h2 className="text-xl font-black uppercase mb-6">Timeline</h2>
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <input value={timelineYear} onChange={(e) => setTimelineYear(e.target.value)} placeholder="Year" className="p-3 bg-slate-50 border rounded-lg" />
            <input value={timelineTitle} onChange={(e) => setTimelineTitle(e.target.value)} placeholder="Title" className="p-3 bg-slate-50 border rounded-lg" />
            <input value={timelineDesc} onChange={(e) => setTimelineDesc(e.target.value)} placeholder="Desc" className="p-3 bg-slate-50 border rounded-lg md:col-span-2" />
          </div>
          <button onClick={handleAddTimeline} className="px-6 py-3 bg-orange-600 text-white rounded-lg font-bold">{editingTimelineId ? 'Update' : 'Add'}</button>
          <div className="space-y-2 mt-6">
            {timeline.map(item => (
              <div key={item.id} className="flex justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex gap-4 items-start">
                  <span className="text-orange-600 font-bold">{item.year}</span>
                  <span className="font-bold">{item.title}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingTimelineId(item.id); setTimelineYear(item.year); setTimelineTitle(item.title); setTimelineDesc(item.desc); }}><FaEdit /></button>
                  <button onClick={() => setDeleteTarget({id: item.id, type: 'about_timeline', name: item.title})} className="text-red-600"><FaTrash /></button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* MISSION & VISION */}
        <section className="bg-white border border-slate-200 md:rounded-xl shadow-sm p-4 md:p-6 mb-10">
          <h2 className="text-xl font-black uppercase mb-4">Mission, Vision & Values</h2>
          <div className="space-y-4">
            <textarea value={missionText} onChange={(e) => setMissionText(e.target.value)} placeholder="Mission" rows={3} className="w-full p-3 bg-slate-50 border rounded-lg" />
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1"><FaGem className="text-orange-600"/> Core Values</label>
              <input value={coreValues} onChange={(e) => setCoreValues(e.target.value)} placeholder="Integrity, Innovation, Excellence..." className="w-full p-3 bg-slate-50 border rounded-lg" />
            </div>
            <textarea value={visionText} onChange={(e) => setVisionText(e.target.value)} placeholder="Vision" rows={3} className="w-full p-3 bg-slate-50 border rounded-lg" />
          </div>
        </section>

        {/* STAFF */}
        <section className="bg-white border border-slate-200 md:rounded-xl shadow-sm p-4 md:p-6 mb-10">
          <h2 className="text-xl font-black uppercase mb-6">Staff Members</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <input value={staffName} onChange={(e) => setStaffName(e.target.value)} placeholder="Name" className="w-full p-3 bg-slate-50 border rounded-lg" />
              <input value={staffRole} onChange={(e) => setStaffRole(e.target.value)} placeholder="Role" className="w-full p-3 bg-slate-50 border rounded-lg" />
              <textarea value={staffBio} onChange={(e) => setStaffBio(e.target.value)} placeholder="Bio" rows={2} className="w-full p-3 bg-slate-50 border rounded-lg" />
              <AnimatePresence>
                {staffImagePreview && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative aspect-square w-32 rounded-xl overflow-hidden border-2 border-orange-500 shadow-md">
                    <img src={staffImagePreview} className="w-full h-full object-cover" alt="Staff Preview" />
                    <button onClick={() => { setStaffImagePreview(null); setStaffImageFile(null); setStaffImageUrl(''); }} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full"><FaTimes size={10}/></button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button onClick={() => setStaffImageType('url')} className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 ${staffImageType === 'url' ? 'border-orange-600 bg-orange-50' : 'border-slate-200'}`}>URL</button>
                <button onClick={() => setStaffImageType('file')} className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 ${staffImageType === 'file' ? 'border-orange-600 bg-orange-50' : 'border-slate-200'}`}>File</button>
              </div>
              {staffImageType === 'url' ? (
                <input value={staffImageUrl} onChange={(e) => { setStaffImageUrl(e.target.value); setStaffImagePreview(e.target.value); }} placeholder="Staff Image URL" className="w-full p-3 bg-slate-50 border rounded-lg" />
              ) : (
                <input type="file" onChange={handleStaffImageChange} className="w-full p-2 bg-slate-50 border border-dashed rounded-lg" />
              )}
              <button onClick={handleAddStaff} disabled={uploadingStaff} className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold">
                {uploadingStaff ? <FaSpinner className="animate-spin mx-auto"/> : (editingStaffId ? "Update Staff" : "Add Staff Member")}
              </button>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {staff.map(member => (
              <div key={member.id} className="border rounded-xl p-4 group bg-slate-50">
                <img src={member.image} className="w-full h-40 object-cover rounded-lg mb-2" alt="" />
                <h3 className="font-bold">{member.name}</h3>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handleEditStaff(member)} className="p-2 bg-white border rounded-lg text-slate-700 hover:text-orange-600 transition-colors"><FaEdit size={14} /></button>
                  <button onClick={() => setDeleteTarget({id: member.id, type: 'about_staff', name: member.name})} className="p-2 bg-white border rounded-lg text-red-600"><FaTrash size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER SAVE BUTTON */}
        <div>
          <button onClick={saveMissionVision} disabled={loading} className="w-full px-10 py-4 bg-green-600 text-white rounded-xl font-black uppercase tracking-widest shadow-lg flex justify-center items-center gap-3 hover:bg-green-700 transition-all">
            {loading ? <FaSpinner className="animate-spin" /> : <FaSave />} Save All About Us Changes
          </button>
        </div>
      </div>

      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[2000] bg-slate-900/80 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl text-center max-w-sm w-full">
              <h3 className="font-black uppercase mb-2">Confirm Delete</h3>
              <p className="text-sm text-slate-500 mb-6">Remove "{deleteTarget.name}"?</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-black">Cancel</button>
                <button onClick={executeDelete} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-black">Delete</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}