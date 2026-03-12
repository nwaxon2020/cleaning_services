"use client";

import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { db, storage } from '@/lib/firebase';
import { 
  collection, addDoc, query, orderBy, onSnapshot, 
  serverTimestamp, doc, updateDoc, deleteDoc, setDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  FaPlus, FaTrash, FaPaintBrush, 
  FaSpinner, FaExclamationTriangle, 
  FaTag, FaHome, FaPalette, FaSave,
  FaUpload, FaTimes, FaSearchPlus, FaGlobe
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// --- SUB-COMPONENT: Optimized & Equal Height Service Card ---
const ServiceCard = memo(({ item, onEdit, onDelete, onImageClick }: any) => (
  <div className="group border border-slate-200 rounded-lg overflow-hidden hover:border-purple-400 transition-all bg-white shadow-sm flex flex-col h-full">
    {item.imageUrl && (
      <div 
        className="aspect-square w-full bg-slate-100 relative overflow-hidden cursor-zoom-in" 
        onClick={() => onImageClick(item.imageUrl)}
      >
        <img 
          src={item.imageUrl} 
          alt={item.name} 
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <FaSearchPlus className="text-white text-xl" />
        </div>
      </div>
    )}
    <div className="p-3 flex-1 flex flex-col">
      <div className="flex justify-between items-start mb-1">
        <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-tight line-clamp-1">{item.name}</h5>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => onEdit(item)} className="text-[10px] text-purple-600 hover:underline font-black uppercase tracking-tighter">Edit</button>
          <button onClick={() => onDelete(item)} className="text-red-400 hover:text-red-600 transition-colors">
            <FaTrash size={10} />
          </button>
        </div>
      </div>
      
      <p className="text-[10px] text-slate-500 line-clamp-2 mb-3 italic leading-tight">
        {item.description || "No description provided."}
      </p>

      <div className="mt-auto pt-2 border-t border-slate-50 flex items-baseline gap-1">
        <span className="text-sm font-black text-slate-900 italic">£{item.priceRange}</span>
        {item.pricePer && <span className="text-[8px] text-slate-400 font-bold uppercase">{item.pricePer}</span>}
      </div>
    </div>
  </div>
));
ServiceCard.displayName = "ServiceCard";

export default function DecorationMasterEditor() {
  const formRef = useRef<HTMLDivElement>(null);

  // --- STATES ---
  const [headerText, setHeaderText] = useState('Decoration Services – Painting, Tiles, Flooring & Wall Decor');
  const [categories, setCategories] = useState<any[]>([]);
  const [serviceItems, setServiceItems] = useState<any[]>([]);
  const [selectedFullImage, setSelectedFullImage] = useState<string | null>(null);
  
  // Category States
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('');
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  // Item Form States
  const [itemName, setItemName] = useState('');
  const [itemPriceRange, setItemPriceRange] = useState('');
  const [itemPricePer, setItemPricePer] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemDetails, setItemDetails] = useState<string[]>([]);
  const [itemImageType, setItemImageType] = useState<'url' | 'file'>('url');
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [itemImageFile, setItemImageFile] = useState<File | null>(null);
  const [itemImagePreview, setItemImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{id: string, type: string, name: string} | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, "settings", "decoration_config"), (snap) => {
      if (snap.exists()) setHeaderText(snap.data().headerText);
    });
    const unsubCategories = onSnapshot(query(collection(db, "decoration_categories"), orderBy("createdAt", "desc")), (snap) => {
      setCategories(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });
    const unsubItems = onSnapshot(query(collection(db, "decoration_items"), orderBy("createdAt", "desc")), (snap) => {
      setServiceItems(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });
    return () => { unsubConfig(); unsubCategories(); unsubItems(); };
  }, []);

  // --- LOGIC FUNCTIONS ---
  const resetForm = () => {
    setItemName(''); setItemPriceRange(''); setItemPricePer(''); setItemCategory('');
    setItemDescription(''); setItemDetails([]); setItemImageUrl('');
    setItemImageFile(null); setItemImagePreview(null); setItemImageType('url');
    setEditingItemId(null);
  };

  const handleEditItem = (item: any) => {
    setEditingItemId(item.id);
    setItemName(item.name);
    setItemPriceRange(item.priceRange);
    setItemPricePer(item.pricePer || '');
    setItemCategory(item.categoryId || '');
    setItemDescription(item.description || '');
    setItemDetails(item.details || []);
    setItemImageUrl(item.imageUrl || '');
    setItemImagePreview(item.imageUrl || null);
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAddCategory = async () => {
    if (!categoryName) return toast.error("Enter name");
    try {
      await addDoc(collection(db, "decoration_categories"), {
        name: categoryName, icon: categoryIcon || 'FaPaintBrush', createdAt: serverTimestamp()
      });
      setCategoryName(''); setCategoryIcon(''); setShowCategoryForm(false);
      toast.success("Category Added");
    } catch (e) { toast.error("Error creating category"); }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      const colMap: Record<string, string> = { category: 'decoration_categories', item: 'decoration_items' };
      await deleteDoc(doc(db, colMap[deleteTarget.type], deleteTarget.id));
      toast.success("Removed");
      if (deleteTarget.type === 'item' && editingItemId === deleteTarget.id) resetForm();
      setDeleteTarget(null);
    } catch (e) { toast.error("Failed to delete"); }
  };

  const handleAddItem = async () => {
    if (!itemName || !itemPriceRange || !itemCategory) return toast.error("Fill required fields");
    setUploadingImage(true);
    try {
      let finalImageUrl = itemImageUrl;
      if (itemImageType === 'file' && itemImageFile) {
        const storageRef = ref(storage, `decoration_services/${Date.now()}_${itemImageFile.name}`);
        const snapshot = await uploadBytes(storageRef, itemImageFile);
        finalImageUrl = await getDownloadURL(snapshot.ref);
      }
      const itemData = {
        name: itemName, priceRange: itemPriceRange, pricePer: itemPricePer,
        categoryId: itemCategory, description: itemDescription,
        details: itemDetails, imageUrl: finalImageUrl || '', updatedAt: serverTimestamp()
      };
      if (editingItemId) await updateDoc(doc(db, "decoration_items", editingItemId), itemData);
      else await addDoc(collection(db, "decoration_items"), { ...itemData, createdAt: serverTimestamp() });
      toast.success("Service Saved"); resetForm();
    } catch (e) { toast.error("Error saving"); }
    finally { setUploadingImage(false); }
  };

  const saveGlobalConfig = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "settings", "decoration_config"), { headerText, updatedAt: serverTimestamp() });
      toast.success("Header Updated");
    } catch (e) { toast.error("Update failed"); }
    finally { setLoading(false); }
  };

  const groupedItems = useMemo(() => {
    return categories.map(cat => ({
      ...cat,
      items: serviceItems.filter(item => item.categoryId === cat.id)
    })).filter(cat => cat.items.length > 0);
  }, [categories, serviceItems]);

  const getIcon = (name: string) => {
    switch(name) {
      case 'FaPaintBrush': return <FaPaintBrush />;
      case 'FaHome': return <FaHome />;
      case 'FaPalette': return <FaPalette />;
      default: return <FaTag />;
    }
  };

  if(loading){
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className='w-12 h-12 border-4 border-purple-500 border-t-transparent animate-spin rounded-full'></div>
        </div>
    )
  };

  return (
    <div className="mx-auto p-4 md:p-8 bg-white min-h-screen text-slate-800 pb-32 max-w-7xl">
      <h1 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter mb-8 border-b-2 border-slate-900 pb-2 inline-block">Decoration <span className="text-purple-600">Editor</span></h1>

      {/* LIGHTBOX */}
      <AnimatePresence>
        {selectedFullImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedFullImage(null)} className="fixed inset-0 z-[3000] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out">
            <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} src={selectedFullImage} className="max-w-full max-h-full rounded-lg" />
            <button className="absolute top-6 right-6 text-white text-3xl"><FaTimes /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE MODAL */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white max-w-xs w-full p-6 rounded-lg text-center shadow-2xl">
              <FaExclamationTriangle className="text-red-500 text-3xl mx-auto mb-3" />
              <p className="text-[10px] font-black uppercase">Delete {deleteTarget.name}?</p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 bg-slate-100 rounded-md font-bold text-[10px] uppercase">Cancel</button>
                <button onClick={executeDelete} className="flex-1 py-2 bg-red-600 text-white rounded-md font-bold text-[10px] uppercase">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GLOBAL HEADER CONFIG */}
      <div className="p-4 bg-purple-900 text-white rounded-lg shadow-lg mb-10 border-b-4 border-purple-600">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full space-y-1">
            <label className="text-[9px] font-black uppercase text-purple-300">Section Header Text</label>
            <input value={headerText} onChange={(e)=>setHeaderText(e.target.value)} className="w-full bg-purple-800 border rounded p-2 text-sm outline-none font-bold text-white" />
          </div>
          <button onClick={saveGlobalConfig} className="bg-purple-600 px-6 py-2 rounded text-xs font-black uppercase flex items-center gap-2 hover:bg-purple-500 transition-colors">
             <FaSave/> Save Header
          </button>
        </div>
      </div>

      {/* CATEGORY MANAGEMENT SECTION */}
      <div className="p-4 bg-slate-50 border rounded-xl mb-10">
        <h3 className="text-[11px] font-black uppercase text-slate-400 mb-4 flex items-center gap-2">
            <FaTag className="text-purple-600"/> Categories List
        </h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(cat => (
            <div key={cat.id} className="px-3 py-1.5 bg-white border rounded-full flex items-center gap-2 text-[10px] font-black uppercase text-slate-600">
              {getIcon(cat.icon)} {cat.name}
              <button onClick={() => setDeleteTarget({id: cat.id, type: 'category', name: cat.name})} className="text-red-400 hover:text-red-600 transition-colors"><FaTrash size={10}/></button>
            </div>
          ))}
          <button onClick={() => setShowCategoryForm(!showCategoryForm)} className="px-4 py-1.5 bg-purple-600 text-white rounded-full text-[10px] font-black uppercase tracking-tighter">
            {showCategoryForm ? 'Cancel' : 'Add New Category'}
          </button>
          
        </div>
        {showCategoryForm && (
          <div className="grid md:grid-cols-3 gap-2 p-3 bg-white border rounded-lg">
            <input value={categoryName} onChange={(e)=>setCategoryName(e.target.value)} placeholder="e.g. Tiles" className="p-2 border rounded text-xs outline-none" />
            <select value={categoryIcon} onChange={(e)=>setCategoryIcon(e.target.value)} className="p-2 border rounded text-xs outline-none">
              <option value="FaPaintBrush">Painting Icon</option>
              <option value="FaHome">Home Icon</option>
              <option value="FaPalette">Palette Icon</option>
            </select>
            <button onClick={handleAddCategory} className="bg-purple-600 text-white rounded font-black text-[10px] uppercase py-2">Create Category</button>
          </div>
        )}
      </div>

      {/* SMART SERVICE FORM */}
      <div ref={formRef} className="p-6 bg-slate-50 border rounded-xl mb-16 shadow-sm">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Select image button */}
          <div className="md:col-span-1 space-y-3">
            {/* Toggle Buttons */}
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => setItemImageType('url')} 
                className={`flex-1 py-1.5 rounded-md text-[9px] font-black uppercase border-2 transition-all ${itemImageType === 'url' ? 'border-purple-600 bg-white text-purple-600' : 'border-slate-100 text-slate-400'}`}
              >
                <FaGlobe className="inline mr-1"/> URL
              </button>
              <button 
                type="button"
                onClick={() => setItemImageType('file')} 
                className={`flex-1 py-1.5 rounded-md text-[9px] font-black uppercase border-2 transition-all ${itemImageType === 'file' ? 'border-purple-600 bg-white text-purple-600' : 'border-slate-100 text-slate-400'}`}
              >
                <FaUpload className="inline mr-1"/> File
              </button>
            </div>

            {/* Dynamic Preview/Input Area */}
            <div className="space-y-3">
              {itemImagePreview ? (
                <div className="relative aspect-square bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                  <img src={itemImagePreview} className="w-full h-full object-cover" alt="Preview" />
                  <button 
                    type="button"
                    onClick={() => {
                      setItemImagePreview(null); 
                      setItemImageFile(null); 
                      setItemImageUrl('');
                    }} 
                    className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow-lg hover:bg-red-700 transition-colors"
                  >
                    <FaTimes size={10}/>
                  </button>
                </div>
              ) : (
                <>
                  {itemImageType === 'url' ? (
                    <div className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center p-4">
                      <FaGlobe className="text-slate-300 mb-2 text-xl" />
                      <input 
                        value={itemImageUrl} 
                        onChange={(e)=> {
                          setItemImageUrl(e.target.value); 
                          setItemImagePreview(e.target.value);
                        }} 
                        placeholder="Paste Image URL here..." 
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold outline-none focus:border-purple-400 text-center" 
                      />
                    </div>
                  ) : (
                    <label className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all group">
                      <FaUpload className="text-slate-300 mb-2 text-xl group-hover:text-purple-500" />
                      <span className="text-[10px] font-black text-slate-400 uppercase group-hover:text-purple-600">Click to upload file</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if(file) {
                            setItemImageFile(file);
                            const reader = new FileReader();
                            reader.onloadend = () => setItemImagePreview(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }} 
                      />
                    </label>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="md:col-span-2 grid grid-cols-2 gap-3">
            <input value={itemName} onChange={(e)=>setItemName(e.target.value)} placeholder="Service Name" className="col-span-2 p-3 bg-white border rounded-md text-sm font-bold outline-none focus:border-purple-400" />
            <input value={itemPriceRange} onChange={(e)=>setItemPriceRange(e.target.value)} placeholder="Price (£)" className="p-3 bg-white border rounded-md text-sm outline-none" />
            <input value={itemPricePer} onChange={(e)=>setItemPricePer(e.target.value)} placeholder="Unit (e.g. per m²)" className="p-3 bg-white border rounded-md text-sm outline-none" />
            <select value={itemCategory} onChange={(e)=>setItemCategory(e.target.value)} className="col-span-2 p-3 bg-white border rounded-md text-sm outline-none">
              <option value="">Select Category</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
            <textarea value={itemDescription} onChange={(e)=>setItemDescription(e.target.value)} placeholder="Service Description..." className="col-span-2 p-3 bg-white border rounded-md text-sm outline-none h-24 resize-none" />
          </div>
        </div>
        <button onClick={handleAddItem} disabled={uploadingImage} className="w-full mt-6 py-3 bg-slate-900 text-white rounded-md font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-purple-600 shadow-lg disabled:opacity-50">
          {uploadingImage ? <FaSpinner className="animate-spin" /> : <FaPlus/>} {editingItemId ? 'Update Decoration Service' : 'Add to Inventory'}
        </button>
      </div>

      {/* DISPLAY GRID */}
      <div className="space-y-16">
        {groupedItems.map(cat => (
          <div key={cat.id}>
            <div className="flex items-center gap-3 mb-6 border-b pb-1">
               <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">{cat.name}</h4>
               <span className="h-px bg-slate-100 flex-1"></span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 items-stretch">
              {cat.items.map((item: any) => (
                <ServiceCard key={item.id} item={item} onEdit={handleEditItem} onDelete={(i: any) => setDeleteTarget({id: i.id, type: 'item', name: i.name})} onImageClick={setSelectedFullImage} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}