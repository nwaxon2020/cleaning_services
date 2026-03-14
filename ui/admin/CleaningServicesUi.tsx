"use client";

import { useState, useEffect, useRef } from 'react';
import { db, storage } from '@/lib/firebase';
import { 
  collection, addDoc, query, orderBy, onSnapshot, 
  serverTimestamp, doc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  FaPlus, FaTrash, FaImage, FaListUl, FaGlobe, 
  FaCloudUploadAlt, FaChevronDown, FaSpinner, FaCheckSquare, FaEdit, FaTimes, FaMoneyBillWave, FaSave, FaExclamationTriangle, FaShieldAlt, FaTools, FaTags, FaCoins
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function AdminServicesUi() {
  const formRef = useRef<HTMLDivElement>(null);

  // --- DATA STATES ---
  const [areas, setAreas] = useState<any[]>([]);
  const [areaName, setAreaName] = useState('');
  const [showAreaForm, setShowAreaForm] = useState(false);

  const [priceList, setPriceList] = useState<any[]>([]);
  const [priceItemName, setPriceItemName] = useState('');
  const [priceItemValue, setPriceItemValue] = useState('');
  const [showPriceForm, setShowPriceForm] = useState(false);

  const [services, setServices] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [description, setDescription] = useState('');
  
  // Tasks specifically for the current service being edited
  const [localTasks, setLocalTasks] = useState<{name: string, areaIds: string[]}[]>([]);
  const [currentTaskName, setCurrentTaskName] = useState('');
  
  // Additional costs for the current service
  const [additionalCosts, setAdditionalCosts] = useState<{name: string, price: string}[]>([]);
  const [newCostName, setNewCostName] = useState('');
  const [newCostPrice, setNewCostPrice] = useState('');
  
  const [selectedPriceIds, setSelectedPriceIds] = useState<string[]>([]);
  
  const [imageType, setImageType] = useState<'url' | 'file'>('url');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{id: string, type: string, name: string} | null>(null);

  // --- DATA FETCHING ---
  useEffect(() => {
    const unsubAreas = onSnapshot(query(collection(db, "areas"), orderBy("createdAt", "desc")), (s) => setAreas(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubServices = onSnapshot(query(collection(db, "services"), orderBy("updatedAt", "desc")), (s) => setServices(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubPrices = onSnapshot(query(collection(db, "service_prices"), orderBy("createdAt", "desc")), (s) => setPriceList(s.docs.map(d => ({id: d.id, ...d.data()}))));

    return () => { unsubAreas(); unsubServices(); unsubPrices(); };
  }, []);

  // --- LOGIC ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => { setImagePreview(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const addLocalTask = () => {
    if(!currentTaskName) return toast.error("Enter a task name");
    setLocalTasks([{ name: currentTaskName, areaIds: [] }, ...localTasks]);
    setCurrentTaskName('');
  };

  const toggleAreaForTask = (taskIndex: number, areaId: string) => {
    const updated = [...localTasks];
    const currentAreas = updated[taskIndex].areaIds;
    if(currentAreas.includes(areaId)) {
      updated[taskIndex].areaIds = currentAreas.filter(id => id !== areaId);
    } else {
      updated[taskIndex].areaIds = [...currentAreas, areaId];
    }
    setLocalTasks(updated);
  };

  const addAdditionalCost = () => {
    if(!newCostName) return toast.error("Enter a cost name");
    if(!newCostPrice) return toast.error("Enter a price");
    setAdditionalCosts([{ name: newCostName, price: newCostPrice }, ...additionalCosts]);
    setNewCostName('');
    setNewCostPrice('');
  };

  const removeAdditionalCost = (index: number) => {
    setAdditionalCosts(additionalCosts.filter((_, i) => i !== index));
  };

  const handleEditInit = (s: any) => {
    setEditingId(s.id); 
    setServiceName(s.name); 
    setDescription(s.description);
    setLocalTasks(s.tasks || []); 
    setAdditionalCosts(s.additionalCosts || []);
    setSelectedPriceIds(s.priceItemIds || []);
    setImageUrl(s.image); 
    setImagePreview(s.image);
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null); setServiceName(''); setDescription(''); 
    setLocalTasks([]); setAdditionalCosts([]); setSelectedPriceIds([]); 
    setImageUrl(''); setImagePreview(null); setImageFile(null);
    setNewCostName(''); setNewCostPrice('');
  };

  const handleAddService = async () => {
    if (!serviceName) return toast.error("Service name required");
    if (localTasks.length === 0) return toast.error("Add at least one task");
    
    setUploading(true);
    try {
      let finalImageUrl = imageUrl;
      if (imageType === 'file' && imageFile) {
        const storageRef = ref(storage, `services/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(snapshot.ref);
      }
      const serviceData = {
        name: serviceName,
        description,
        tasks: localTasks,
        additionalCosts: additionalCosts,
        priceItemIds: selectedPriceIds,
        image: finalImageUrl,
        updatedAt: serverTimestamp()
      };
      if (editingId) {
        await updateDoc(doc(db, "services", editingId), serviceData);
        toast.success("Service Updated");
      } else {
        await addDoc(collection(db, "services"), { ...serviceData, createdAt: serverTimestamp() });
        toast.success("Service Created");
      }
      cancelEdit();
    } catch (e) { toast.error("Failed to save"); }
    finally { setUploading(false); }
  };

  return (
    <div className="mx-auto p-4 md:p-10 bg-slate-50 min-h-screen text-slate-800 pb-32">
      <div className="mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Service <span className="text-orange-600">Inventory</span></h1>
          <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-semibold">Management Console</p>
        </header>

        {/* --- DELETE MODAL --- */}
        <AnimatePresence>
          {deleteTarget && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white max-w-sm w-full p-6 rounded-xl shadow-2xl border border-slate-100 text-center">
                <FaExclamationTriangle className="text-red-500 text-3xl mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900">Confirm Deletion</h3>
                <p className="text-sm text-slate-500 mt-2 mb-6">Are you sure you want to remove <span className="font-bold text-slate-800">"{deleteTarget.name}"</span>? This cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                  <button onClick={async() => {
                      const colMap:any = { service:'services', area:'areas', price:'service_prices' };
                      await deleteDoc(doc(db, colMap[deleteTarget.type], deleteTarget.id));
                      setDeleteTarget(null);
                      toast.success("Removed successfully");
                  }} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors">Delete</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          {/* --- LEFT COLUMN: MASTER CONFIGS --- */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* MASTER AREAS */}
            <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <button onClick={() => setShowAreaForm(!showAreaForm)} className="w-full flex justify-between items-center p-4 hover:bg-slate-50 transition-colors">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700">Master Areas</span>
                <FaChevronDown className={`text-slate-400 transition-transform ${showAreaForm ? 'rotate-180' : ''}`} />
              </button>
              {showAreaForm && (
                <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                  <div className="flex gap-2 mb-4">
                    <input value={areaName} onChange={(e)=>setAreaName(e.target.value)} placeholder="e.g. Bathroom" className="flex-1 px-3 py-2 text-sm border rounded-lg outline-none" />
                    <button onClick={async() => { if(areaName){ await addDoc(collection(db, "areas"), {label: areaName, createdAt: serverTimestamp()}); setAreaName(''); }}} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                    {areas.map(a => (
                      <div key={a.id} className="px-2 py-1 bg-white border border-slate-200 rounded-md text-[11px] font-bold flex items-center gap-2">
                        {a.label} 
                        <FaTrash onClick={()=>setDeleteTarget({id: a.id, type:'area', name: a.label})} className="text-slate-300 hover:text-red-500 cursor-pointer"/>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* MASTER PRICES */}
            <section className="mb-6 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <button onClick={() => setShowPriceForm(!showPriceForm)} className="w-full flex justify-between items-center p-4 hover:bg-slate-50 transition-colors">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700">Price Points</span>
                <FaTags className="text-slate-400" />
              </button>
              {showPriceForm && (
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-4">
                  <div className="flex gap-2">
                    <input value={priceItemName} onChange={(e)=>setPriceItemName(e.target.value)} placeholder="Name" className="flex-1 px-3 py-2 text-sm border rounded-lg outline-none" />
                    <input type="number" value={priceItemValue} onChange={(e)=>setPriceItemValue(e.target.value)} placeholder="£" className="w-20 px-3 py-2 text-sm border rounded-lg outline-none" />
                    <button onClick={async() => { if(priceItemName && priceItemValue){ await addDoc(collection(db, "service_prices"), {label: priceItemName, value: parseFloat(priceItemValue), createdAt: serverTimestamp()}); setPriceItemName(''); setPriceItemValue(''); }}} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold">Add</button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {priceList.map(p => (
                      <div key={p.id} className="p-2 bg-white border border-slate-200 rounded-lg flex justify-between items-center text-xs font-bold">
                        <span>{p.label} - £{p.value}</span>
                        <FaTrash onClick={()=>setDeleteTarget({id: p.id, type:'price', name: p.label})} className="text-slate-300 hover:text-red-500 cursor-pointer"/>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* --- RIGHT COLUMN: SERVICE EDITOR --- */}
          <div className="lg:col-span-8 space-y-8">
            <div ref={formRef} className={`bg-white border-2 rounded-xl transition-all duration-300 px-3 py-5 md:p-6 ${editingId ? 'border-orange-500 shadow-xl' : 'border-slate-100 shadow-sm'}`}>
              <div className="flex justify-between items-start mb-8 pb-4 border-b border-slate-50">
                <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Update Service' : 'New Service Offering'}</h2>
                {editingId && <button onClick={cancelEdit} className="text-xs font-bold text-red-500 uppercase flex items-center gap-1 hover:bg-red-50 px-3 py-1.5 rounded-md"><FaTimes /> Cancel</button>}
              </div>

              <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-8">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Service Title</label>
                    <input value={serviceName} onChange={(e)=>setServiceName(e.target.value)} placeholder="e.g. Deep Clean" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Description</label>
                    <textarea value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="What's included..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg h-24 text-sm" />
                  </div>

                  {/* Task Management */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Create Tasks</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input value={currentTaskName} onChange={(e)=>setCurrentTaskName(e.target.value)} placeholder="New task..." className="flex-1 px-3 py-2 text-sm border rounded-lg w-full" />
                      <button onClick={addLocalTask} className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 w-full sm:w-auto">
                        <FaPlus/> <span className="sm:hidden">Add Task</span>
                      </button>
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                      {localTasks.map((task, idx) => (
                        <div key={idx} className="p-3 sm:p-4 border border-slate-200 rounded-xl bg-slate-50/30">
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-bold text-sm text-slate-800 break-words pr-2">{idx + 1}. {task.name}</span>
                            <FaTrash onClick={() => setLocalTasks(localTasks.filter((_, i) => i !== idx))} className="text-red-400 cursor-pointer hover:text-red-600 flex-shrink-0"/>
                          </div>
                          
                          {/* Mapping appears only when task exists */}
                          <div className="space-y-2">
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Link to Areas:</p>
                            <div className="flex flex-wrap gap-1">
                              {areas.map(a => (
                                <button 
                                  key={a.id} 
                                  onClick={() => toggleAreaForTask(idx, a.id)}
                                  className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${task.areaIds.includes(a.id) ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-500 border-slate-200'}`}
                                >
                                  {a.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                      {localTasks.length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-4">No tasks added yet. Add your first task above.</p>
                      )}
                    </div>
                  </div>

                  {/* Additional Costs Section */}
                  <div className="space-y-3 mt-6 pt-4 border-t border-slate-100">
                    <label className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-2">
                      <FaCoins className="text-green-600" /> Additional Costs
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                        value={newCostName} 
                        onChange={(e) => setNewCostName(e.target.value)} 
                        placeholder="Cost name (e.g. Extra hour)" 
                        className="flex-1 px-3 py-2 text-sm border rounded-lg w-full" 
                      />
                      <input 
                        type="number" 
                        value={newCostPrice} 
                        onChange={(e) => setNewCostPrice(e.target.value)} 
                        placeholder="£" 
                        className="w-full sm:w-20 px-3 py-2 text-sm border rounded-lg" 
                      />
                      <button onClick={addAdditionalCost} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 w-full sm:w-auto">
                        <FaPlus/> <span className="sm:hidden">Add Cost</span>
                      </button>
                    </div>

                    {/* Display Additional Costs */}
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {additionalCosts.map((cost, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="font-bold text-sm text-slate-800 break-words">{cost.name}</span>
                            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded w-fit">
                              £{cost.price}
                            </span>
                          </div>
                          <FaTrash 
                            onClick={() => removeAdditionalCost(idx)} 
                            className="text-red-400 cursor-pointer hover:text-red-600 flex-shrink-0 ml-2"
                          />
                        </div>
                      ))}
                      {additionalCosts.length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-4">No additional costs added yet</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pricing & Media */}
                <div className="space-y-6 mt-6 md:mt-0">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 uppercase">Select Price Options</label>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                      {priceList.map(p => (
                        <button key={p.id} onClick={() => setSelectedPriceIds(prev => prev.includes(p.id) ? prev.filter(i => i !== p.id) : [...prev, p.id])} className={`px-3 py-2 rounded-lg border text-left flex justify-between items-center transition-all ${selectedPriceIds.includes(p.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-600'}`}>
                          <span className="text-xs font-bold truncate mr-2">{p.label}</span>
                          <span className="text-xs font-bold flex items-center gap-1">
                            £{p.value}
                            {selectedPriceIds.includes(p.id) && <FaCheckSquare className="ml-1 flex-shrink-0" />}
                          </span>
                        </button>
                      ))}
                      {priceList.length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-4">No price options available. Add some in the Price Points section.</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase block">Imagery</label>
                    <AnimatePresence>
                      {(imagePreview || imageUrl) && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="aspect-video w-full bg-slate-100 rounded-xl overflow-hidden relative border border-slate-200">
                          <img src={imagePreview || imageUrl} className="w-full h-full object-cover" alt="Preview" />
                          <button onClick={()=>{setImagePreview(null); setImageUrl(''); setImageFile(null);}} className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow-lg"><FaTimes /></button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button onClick={()=>setImageType('url')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold border-2 ${imageType === 'url' ? 'bg-slate-900 text-white border-slate-900' : 'text-slate-400'}`}>URL</button>
                      <button onClick={()=>setImageType('file')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold border-2 ${imageType === 'file' ? 'bg-slate-900 text-white border-slate-900' : 'text-slate-400'}`}>FILE</button>
                    </div>
                    {imageType === 'url' ? 
                      <input value={imageUrl || ""} onChange={(e)=>{setImageUrl(e.target.value); setImagePreview(e.target.value);}} placeholder="Image Link" className="w-full p-2 bg-slate-50 border rounded-lg text-sm" /> : 
                      <input type="file" onChange={handleFileChange} className="w-full p-2 bg-white border border-dashed rounded-lg text-sm" />
                    }
                    {imageType === 'file' && imageFile && (
                      <p className="text-xs text-slate-500 mt-1 truncate">Selected: {imageFile.name}</p>
                    )}
                  </div>
                </div>
              </div>

              <button disabled={uploading} onClick={handleAddService} className="mt-8 md:mt-10 w-full py-4 bg-blue-900 text-white rounded-lg font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 transition-colors shadow-lg">
                {uploading ? <FaSpinner className="animate-spin" /> : <><FaSave/> {editingId ? 'Save Changes' : 'Create Service'}</>}
              </button>
            </div>

            {/* LIVE DISPLAY */}
            <div>
              <div className="flex items-center gap-4 mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Live <span className="text-orange-600">Catalog</span></h1>
                <div className="h-px flex-1 bg-slate-200"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {services.map((s) => (
                  <div key={s.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm group hover:border-orange-500 transition-all">
                    <div className="aspect-video bg-slate-100 relative">
                      <img src={s.image} className="w-full h-full object-cover" alt="" />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button onClick={() => handleEditInit(s)} className="p-3 bg-white text-slate-900 rounded-lg hover:scale-110"><FaEdit/></button>
                        <button onClick={() => setDeleteTarget({id: s.id, type: 'service', name: s.name})} className="p-3 bg-red-600 text-white rounded-lg hover:scale-110"><FaTrash/></button>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-slate-900 text-lg">{s.name}</h3>
                      <div className="flex gap-4 mt-4 text-[10px] font-black uppercase text-slate-400">
                        <span className="flex items-center gap-1.5"><FaTools className="text-orange-500"/> {s.tasks?.length || 0} Tasks</span>
                        <span className="flex items-center gap-1.5"><FaTags className="text-blue-500"/> {s.priceItemIds?.length || 0} Prices</span>
                        <span className="flex items-center gap-1.5"><FaCoins className="text-green-500"/> {s.additionalCosts?.length || 0} Extras</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}