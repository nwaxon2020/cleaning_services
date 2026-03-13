"use client";

import { useState, useEffect, useRef } from 'react';
import { db, storage } from '@/lib/firebase';
import { 
  collection, addDoc, query, orderBy, onSnapshot, 
  serverTimestamp, doc, updateDoc, deleteDoc, setDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  FaPlus, FaTrash, FaImage, FaGlobe, 
  FaCloudUploadAlt, FaSpinner, FaSave, FaExclamationTriangle, FaCheckCircle, FaTag, FaBox
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function RentingMasterEditor() {
  const formRef = useRef<HTMLDivElement>(null);

  // --- SECTION 1: GLOBAL HEADER & SLIDESHOW STATES ---
  const [headerText, setHeaderText] = useState('Renting Services – Market Prices');
  const [slides, setSlides] = useState<any[]>([]);
  const [slideUrl, setSlideUrl] = useState('');
  const [slideFile, setSlideFile] = useState<File | null>(null);
  const [imageType, setImageType] = useState<'url' | 'file'>('url');
  const [uploadingSlide, setUploadingSlide] = useState(false);

  // --- SECTION 2: RENTAL CATEGORIES ---
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  // --- SECTION 3: RENTAL ITEMS STATES ---
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // --- SECTION 4: RENTAL ITEMS LIST ---
  const [rentalItems, setRentalItems] = useState<any[]>([]);

  // --- UI STATES ---
  const [deleteTarget, setDeleteTarget] = useState<{id: string, type: string, name: string} | null>(null);
  const [loading, setLoading] = useState(false);

  // --- DATA FETCHING ---
  useEffect(() => {
    // Header & Global Settings
    const unsubConfig = onSnapshot(doc(db, "settings", "renting_config"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setHeaderText(data.headerText || 'Renting Services – Market Prices');
      }
    });

    // Slideshow
    const qSlides = query(collection(db, "renting_slides"), orderBy("createdAt", "desc"));
    const unsubSlides = onSnapshot(qSlides, (snap) => setSlides(snap.docs.map(d => ({id: d.id, ...d.data()}))));

    // Rental Categories
    const qCategories = query(collection(db, "renting_categories"), orderBy("createdAt", "desc"));
    const unsubCategories = onSnapshot(qCategories, (snap) => setCategories(snap.docs.map(d => ({id: d.id, ...d.data()}))));

    // Rental Items
    const qItems = query(collection(db, "renting_items"), orderBy("createdAt", "desc"));
    const unsubItems = onSnapshot(qItems, (snap) => setRentalItems(snap.docs.map(d => ({id: d.id, ...d.data()}))));

    return () => { 
      unsubConfig(); 
      unsubSlides(); 
      unsubCategories(); 
      unsubItems(); 
    };
  }, []);

  // --- LOGIC: GLOBAL CONFIG (Header) ---
  const saveGlobalConfig = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "settings", "renting_config"), {
        headerText, updatedAt: serverTimestamp()
      });
      toast.success("Renting Header Updated!");
    } catch (e) { toast.error("Update failed"); }
    finally { setLoading(false); }
  };

  // --- LOGIC: SLIDESHOW UPLOAD ---
  const handleAddSlide = async () => {
    if (imageType === 'url' && !slideUrl) return toast.error("Enter URL");
    if (imageType === 'file' && !slideFile) return toast.error("Select File");

    setUploadingSlide(true);
    try {
      let finalUrl = slideUrl;
      if (imageType === 'file' && slideFile) {
        const sRef = ref(storage, `renting_slides/${Date.now()}_${slideFile.name}`);
        const snap = await uploadBytes(sRef, slideFile);
        finalUrl = await getDownloadURL(snap.ref);
      }
      await addDoc(collection(db, "renting_slides"), { url: finalUrl, createdAt: serverTimestamp() });
      setSlideUrl(''); setSlideFile(null);
      toast.success("Slide added to gallery");
    } catch (e) { toast.error("Upload failed"); }
    finally { setUploadingSlide(false); }
  };

  // --- LOGIC: CATEGORY MANAGEMENT ---
  const handleAddCategory = async () => {
    if (!categoryName) return toast.error("Enter category name");
    try {
      await addDoc(collection(db, "renting_categories"), {
        name: categoryName,
        createdAt: serverTimestamp()
      });
      setCategoryName('');
      setShowCategoryForm(false);
      toast.success("Category added");
    } catch (e) { toast.error("Error adding category"); }
  };

  // --- LOGIC: RENTAL ITEM MANAGEMENT ---
  const handleAddItem = async () => {
    if (!itemName) return toast.error("Enter item name");
    if (!itemPrice) return toast.error("Enter price");
    
    try {
      const selectedCategory = categories.find(c => c.id === itemCategory);
      
      if (editingItemId) {
        await updateDoc(doc(db, "renting_items", editingItemId), {
          name: itemName,
          price: parseFloat(itemPrice),
          categoryId: itemCategory,
          categoryName: selectedCategory?.name || '',
          description: itemDescription,
          updatedAt: serverTimestamp()
        });
        toast.success("Item updated");
      } else {
        await addDoc(collection(db, "renting_items"), {
          name: itemName,
          price: parseFloat(itemPrice),
          categoryId: itemCategory,
          categoryName: selectedCategory?.name || '',
          description: itemDescription,
          createdAt: serverTimestamp()
        });
        toast.success("Item added");
      }
      
      // Reset form
      setItemName('');
      setItemPrice('');
      setItemCategory('');
      setItemDescription('');
      setEditingItemId(null);
    } catch (e) { toast.error("Error saving item"); }
  };

  const handleEditItem = (item: any) => {
    setEditingItemId(item.id);
    setItemName(item.name);
    setItemPrice(item.price.toString());
    setItemCategory(item.categoryId || '');
    setItemDescription(item.description || '');
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      const colMap: any = { 
        slide: 'renting_slides', 
        category: 'renting_categories', 
        item: 'renting_items' 
      };
      await deleteDoc(doc(db, colMap[deleteTarget.type], deleteTarget.id));
      toast.success("Item removed");
      setDeleteTarget(null);
      
      if (deleteTarget.type === 'item' && editingItemId === deleteTarget.id) {
        setEditingItemId(null);
        setItemName('');
        setItemPrice('');
        setItemCategory('');
        setItemDescription('');
      }
    } catch (e) { toast.error("Delete failed"); }
  };

  return (
    <div className="mx-auto p-3 pt-5 md:p-6 bg-white min-h-screen text-slate-900 pb-32">
      <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter mb-8">Renting <span className="text-blue-600">Services Editor</span></h1>

      {/* DELETE MODAL */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[2000] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white max-w-sm w-full p-8 rounded-xl text-center shadow-xl">
              <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
              <h3 className="font-black uppercase italic mb-2">Remove {deleteTarget.type}?</h3>
              <p className="text-sm text-slate-500 mb-4">"{deleteTarget.name}" will be permanently deleted.</p>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 bg-slate-100 rounded-xl font-black uppercase text-[10px]">Cancel</button>
                <button onClick={executeDelete} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-black uppercase text-[10px]">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTION 1: HEADER */}
      <div className="p-6 bg-slate-900 text-white rounded-xl shadow-xl mb-10 border-b-4 border-blue-600">
        <div className="grid md:grid-cols-3 gap-6 items-end">
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black uppercase text-blue-400">Section Header Text</label>
            <input value={headerText} onChange={(e)=>setHeaderText(e.target.value)} className="w-full bg-slate-800 border-b border-slate-700 p-2 outline-none focus:border-blue-500 font-bold" />
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
                <button onClick={saveGlobalConfig} className="w-full bg-blue-600 p-3 rounded-xl hover:bg-blue-500 transition-all flex items-center justify-center gap-2">
                    {loading ? <FaSpinner className="animate-spin" /> : <><FaSave/> Save Header</>}
                </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-10 mb-16">
        {/* SECTION 2: SLIDESHOW MANAGER */}
        <div className="px-4 py-6 md:p-6 bg-slate-50 border border-slate-100 rounded-xl">
          <h3 className="text-sm font-black uppercase italic mb-6 flex items-center gap-2"><FaImage className="text-blue-600"/> Rental Gallery</h3>
          
          <div className="space-y-4 mb-8">
            <div className="flex gap-2 mb-4">
                <button onClick={()=>setImageType('url')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase border-2 ${imageType === 'url' ? 'border-blue-600 bg-white' : 'border-slate-200'}`}><FaGlobe className="inline mr-2"/> URL</button>
                <button onClick={()=>setImageType('file')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase border-2 ${imageType === 'file' ? 'border-blue-600 bg-white' : 'border-slate-200'}`}><FaCloudUploadAlt className="inline mr-2"/> File</button>
            </div>
            
            <div className="flex gap-2">
                {imageType === 'url' ? (
                    <input value={slideUrl || ""} onChange={(e)=>setSlideUrl(e.target.value)} placeholder="https://..." className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs outline-none" />
                ) : (
                    <input type="file" onChange={(e)=>setSlideFile(e.target.files?.[0] || null)} className="flex-1 p-2 bg-white border border-dashed rounded-xl text-xs" />
                )}
                <button onClick={handleAddSlide} disabled={uploadingSlide} className="bg-slate-900 text-white px-6 rounded-xl font-black uppercase text-[10px]">
                    {uploadingSlide ? <FaSpinner className="animate-spin" /> : 'Add'}
                </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {slides.map(slide => (
                <div key={slide.id} className="aspect-video bg-slate-200 rounded-xl relative group overflow-hidden">
                    <img src={slide.url || ""} className="w-full h-full object-cover" />
                    <button onClick={()=>setDeleteTarget({id: slide.id, type: 'slide', name: 'this slide'})} className="absolute top-1 right-1 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all scale-75">
                        <FaTrash size={10}/>
                    </button>
                </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: CATEGORIES MANAGER */}
        <div className="p-4 md:p-6 bg-slate-50 border border-slate-100 rounded-xl">
          <h3 className="text-sm font-black uppercase italic mb-6 flex items-center gap-2"><FaTag className="text-blue-600"/> Rental Categories</h3>
          
          <div className="mb-6">
            <button 
              onClick={() => setShowCategoryForm(!showCategoryForm)} 
              className="w-full py-3 bg-slate-200 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-slate-300 transition-all"
            >
              <FaPlus/> {showCategoryForm ? 'Close' : 'Add New Category'}
            </button>
          </div>

          <AnimatePresence>
            {showCategoryForm && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-6"
              >
                <div className="flex gap-2">
                  <input 
                    value={categoryName} 
                    onChange={(e) => setCategoryName(e.target.value)} 
                    placeholder="e.g. Charger Plates, Cutlery, etc." 
                    className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs outline-none" 
                  />
                  <button 
                    onClick={handleAddCategory} 
                    className="bg-blue-600 text-white px-4 rounded-xl hover:bg-blue-700"
                  >
                    <FaPlus/>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2 max-h-62 overflow-y-auto pr-2 custom-scrollbar">
            {categories.map(cat => (
              <div key={cat.id} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                <span className="text-xs font-black uppercase text-slate-600">{cat.name}</span>
                <button 
                  onClick={() => setDeleteTarget({id: cat.id, type: 'category', name: cat.name})} 
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <FaTrash size={12}/>
                </button>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-6">No categories yet. Create your first category above.</p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 4: RENTAL ITEMS EDITOR */}
      <div ref={formRef} className="p-4 md:p-8 bg-blue-50 border-2 border-blue-100 rounded-xl shadow-inner mb-16">
        <h3 className="text-xl font-black uppercase italic mb-6 flex items-center gap-3">
            <FaBox className="text-blue-600"/> {editingItemId ? 'Edit Rental Item' : 'Add New Rental Item'}
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500">Item Name</label>
            <input 
              value={itemName} 
              onChange={(e) => setItemName(e.target.value)} 
              placeholder="e.g. Charger Plate, Cutlery Set, Amala Bowl" 
              className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-500" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500">Price (£)</label>
            <input 
              type="number" 
              step="0.01"
              value={itemPrice} 
              onChange={(e) => setItemPrice(e.target.value)} 
              placeholder="0.00" 
              className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-500" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500">Category</label>
            <select 
              value={itemCategory} 
              onChange={(e) => setItemCategory(e.target.value)} 
              className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-500"
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500">Description / Notes (Optional)</label>
            <input 
              value={itemDescription} 
              onChange={(e) => setItemDescription(e.target.value)} 
              placeholder="e.g. Premium gold finish, per item" 
              className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-500" 
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={handleAddItem} 
            className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-black uppercase italic tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <FaPlus/> {editingItemId ? 'Update Item' : 'Add to Inventory'}
          </button>
          
          {editingItemId && (
            <button 
              onClick={() => {
                setEditingItemId(null);
                setItemName('');
                setItemPrice('');
                setItemCategory('');
                setItemDescription('');
              }} 
              className="py-4 px-8 bg-slate-500 text-white rounded-xl font-black uppercase italic tracking-widest hover:bg-slate-600 transition-all"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* SECTION 5: RENTAL ITEMS DISPLAY */}
      <div className="mt-10">
        <h1 className="text-xl font-black italic uppercase tracking-tighter mb-8">
          <span> Current <span className="text-blue-600">Rental Inventory</span></span> 
        </h1>

        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => {
            const catItems = rentalItems.filter(item => item.categoryId === cat.id);
            if (catItems.length === 0) return null;
            
            return (
              <div key={cat.id} className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm">
                <h4 className="text-sm font-black uppercase text-blue-600 mb-4 border-b border-slate-100 pb-2">{cat.name}</h4>
                <div className="max-h-[500px] overflow-y-auto space-y-2">
                  {catItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg group">
                      <div>
                        <span className="text-xs font-bold text-slate-800">{item.name}</span>
                        {item.description && (
                          <p className="text-[8px] text-slate-400 uppercase tracking-wider">{item.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-green-600">£{item.price}</span>
                        <button 
                          onClick={() => handleEditItem(item)} 
                          className="text-blue-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => setDeleteTarget({id: item.id, type: 'item', name: item.name})} 
                          className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <FaTrash size={12}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          
          {/* Uncategorized items */}
          {rentalItems.filter(item => !item.categoryId).length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <h4 className="text-sm font-black uppercase text-slate-500 mb-4 border-b border-slate-100 pb-2">Uncategorized</h4>
              <div className="space-y-2">
                {rentalItems.filter(item => !item.categoryId).map(item => (
                  <div key={item.id} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg group">
                    <div>
                      <span className="text-xs font-bold text-slate-800">{item.name}</span>
                      {item.description && (
                        <p className="text-[8px] text-slate-400 uppercase tracking-wider">{item.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-green-600">£{item.price}</span>
                      <button 
                        onClick={() => handleEditItem(item)} 
                        className="text-blue-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => setDeleteTarget({id: item.id, type: 'item', name: item.name})} 
                        className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <FaTrash size={12}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {rentalItems.length === 0 && (
          <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <FaBox className="text-4xl text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 font-bold">No rental items yet. Add your first item above.</p>
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}