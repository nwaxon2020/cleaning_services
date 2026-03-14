"use client";

import { useState, useEffect, useRef } from 'react';
import { db, storage } from '@/lib/firebase';
import { 
  collection, addDoc, query, orderBy, onSnapshot, 
  serverTimestamp, doc, updateDoc, deleteDoc, setDoc, arrayUnion, arrayRemove 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  FaPlus, FaTrash, FaImage, FaPhone, FaEnvelope, 
  FaMapMarkerAlt, FaSpinner, FaSave, FaExclamationTriangle, 
  FaCheckCircle, FaEdit, FaTimes, FaUpload, FaGlobe,
  FaHeartbeat, FaStethoscope, FaTooth, FaEye, FaBriefcaseMedical, FaLayerGroup
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function HealthServicesEditorUi() {
  const formRef = useRef<HTMLDivElement>(null);

  // --- SECTION 1: CONTACT INFO ---
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [mapUrl, setMapUrl] = useState('');

  // --- SECTION 2: GLOBAL SLIDER IMAGES ---
  const [sliderImages, setSliderImages] = useState<string[]>([]);
  const [slideUrl, setSlideUrl] = useState('');
  const [slideImageType, setSlideImageType] = useState<'url' | 'file'>('url');
  const [uploadingSlide, setUploadingSlide] = useState(false);

  // --- SECTION 3: DYNAMIC CATEGORIES ---
  const [categories, setCategories] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState('');

  // --- SECTION 4: SERVICES ---
  const [services, setServices] = useState<any[]>([]);
  const [serviceName, setServiceName] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  const [serviceIcon, setServiceIcon] = useState('FaHeartbeat');
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // --- UI STATES ---
  const [loading, setLoading] = useState(false);
  const [savingContact, setSavingContact] = useState(false);

  // --- DATA FETCHING ---
  useEffect(() => {
    onSnapshot(doc(db, "settings", "health_contact"), (s) => {
      if (s.exists()) {
        const d = s.data();
        setPhoneNumber(d.phoneNumber || ''); 
        setEmail(d.email || '');
        setAddress(d.address || ''); 
        setMapUrl(d.mapUrl || '');
      }
    });

    onSnapshot(doc(db, "settings", "health_slides"), (s) => {
      if (s.exists()) setSliderImages(s.data().urls || []);
    });

    onSnapshot(query(collection(db, "health_categories"), orderBy("name", "asc")), (s) => {
      setCategories(s.docs.map(d => ({id: d.id, ...d.data()})));
    });

    onSnapshot(query(collection(db, "health_services"), orderBy("createdAt", "desc")), (s) => {
      setServices(s.docs.map(d => ({id: d.id, ...d.data()})));
    });
  }, []);

  // --- IMAGE OPTIMIZATION ---
  const optimizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX = 1200;
          let w = img.width, h = img.height;
          if (w > h && w > MAX) { h *= MAX / w; w = MAX; }
          else if (h > MAX) { w *= MAX / h; h = MAX; }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
          canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.8);
        };
      };
    });
  };

  // --- LOGIC: CONTACT ---
  const saveContactInfo = async () => {
    setSavingContact(true);
    try {
      await setDoc(doc(db, "settings", "health_contact"), {
        phoneNumber, email, address, mapUrl, updatedAt: serverTimestamp()
      });
      toast.success("Contact info saved!");
    } catch (e) { toast.error("Failed to save"); }
    finally { setSavingContact(false); }
  };

  // --- LOGIC: SLIDER ---
  const handleAddSlide = async (e?: any) => {
    setUploadingSlide(true);
    try {
      let url = slideUrl;
      if (slideImageType === 'file') {
        const file = e.target.files?.[0];
        if (!file) return;
        const blob = await optimizeImage(file);
        const refObj = ref(storage, `health/slides/${Date.now()}`);
        await uploadBytes(refObj, blob);
        url = await getDownloadURL(refObj);
      }
      if (!url) return;
      await setDoc(doc(db, "settings", "health_slides"), {
        urls: arrayUnion(url)
      }, { merge: true });
      setSlideUrl('');
      toast.success("Slide added!");
    } catch (e) { toast.error("Upload failed"); }
    finally { setUploadingSlide(false); }
  };

  const removeSlide = async (url: string) => {
    await updateDoc(doc(db, "settings", "health_slides"), {
      urls: arrayRemove(url)
    });
    toast.success("Slide removed");
  };

  // --- LOGIC: CATEGORIES ---
  const addCategory = async () => {
    if (!newCatName) return;
    await addDoc(collection(db, "health_categories"), { name: newCatName });
    setNewCatName('');
    toast.success("Category Created");
  };

  // --- LOGIC: SERVICES ---
  const handleAddService = async () => {
    if (!serviceName || !serviceCategory) return toast.error("Please fill in Service Name and Category");
    setLoading(true);
    try {
      const data = {
        name: serviceName,
        description: serviceDescription,
        category: serviceCategory,
        icon: serviceIcon,
        updatedAt: serverTimestamp()
      };
      if (editingServiceId) {
        await updateDoc(doc(db, "health_services", editingServiceId), data);
      } else {
        await addDoc(collection(db, "health_services"), { ...data, createdAt: serverTimestamp() });
      }
      resetForm();
      toast.success("Service Saved Successfully");
    } catch (e) { toast.error("Error saving service"); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setServiceName(''); setServiceDescription(''); setServiceCategory('');
    setEditingServiceId(null);
  };

  return (
    <div className="mx-auto p-3 md:p-10 bg-white min-h-screen text-slate-900 pb-32">
      <h1 className="text-2xl md:text-3xl font-black italic uppercase mb-8">Health <span className="text-green-600">Admin Console</span></h1>

      {/* SECTION 1: CONTACT INFORMATION */}
      <div className="p-3 md:p-6 bg-green-900 text-white rounded-xl shadow-xl mb-10 border-b-4 border-green-600">
        <h3 className="text-xs font-black uppercase italic mb-6 flex items-center gap-2 text-green-300">Contact & Location</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
             <label className="text-[10px] uppercase font-bold text-green-400 ml-1">Phone Number</label>
             <input value={phoneNumber} onChange={(e)=>setPhoneNumber(e.target.value)} placeholder="+44..." className="w-full bg-green-800 p-3 rounded-xl outline-none border border-green-700 focus:border-green-400" />
          </div>
          <div className="space-y-1">
             <label className="text-[10px] uppercase font-bold text-green-400 ml-1">Email Address</label>
             <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="email@healthcare.com" className="w-full bg-green-800 p-3 rounded-xl outline-none border border-green-700 focus:border-green-400" />
          </div>
          <div className="space-y-1 md:col-span-2">
             <label className="text-[10px] uppercase font-bold text-green-400 ml-1">Physical Address</label>
             <input value={address} onChange={(e)=>setAddress(e.target.value)} placeholder="Full Address" className="w-full bg-green-800 p-3 rounded-xl outline-none border border-green-700 focus:border-green-400" />
          </div>
          <div className="space-y-1 md:col-span-2">
             <label className="text-[10px] uppercase font-bold text-green-400 ml-1">Google Maps URL</label>
             <input value={mapUrl} onChange={(e)=>setMapUrl(e.target.value)} placeholder="Paste Google Maps link here" className="w-full bg-green-800 p-3 rounded-xl outline-none border border-green-700 focus:border-green-400 text-xs" />
          </div>
        </div>
        <button onClick={saveContactInfo} disabled={savingContact} className="mt-6 w-full bg-green-500 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-green-400 transition-all shadow-lg">
          {savingContact ? <FaSpinner className="animate-spin mx-auto"/> : <div className="flex items-center justify-center gap-2"><FaSave/> Save Contact Info</div>}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* SECTION 2: GLOBAL SLIDER */}
        <div className="bg-slate-50 p-3 md:p-6 rounded-xl border border-slate-200">
          <h3 className="text-xs font-black uppercase italic mb-6 flex items-center gap-2 text-slate-500"><FaImage/> Slider Image Gallery</h3>
          
          <div className="flex gap-2 mb-6">
            <select value={slideImageType} onChange={(e:any)=>setSlideImageType(e.target.value)} className="p-3 text-xs bg-white border rounded-xl font-bold">
                <option value="url">URL</option>
                <option value="file">FILE</option>
            </select>
            {slideImageType === 'url' ? (
                <input value={slideUrl} onChange={(e)=>setSlideUrl(e.target.value)} placeholder="Paste image link..." className="flex-1 p-3 text-xs border rounded-xl bg-white" />
            ) : (
                <div className="flex-1 bg-white border border-dashed rounded-xl p-2"><input type="file" onChange={handleAddSlide} className="text-[10px]" /></div>
            )}
            {slideImageType === 'url' && (
                <button onClick={() => handleAddSlide()} className="bg-green-600 text-white px-5 rounded-xl"><FaPlus/></button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {sliderImages.map((url, i) => (
              <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-slate-300 shadow-sm group">
                <img src={url} className="w-full h-full object-cover" />
                <button onClick={() => removeSlide(url)} className="absolute top-1 right-1 bg-red-600 text-white p-1.5 rounded-full md:opacity-0 group-hover:opacity-100 transition-opacity"><FaTrash size={10}/></button>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: CATEGORY MANAGEMENT */}
        <div className="bg-slate-50 p-3 md:p-6 rounded-xl border border-slate-200">
          <h3 className="text-xs font-black uppercase italic mb-6 flex items-center gap-2 text-slate-500"><FaLayerGroup/> Health Categories</h3>
          <div className="flex flex-col md:flex-row gap-2 mb-6">
            <input value={newCatName} onChange={(e)=>setNewCatName(e.target.value)} placeholder="New Category Name..." className="flex-1 p-3 bg-white border rounded-xl text-sm outline-none focus:border-green-500" />
            <button onClick={addCategory} className="bg-slate-900 text-white py-3 px-6 rounded-xl font-bold uppercase text-[10px] hover:bg-black transition-all">Add</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
                <span key={c.id} className="px-4 py-2 bg-white border rounded-xl text-[10px] font-black uppercase text-slate-600 flex items-center gap-3 shadow-sm">
                    {c.name} 
                    <FaTimes onClick={async() => await deleteDoc(doc(db, "health_categories", c.id))} className="text-red-400 cursor-pointer hover:text-red-600"/>
                </span>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 4: SERVICE EDITOR */}
      <div ref={formRef} className="mt-10 p-3 md:p-6 bg-green-50 border-2 border-green-100 rounded-xl shadow-inner">
        <h3 className="text-xl font-black uppercase italic mb-8 flex items-center gap-3">
            <FaBriefcaseMedical className="text-green-600"/> {editingServiceId ? 'Modify Service' : 'Create New Service'}
        </h3>

        <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-5">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 ml-2">Service Title</label>
                    <input value={serviceName} onChange={(e)=>setServiceName(e.target.value)} placeholder="e.g. Intensive Care" className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none focus:border-green-500" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 ml-2">Assigned Category</label>
                    <select value={serviceCategory} onChange={(e)=>setServiceCategory(e.target.value)} className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none focus:border-green-500">
                        <option value="">Choose Category</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 ml-2">Visual Icon</label>
                    <select value={serviceIcon} onChange={(e)=>setServiceIcon(e.target.value)} className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none">
                        <option value="FaHeartbeat">Heartbeat</option>
                        <option value="FaStethoscope">Stethoscope</option>
                        <option value="FaTooth">Dental</option>
                        <option value="FaEye">Eye Care</option>
                        <option value="FaBriefcaseMedical">Medical Case</option>
                    </select>
                </div>
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 ml-2">Detailed Description</label>
                <textarea value={serviceDescription} onChange={(e)=>setServiceDescription(e.target.value)} placeholder="Explain the service details..." className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none h-full min-h-[200px] focus:border-green-500 resize-none" />
            </div>
        </div>

        <button onClick={handleAddService} disabled={loading} className="mt-10 text-sm md:text-base w-full py-5 bg-green-600 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-green-700 transition-all">
            {loading ? <FaSpinner className="animate-spin" /> : <><FaSave/> {editingServiceId ? 'Update Service' : 'Launch Service'}</>}
        </button>
      </div>

      {/* SERVICE CATALOG */}
      <div className="mt-20">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8 border-b pb-2">Live Service Catalog</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(s => (
                <div key={s.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative group hover:shadow-lg transition-all">
                    <div className="flex items-center gap-4 mb-4">
                        <span className="text-3xl text-green-600">
                            {s.icon === 'FaTooth' ? <FaTooth/> : s.icon === 'FaEye' ? <FaEye/> : s.icon === 'FaStethoscope' ? <FaStethoscope/> : <FaHeartbeat/>}
                        </span>
                        <div>
                            <h4 className="font-black text-slate-800 leading-tight">{s.name}</h4>
                            <span className="text-[9px] font-black uppercase text-green-600 bg-green-50 px-2 py-0.5 rounded-md">{s.category}</span>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-4 mb-6">{s.description}</p>
                    <div className="flex gap-2 pt-4 border-t border-slate-50 justify-end">
                        <button onClick={() => {
                            setEditingServiceId(s.id); setServiceName(s.name); setServiceDescription(s.description);
                            setServiceCategory(s.category); setServiceIcon(s.icon);
                            formRef.current?.scrollIntoView({ behavior: 'smooth' });
                        }} className="p-2 text-slate-400 hover:text-green-600 transition-colors"><FaEdit/></button>
                        <button onClick={() => deleteDoc(doc(db, "health_services", s.id))} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><FaTrash/></button>
                    </div>
                </div>
            ))}
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}