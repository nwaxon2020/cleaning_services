"use client";

import { useState, useEffect, useRef } from 'react';
import { db, storage } from '@/lib/firebase';
import { 
  collection, addDoc, query, orderBy, onSnapshot, 
  serverTimestamp, doc, updateDoc, deleteDoc, setDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  FaPlus, FaTrash, FaImage, FaPaintBrush, FaGlobe, 
  FaCloudUploadAlt, FaSpinner, FaSave, FaExclamationTriangle, 
  FaCheckCircle, FaTag, FaBox, FaRuler, FaHome, FaPalette,
  FaUpload, FaTimes
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function DecorationMasterEditor() {
  const formRef = useRef<HTMLDivElement>(null);

  // --- SECTION 1: GLOBAL HEADER STATES ---
  const [headerText, setHeaderText] = useState('Decoration Services – Painting, Tiles, Flooring & Wall Decor');

  // --- SECTION 2: SERVICE CATEGORIES ---
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('');
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  // --- SECTION 3: SERVICE ITEMS STATES ---
  const [itemName, setItemName] = useState('');
  const [itemPriceRange, setItemPriceRange] = useState('');
  const [itemPricePer, setItemPricePer] = useState(''); // e.g., "per m²", "per room", "per day"
  const [itemCategory, setItemCategory] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemDetails, setItemDetails] = useState<string[]>([]);
  const [newDetail, setNewDetail] = useState('');
  
  // Image states for each service
  const [itemImageType, setItemImageType] = useState<'url' | 'file'>('url');
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [itemImageFile, setItemImageFile] = useState<File | null>(null);
  const [itemImagePreview, setItemImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // --- SECTION 4: SERVICE ITEMS LIST ---
  const [serviceItems, setServiceItems] = useState<any[]>([]);

  // --- UI STATES ---
  const [deleteTarget, setDeleteTarget] = useState<{id: string, type: string, name: string} | null>(null);
  const [loading, setLoading] = useState(false);

  // --- DATA FETCHING ---
  useEffect(() => {
    // Header & Global Settings
    const unsubConfig = onSnapshot(doc(db, "settings", "decoration_config"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setHeaderText(data.headerText || 'Decoration Services – Painting, Tiles, Flooring & Wall Decor');
      }
    });

    // Decoration Categories
    const qCategories = query(collection(db, "decoration_categories"), orderBy("createdAt", "desc"));
    const unsubCategories = onSnapshot(qCategories, (snap) => setCategories(snap.docs.map(d => ({id: d.id, ...d.data()}))));

    // Service Items
    const qItems = query(collection(db, "decoration_items"), orderBy("createdAt", "desc"));
    const unsubItems = onSnapshot(qItems, (snap) => setServiceItems(snap.docs.map(d => ({id: d.id, ...d.data()}))));

    return () => { 
      unsubConfig(); 
      unsubCategories(); 
      unsubItems(); 
    };
  }, []);

  // --- LOGIC: GLOBAL CONFIG (Header) ---
  const saveGlobalConfig = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "settings", "decoration_config"), {
        headerText, updatedAt: serverTimestamp()
      });
      toast.success("Decoration Header Updated!");
    } catch (e) { toast.error("Update failed"); }
    finally { setLoading(false); }
  };

  // --- LOGIC: CATEGORY MANAGEMENT ---
  const handleAddCategory = async () => {
    if (!categoryName) return toast.error("Enter category name");
    try {
      await addDoc(collection(db, "decoration_categories"), {
        name: categoryName,
        icon: categoryIcon || 'FaPaintBrush',
        createdAt: serverTimestamp()
      });
      setCategoryName('');
      setCategoryIcon('');
      setShowCategoryForm(false);
      toast.success("Category added");
    } catch (e) { toast.error("Error adding category"); }
  };

  // --- LOGIC: IMAGE HANDLING FOR SERVICE ITEM ---
  const handleItemImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setItemImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => { setItemImagePreview(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const clearItemImage = () => {
    setItemImageUrl('');
    setItemImageFile(null);
    setItemImagePreview(null);
  };

  // --- LOGIC: ADD DETAIL POINT TO ITEM ---
  const addDetail = () => {
    if (newDetail.trim()) {
      setItemDetails([...itemDetails, newDetail]);
      setNewDetail('');
    }
  };

  const removeDetail = (index: number) => {
    setItemDetails(itemDetails.filter((_, i) => i !== index));
  };

  // --- LOGIC: SERVICE ITEM MANAGEMENT ---
  const handleAddItem = async () => {
    if (!itemName) return toast.error("Enter service name");
    if (!itemPriceRange) return toast.error("Enter price range");
    if (!itemCategory) return toast.error("Select a category");
    
    setUploadingImage(true);
    try {
      let finalImageUrl = itemImageUrl;
      
      // Upload image if file is selected
      if (itemImageType === 'file' && itemImageFile) {
        const storageRef = ref(storage, `decoration_services/${Date.now()}_${itemImageFile.name}`);
        const snapshot = await uploadBytes(storageRef, itemImageFile);
        finalImageUrl = await getDownloadURL(snapshot.ref);
      }
      
      const selectedCategory = categories.find(c => c.id === itemCategory);
      
      const itemData = {
        name: itemName,
        priceRange: itemPriceRange,
        pricePer: itemPricePer || '',
        categoryId: itemCategory,
        categoryName: selectedCategory?.name || '',
        description: itemDescription,
        details: itemDetails,
        imageUrl: finalImageUrl || '',
        updatedAt: serverTimestamp()
      };

      if (editingItemId) {
        await updateDoc(doc(db, "decoration_items", editingItemId), itemData);
        toast.success("Service updated");
      } else {
        await addDoc(collection(db, "decoration_items"), {
          ...itemData,
          createdAt: serverTimestamp()
        });
        toast.success("Service added");
      }
      
      // Reset form
      resetForm();
    } catch (e) { 
      console.error(e);
      toast.error("Error saving service"); 
    } finally {
      setUploadingImage(false);
    }
  };

  const resetForm = () => {
    setItemName('');
    setItemPriceRange('');
    setItemPricePer('');
    setItemCategory('');
    setItemDescription('');
    setItemDetails([]);
    setNewDetail('');
    setItemImageUrl('');
    setItemImageFile(null);
    setItemImagePreview(null);
    setItemImageType('url');
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

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      const colMap: any = { 
        category: 'decoration_categories', 
        item: 'decoration_items' 
      };
      await deleteDoc(doc(db, colMap[deleteTarget.type], deleteTarget.id));
      toast.success("Item removed");
      setDeleteTarget(null);
      
      if (deleteTarget.type === 'item' && editingItemId === deleteTarget.id) {
        resetForm();
      }
    } catch (e) { toast.error("Delete failed"); }
  };

  // Helper to get icon component
  const getCategoryIcon = (iconName: string) => {
    switch(iconName) {
      case 'FaPaintBrush': return <FaPaintBrush />;
      case 'FaHome': return <FaHome />;
      case 'FaPalette': return <FaPalette />;
      default: return <FaTag />;
    }
  };

  return (
    <div className="mx-auto p-3 pt-5 md:p-6 bg-white min-h-screen text-slate-900 pb-32">
      <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter mb-8">Decoration <span className="text-purple-600">Services Editor</span></h1>

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
      <div className="p-4 md:p-6 bg-purple-900 text-white rounded-xl shadow-xl mb-10 border-b-4 border-purple-600">
        <div className="grid md:grid-cols-3 gap-6 items-end">
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black uppercase text-purple-300">Section Header Text</label>
            <input value={headerText} onChange={(e)=>setHeaderText(e.target.value)} className="w-full bg-purple-800 border-b border-purple-700 p-2 outline-none focus:border-purple-400 font-bold" />
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
                <button onClick={saveGlobalConfig} className="w-full bg-purple-600 p-3 rounded-xl hover:bg-purple-500 transition-all flex items-center justify-center gap-2">
                    {loading ? <FaSpinner className="animate-spin" /> : <><FaSave/> Save Header</>}
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: CATEGORIES MANAGER */}
      <div className="mb-10">
        <div className="p-4 md:p-6 bg-slate-50 border border-slate-100 rounded-xl">
          <h3 className="text-sm font-black uppercase italic mb-6 flex items-center gap-2"><FaTag className="text-purple-600"/> Service Categories</h3>
          
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
                <div className="space-y-3">
                  <input 
                    value={categoryName} 
                    onChange={(e) => setCategoryName(e.target.value)} 
                    placeholder="e.g. Painting, Tiling, Flooring" 
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs outline-none" 
                  />
                  <select
                    value={categoryIcon}
                    onChange={(e) => setCategoryIcon(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs outline-none"
                  >
                    <option value="">Select Icon</option>
                    <option value="FaPaintBrush">Paint Brush (Painting)</option>
                    <option value="FaHome">Home (Flooring)</option>
                    <option value="FaPalette">Palette (Wall Decor)</option>
                  </select>
                  <button 
                    onClick={handleAddCategory} 
                    className="w-full bg-purple-600 text-white p-3 rounded-xl hover:bg-purple-700 flex items-center justify-center gap-2"
                  >
                    <FaPlus/> Create Category
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {categories.map(cat => (
              <div key={cat.id} className="px-3 py-2 bg-white border border-slate-200 rounded-lg flex items-center gap-2">
                <span className="text-purple-600 text-sm">
                  {getCategoryIcon(cat.icon)}
                </span>
                <span className="text-xs font-black uppercase text-slate-600">{cat.name}</span>
                <button 
                  onClick={() => setDeleteTarget({id: cat.id, type: 'category', name: cat.name})} 
                  className="text-red-400 hover:text-red-600 transition-colors ml-1"
                >
                  <FaTrash size={10}/>
                </button>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-6 w-full">No categories yet. Create your first category above.</p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: SERVICE ITEMS EDITOR */}
      <div ref={formRef} className="p-4 md:p-8 bg-purple-50 border-2 border-purple-100 rounded-xl shadow-inner mb-16">
        <h3 className="md:text-xl font-black uppercase italic mb-6 flex items-center gap-3">
            <FaBox className="text-purple-600"/> {editingItemId ? 'Edit Decoration Service' : 'Add New Decoration Service'}
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Service Image */}
          <div className="space-y-3 md:col-span-2">
            <label className="text-[10px] font-black uppercase text-slate-500">Service Image</label>
            
            <AnimatePresence>
              {itemImagePreview && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-full h-48 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 mb-3">
                  <img src={itemImagePreview} className="w-full h-full object-cover" alt="Preview" />
                  <button onClick={clearItemImage} className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-lg">
                    <FaTimes size={12} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-2 mb-3">
              <button onClick={()=>setItemImageType('url')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase border-2 ${itemImageType === 'url' ? 'border-purple-600 bg-white' : 'border-slate-200'}`}><FaGlobe className="inline mr-2"/> URL</button>
              <button onClick={()=>setItemImageType('file')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase border-2 ${itemImageType === 'file' ? 'border-purple-600 bg-white' : 'border-slate-200'}`}><FaUpload className="inline mr-2"/> Upload</button>
            </div>

            {itemImageType === 'url' ? (
              <input 
                value={itemImageUrl} 
                onChange={(e) => {
                  setItemImageUrl(e.target.value);
                  setItemImagePreview(e.target.value);
                }} 
                placeholder="https://example.com/service-image.jpg" 
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs outline-none" 
              />
            ) : (
              <input 
                type="file" 
                accept="image/*"
                onChange={handleItemImageFileChange} 
                className="w-full p-2 bg-white border border-dashed rounded-xl text-xs" 
              />
            )}
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black uppercase text-slate-500">Service Name</label>
            <input 
              value={itemName} 
              onChange={(e) => setItemName(e.target.value)} 
              placeholder="e.g. Interior Wall Painting, Ceramic Tiling, Laminate Flooring" 
              className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-purple-500" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500">Price Range (£)</label>
            <input 
              type="text" 
              value={itemPriceRange} 
              onChange={(e) => setItemPriceRange(e.target.value)} 
              placeholder="e.g. 15-25, 40-160, 150-350" 
              className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-purple-500" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500">Pricing Unit</label>
            <input 
              type="text" 
              value={itemPricePer} 
              onChange={(e) => setItemPricePer(e.target.value)} 
              placeholder="e.g. per m², per room, per day" 
              className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-purple-500" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500">Category</label>
            <select 
              value={itemCategory} 
              onChange={(e) => setItemCategory(e.target.value)} 
              className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-purple-500"
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black uppercase text-slate-500">Short Description</label>
            <input 
              value={itemDescription} 
              onChange={(e) => setItemDescription(e.target.value)} 
              placeholder="Brief overview of this service" 
              className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-purple-500" 
            />
          </div>

          {/* Key Details / Bullet Points */}
          <div className="space-y-3 md:col-span-2">
            <label className="text-[10px] font-black uppercase text-slate-500">Key Details (bullet points)</label>
            <div className="flex gap-2">
              <input 
                value={newDetail} 
                onChange={(e) => setNewDetail(e.target.value)} 
                placeholder="e.g. Professional painters with 10+ years experience" 
                className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-purple-500" 
                onKeyDown={(e) => e.key === 'Enter' && addDetail()}
              />
              <button 
                onClick={addDetail} 
                className="px-6 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
              >
                <FaPlus/>
              </button>
            </div>

            {/* Display Details */}
            <div className="space-y-2 mt-4">
              {itemDetails.map((detail, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg group">
                  <div className="flex items-center gap-3">
                    <FaCheckCircle className="text-green-500 text-xs" />
                    <span className="text-sm text-slate-700">{detail}</span>
                  </div>
                  <button 
                    onClick={() => removeDetail(idx)} 
                    className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              ))}
              {itemDetails.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-4">Add key details about this service (pricing notes, experience, materials, etc.)</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button 
            onClick={handleAddItem} 
            disabled={uploadingImage}
            className="flex-1 py-4 bg-purple-600 text-white rounded-xl font-black uppercase italic tracking-widest hover:bg-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {uploadingImage ? <FaSpinner className="animate-spin" /> : <FaPlus/>} {editingItemId ? 'Update Service' : 'Add to Services'}
          </button>
          
          {editingItemId && (
            <button 
              onClick={resetForm} 
              className="py-4 px-8 bg-slate-500 text-white rounded-xl font-black uppercase italic tracking-widest hover:bg-slate-600 transition-all"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* SECTION 4: SERVICE ITEMS DISPLAY */}
      <div className="mt-10">
        <h3 className="text-xl font-black uppercase italic mb-6 flex items-center gap-3">
            <FaCheckCircle className="text-green-500"/> Current Decoration Services
        </h3>
        
        <div className="grid grid-cols-1 gap-6">
          {categories.map(cat => {
            const catItems = serviceItems.filter(item => item.categoryId === cat.id);
            if (catItems.length === 0) return null;
            
            return (
              <div key={cat.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="p-4 bg-gradient-to-r from-purple-50 to-slate-50 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-600 text-lg">
                      {getCategoryIcon(cat.icon)}
                    </span>
                    <h4 className="text-sm font-black uppercase text-purple-600">{cat.name}</h4>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-4 p-2 md:p-4 max-h-[700px] overflow-y-auto custom-scrollbar">
                  {catItems.map(item => (
                    <div key={item.id} className="my-2 border border-blue-300 md:rounded-lg overflow-hidden hover:border-purple-200 transition-all">
                      {item.imageUrl && (
                        <div className="aspect-video w-full bg-slate-100">
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="p-3">
                        <div className="flex flex-col md:flex-row justify-between items-start mb-2">
                          <h5 className="text-sm font-bold text-slate-800">{item.name}</h5>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleEditItem(item)} 
                              className="text-xs text-purple-600 hover:text-purple-800 font-bold"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => setDeleteTarget({id: item.id, type: 'item', name: item.name})} 
                              className="text-red-400 hover:text-red-600"
                            >
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="mb-2">
                          <span className="text-lg font-black text-green-600">£{item.priceRange}</span>
                          {item.pricePer && (
                            <span className="text-xs text-slate-500 ml-1">{item.pricePer}</span>
                          )}
                        </div>
                        
                        {item.description && (
                          <p className="text-xs text-slate-600 mb-2 italic">{item.description}</p>
                        )}
                        
                        {item.details && item.details.length > 0 && (
                          <div className="space-y-1 mt-2">
                            {item.details.slice(0, 2).map((detail: string, i: number) => (
                              <div key={i} className="flex items-start gap-2">
                                <FaCheckCircle className="text-green-500 text-[8px] mt-1" />
                                <span className="text-[9px] text-slate-500">{detail}</span>
                              </div>
                            ))}
                            {item.details.length > 2 && (
                              <span className="text-[8px] text-purple-600 font-bold">+{item.details.length - 2} more details</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          
          {/* Uncategorized items */}
          {serviceItems.filter(item => !item.categoryId).length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200">
                <h4 className="text-sm font-black uppercase text-slate-500">Uncategorized</h4>
              </div>
              <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                {serviceItems.filter(item => !item.categoryId).map(item => (
                  <div key={item.id} className="border border-slate-100 rounded-lg overflow-hidden">
                    {item.imageUrl && (
                      <div className="aspect-video w-full bg-slate-100">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="text-sm font-bold text-slate-800">{item.name}</h5>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEditItem(item)} className="text-xs text-purple-600 hover:text-purple-800 font-bold">Edit</button>
                          <button onClick={() => setDeleteTarget({id: item.id, type: 'item', name: item.name})} className="text-red-400 hover:text-red-600"><FaTrash size={12} /></button>
                        </div>
                      </div>
                      <div className="mb-2">
                        <span className="text-lg font-black text-green-600">£{item.priceRange}</span>
                        {item.pricePer && <span className="text-xs text-slate-500 ml-1">{item.pricePer}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {serviceItems.length === 0 && (
          <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <FaHome className="text-4xl text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 font-bold">No decoration services yet. Add your first service above.</p>
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