"use client";

import { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { 
  collection, addDoc, query, orderBy, onSnapshot, 
  serverTimestamp, doc, deleteDoc, setDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  FaPlus, FaTrash, FaSave, FaSpinner,
  FaExclamationTriangle, FaGlobe, FaCloudUploadAlt,
  FaChevronDown, FaChevronUp
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function PolicyEditorUi() {
  // ===== HEADER SECTION =====
  const [policyTitle, setPolicyTitle] = useState('');
  const [policySubtitle, setPolicySubtitle] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');

  // ===== HERO SLIDER IMAGES =====
  const [heroImages, setHeroImages] = useState<any[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageType, setImageType] = useState<'url' | 'file'>('url');
  const [uploadingImage, setUploadingImage] = useState(false);

  // ===== SECTION 01: DATA COLLECTION =====
  const [collectionIntro, setCollectionIntro] = useState('');
  const [collectionItems, setCollectionItems] = useState<string[]>([]);
  const [newCollectionItem, setNewCollectionItem] = useState('');

  // ===== SECTION 02: USAGE POLICY =====
  const [usagePoints, setUsagePoints] = useState<string[]>([]);
  const [newUsagePoint, setNewUsagePoint] = useState('');
  const [usageRecurringNote, setUsageRecurringNote] = useState('');

  // ===== SECTION 03: REFUNDS & GUARANTEES =====
  const [refundGuarantee, setRefundGuarantee] = useState('');
  const [refundEligibilityPoints, setRefundEligibilityPoints] = useState<string[]>([]);
  const [newRefundPoint, setNewRefundPoint] = useState('');
  const [refundClaimNote, setRefundClaimNote] = useState('');
  const [refundTimelinePoints, setRefundTimelinePoints] = useState<string[]>([]);
  const [newTimelinePoint, setNewTimelinePoint] = useState('');

  // ===== SECTION 04: SECURITY STANDARDS =====
  const [securityIntro, setSecurityIntro] = useState('');
  const [securityPoints, setSecurityPoints] = useState<string[]>([]);
  const [newSecurityPoint, setNewSecurityPoint] = useState('');
  const [securityCompliance, setSecurityCompliance] = useState('');

  // ===== SECTION 05: DATA RIGHTS & ERASURE =====
  const [deletionIntro, setDeletionIntro] = useState('');
  const [deletionIncludes, setDeletionIncludes] = useState<string[]>([]);
  const [newDeletionItem, setNewDeletionItem] = useState('');
  const [deletionInstruction, setDeletionInstruction] = useState('');
  const [deletionNote, setDeletionNote] = useState('');

  // ===== SECTION 06: SERVICE-SPECIFIC POLICIES =====
  const [cleaningPolicyPoints, setCleaningPolicyPoints] = useState<string[]>([]);
  const [newCleaningPoint, setNewCleaningPoint] = useState('');
  const [decorationPolicyPoints, setDecorationPolicyPoints] = useState<string[]>([]);
  const [newDecorationPoint, setNewDecorationPoint] = useState('');
  const [healthPolicyPoints, setHealthPolicyPoints] = useState<string[]>([]);
  const [newHealthPoint, setNewHealthPoint] = useState('');
  const [rentalPolicyPoints, setRentalPolicyPoints] = useState<string[]>([]);
  const [newRentalPoint, setNewRentalPoint] = useState('');

  // ===== FOOTER SECTION =====
  const [footerEmail, setFooterEmail] = useState('');
  const [footerAddress, setFooterAddress] = useState('');
  const [footerNote, setFooterNote] = useState('');

  // ===== UI STATES =====
  const [deleteTarget, setDeleteTarget] = useState<{id: string, type: string, name: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    header: true,
    images: true,
    collection: true,
    usage: true,
    refunds: true,
    security: true,
    deletion: true,
    serviceSpecific: true,
    footer: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // ===== LOAD DATA FROM FIREBASE =====
  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, "settings", "policy"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setPolicyTitle(data.title || '');
        setPolicySubtitle(data.subtitle || '');
        setEffectiveDate(data.effectiveDate || '');
        setFooterEmail(data.footerEmail || '');
        setFooterAddress(data.footerAddress || '');
        setFooterNote(data.footerNote || '');
      }
    });

    const unsubSections = onSnapshot(doc(db, "settings", "policy_sections"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCollectionIntro(data.collectionIntro || '');
        setCollectionItems(data.collectionItems || []);
        setUsagePoints(data.usagePoints || []);
        setUsageRecurringNote(data.usageRecurringNote || '');
        setRefundGuarantee(data.refundGuarantee || '');
        setRefundEligibilityPoints(data.refundEligibilityPoints || []);
        setRefundClaimNote(data.refundClaimNote || '');
        setRefundTimelinePoints(data.refundTimelinePoints || []);
        setSecurityIntro(data.securityIntro || '');
        setSecurityPoints(data.securityPoints || []);
        setSecurityCompliance(data.securityCompliance || '');
        setDeletionIntro(data.deletionIntro || '');
        setDeletionIncludes(data.deletionIncludes || []);
        setDeletionInstruction(data.deletionInstruction || '');
        setDeletionNote(data.deletionNote || '');
        setCleaningPolicyPoints(data.cleaningPolicyPoints || []);
        setDecorationPolicyPoints(data.decorationPolicyPoints || []);
        setHealthPolicyPoints(data.healthPolicyPoints || []);
        setRentalPolicyPoints(data.rentalPolicyPoints || []);
      }
    });

    const unsubImages = onSnapshot(
      query(collection(db, "policy_hero_images"), orderBy("order", "asc")),
      (snap) => setHeroImages(snap.docs.map(d => ({id: d.id, ...d.data()})))
    );

    return () => {
      unsubSettings();
      unsubSections();
      unsubImages();
    };
  }, []);

  // ===== SAVE ALL DATA =====
  const saveAll = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "settings", "policy"), {
        title: policyTitle,
        subtitle: policySubtitle,
        effectiveDate,
        footerEmail,
        footerAddress,
        footerNote,
        updatedAt: serverTimestamp()
      });

      await setDoc(doc(db, "settings", "policy_sections"), {
        collectionIntro,
        collectionItems,
        usagePoints,
        usageRecurringNote,
        refundGuarantee,
        refundEligibilityPoints,
        refundClaimNote,
        refundTimelinePoints,
        securityIntro,
        securityPoints,
        securityCompliance,
        deletionIntro,
        deletionIncludes,
        deletionInstruction,
        deletionNote,
        cleaningPolicyPoints,
        decorationPolicyPoints,
        healthPolicyPoints,
        rentalPolicyPoints,
        updatedAt: serverTimestamp()
      });

      toast.success("All policy data saved!");
    } catch (e) {
      console.error(e);
      toast.error("Error saving");
    } finally {
      setLoading(false);
    }
  };

  // ===== IMAGE HANDLING =====
  const handleAddImage = async () => {
    if (imageType === 'url' && !imageUrl) return toast.error("Enter URL");
    if (imageType === 'file' && !imageFile) return toast.error("Select File");

    setUploadingImage(true);
    try {
      let finalUrl = imageUrl;
      if (imageType === 'file' && imageFile) {
        const storageRef = ref(storage, `policy/hero/${Date.now()}_${imageFile.name}`);
        const snap = await uploadBytes(storageRef, imageFile);
        finalUrl = await getDownloadURL(snap.ref);
      }

      await addDoc(collection(db, "policy_hero_images"), {
        url: finalUrl,
        order: heroImages.length,
        createdAt: serverTimestamp()
      });

      setImageUrl('');
      setImageFile(null);
      toast.success("Image added");
    } catch (e) {
      toast.error("Upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  // ===== HELPER FUNCTIONS FOR BULLET POINTS =====
  const addItem = (setter: Function, currentItems: string[], newItem: string, clearInput: Function) => {
    if (!newItem.trim()) return;
    setter([...currentItems, newItem]);
    clearInput('');
  };

  const removeItem = (setter: Function, currentItems: string[], index: number) => {
    setter(currentItems.filter((_, i) => i !== index));
  };

  // ===== DELETE IMAGE MODAL =====
  const confirmDeleteImage = async () => {
    if (!deleteTarget) return;
    await deleteDoc(doc(db, "policy_hero_images", deleteTarget.id));
    setDeleteTarget(null);
    toast.success("Image deleted");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header - Mobile Optimized */}
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">
              Policy <span className="text-orange-600">Editor</span>
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">Edit every section of your privacy & service policy</p>
          </div>
          <button 
            onClick={saveAll} 
            disabled={loading} 
            className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-green-600 text-white rounded-xl font-black uppercase text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-lg"
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaSave />} Save All
          </button>
        </div>

        {/* Delete Modal - Mobile Optimized */}
        <AnimatePresence>
          {deleteTarget && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white max-w-sm w-full p-5 sm:p-6 rounded-xl text-center">
                <FaExclamationTriangle className="text-red-500 text-3xl sm:text-4xl mx-auto mb-4" />
                <h3 className="font-bold text-base sm:text-lg mb-2">Delete Image?</h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-5 sm:mb-6">This cannot be undone.</p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button onClick={() => setDeleteTarget(null)} className="w-full sm:flex-1 py-2.5 sm:py-2 bg-slate-100 rounded-lg text-sm font-medium">Cancel</button>
                  <button onClick={confirmDeleteImage} className="w-full sm:flex-1 py-2.5 sm:py-2 bg-red-600 text-white rounded-lg text-sm font-medium">Delete</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== HEADER SECTION ===== */}
        <SectionCard 
          title="Page Header" 
          isExpanded={expandedSections.header} 
          onToggle={() => toggleSection('header')}
        >
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">Policy Title</label>
              <input
                value={policyTitle}
                onChange={(e) => setPolicyTitle(e.target.value)}
                placeholder="Privacy & Service Policy"
                className="w-full p-2.5 sm:p-3 bg-white border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">Policy Subtitle</label>
              <input
                value={policySubtitle}
                onChange={(e) => setPolicySubtitle(e.target.value)}
                placeholder="Ensuring trust and transparency across every service"
                className="w-full p-2.5 sm:p-3 bg-white border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">Effective Date</label>
              <input
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                placeholder="March 11, 2026"
                className="w-full p-2.5 sm:p-3 bg-white border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>
        </SectionCard>

        {/* ===== HERO IMAGES SECTION ===== */}
        <SectionCard 
          title="Hero Slider Images" 
          isExpanded={expandedSections.images} 
          onToggle={() => toggleSection('images')}
        >
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
              {/* Left Column - Image Input */}
              <div className="space-y-3 w-full">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setImageType('url')} 
                    className={`flex-1 py-2.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold border-2 transition-all ${imageType === 'url' ? 'border-orange-600 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-500'}`}
                  >
                    <FaGlobe className="inline mr-1 sm:mr-2" /> URL
                  </button>
                  <button 
                    onClick={() => setImageType('file')} 
                    className={`flex-1 py-2.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold border-2 transition-all ${imageType === 'file' ? 'border-orange-600 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-500'}`}
                  >
                    <FaCloudUploadAlt className="inline mr-1 sm:mr-2" /> Upload
                  </button>
                </div>
                
                {imageType === 'url' ? (
                  <input 
                    value={imageUrl} 
                    onChange={(e) => setImageUrl(e.target.value)} 
                    placeholder="https://example.com/image.jpg" 
                    className="w-full p-2.5 sm:p-3 bg-white border rounded-lg text-sm" 
                  />
                ) : (
                  <div className="w-full">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)} 
                      className="w-full p-2 text-sm bg-white border border-dashed rounded-lg file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-slate-100 file:text-slate-700" 
                    />
                    {imageFile && (
                      <p className="text-xs text-slate-500 mt-1 truncate">Selected: {imageFile.name}</p>
                    )}
                  </div>
                )}
                
                <button 
                  onClick={handleAddImage} 
                  disabled={uploadingImage} 
                  className="w-full bg-orange-600 text-white py-2.5 sm:py-2 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {uploadingImage ? <FaSpinner className="animate-spin" /> : <FaPlus />} Add Image
                </button>
              </div>

              {/* Right Column - Preview */}
              <div className="bg-slate-100 rounded-lg p-3 sm:p-4 mt-2 sm:mt-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-2">Preview ({heroImages.length} images)</p>
                <div className="grid grid-cols-3 gap-2">
                  {heroImages.map(img => (
                    <div key={img.id} className="relative group aspect-square bg-white rounded-lg overflow-hidden border">
                      <img src={img.url} className="w-full h-full object-cover" alt="" />
                      <button 
                        onClick={() => setDeleteTarget(img)} 
                        className="absolute top-1 right-1 bg-red-600 text-white p-1.5 sm:p-1 rounded-full md:opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FaTrash size={10} />
                      </button>
                    </div>
                  ))}
                  {heroImages.length === 0 && (
                    <div className="col-span-3 text-center py-4 text-slate-400 text-xs">
                      No images added yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ===== SECTION 01: DATA COLLECTION ===== */}
        <SectionCard 
          title="01. Data Collection" 
          isExpanded={expandedSections.collection} 
          onToggle={() => toggleSection('collection')}
        >
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">Introduction Text</label>
              <textarea
                value={collectionIntro}
                onChange={(e) => setCollectionIntro(e.target.value)}
                rows={3}
                className="w-full p-2.5 sm:p-3 bg-white border border-slate-200 rounded-lg text-sm"
                placeholder="To provide the highest standard of cleaning, decoration, health services, and event rentals..."
              />
            </div>
            
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-2">Collection Items (Bullet Points)</label>
              <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
                {collectionItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 sm:p-2.5 bg-white border border-slate-200 rounded-lg">
                    <span className="flex-1 text-xs sm:text-sm break-words pr-2">{item}</span>
                    <button onClick={() => removeItem(setCollectionItems, collectionItems, index)} className="text-red-600 p-1 flex-shrink-0">
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))}
                {collectionItems.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-2">No items added yet</p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={newCollectionItem}
                  onChange={(e) => setNewCollectionItem(e.target.value)}
                  placeholder="Add new collection item..."
                  className="flex-1 p-2.5 sm:p-3 bg-white border border-slate-200 rounded-lg text-sm w-full"
                />
                <button 
                  onClick={() => addItem(setCollectionItems, collectionItems, newCollectionItem, setNewCollectionItem)}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-3 bg-orange-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-orange-700 transition-colors"
                >
                  <FaPlus /> <span className="sm:hidden">Add Item</span>
                </button>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ===== SECTION 02: USAGE POLICY ===== */}
        <SectionCard 
          title="02. Usage Policy" 
          isExpanded={expandedSections.usage} 
          onToggle={() => toggleSection('usage')}
        >
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-2">Usage Points</label>
              <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
                {usagePoints.map((point, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 sm:p-2.5 bg-white border border-slate-200 rounded-lg">
                    <span className="flex-1 text-xs sm:text-sm break-words pr-2">{point}</span>
                    <button onClick={() => removeItem(setUsagePoints, usagePoints, index)} className="text-red-600 p-1 flex-shrink-0">
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))}
                {usagePoints.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-2">No usage points added yet</p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={newUsagePoint}
                  onChange={(e) => setNewUsagePoint(e.target.value)}
                  placeholder="Add usage point..."
                  className="flex-1 p-2.5 sm:p-3 bg-white border border-slate-200 rounded-lg text-sm w-full"
                />
                <button 
                  onClick={() => addItem(setUsagePoints, usagePoints, newUsagePoint, setNewUsagePoint)}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-3 bg-orange-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-orange-700 transition-colors"
                >
                  <FaPlus /> <span className="sm:hidden">Add Point</span>
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">Recurring Clients Note</label>
              <textarea
                value={usageRecurringNote}
                onChange={(e) => setUsageRecurringNote(e.target.value)}
                rows={3}
                className="w-full p-2.5 sm:p-3 bg-white border border-slate-200 rounded-lg text-sm"
                placeholder="For recurring clients, sensitive information is stored in an encrypted vault..."
              />
            </div>
          </div>
        </SectionCard>

        {/* ===== SECTION 03: REFUNDS & GUARANTEES ===== */}
        <SectionCard 
          title="03. Refunds & Guarantees" 
          isExpanded={expandedSections.refunds} 
          onToggle={() => toggleSection('refunds')}
        >
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">Guarantee Title</label>
              <input
                value={refundGuarantee}
                onChange={(e) => setRefundGuarantee(e.target.value)}
                placeholder="100% Satisfaction Guarantee"
                className="w-full p-2.5 sm:p-3 bg-white border border-slate-200 rounded-lg text-sm"
              />
            </div>
            
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-2">Eligibility Points</label>
              <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
                {refundEligibilityPoints.map((point, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 sm:p-2.5 bg-white border border-slate-200 rounded-lg">
                    <span className="flex-1 text-xs sm:text-sm break-words pr-2">{point}</span>
                    <button onClick={() => removeItem(setRefundEligibilityPoints, refundEligibilityPoints, index)} className="text-red-600 p-1 flex-shrink-0">
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))}
                {refundEligibilityPoints.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-2">No eligibility points added yet</p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={newRefundPoint}
                  onChange={(e) => setNewRefundPoint(e.target.value)}
                  placeholder="Add eligibility point..."
                  className="flex-1 p-2.5 sm:p-3 bg-white border border-slate-200 rounded-lg text-sm w-full"
                />
                <button 
                  onClick={() => addItem(setRefundEligibilityPoints, refundEligibilityPoints, newRefundPoint, setNewRefundPoint)}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-3 bg-orange-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-orange-700 transition-colors"
                >
                  <FaPlus /> <span className="sm:hidden">Add Point</span>
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">Claim Filing Note</label>
              <textarea
                value={refundClaimNote}
                onChange={(e) => setRefundClaimNote(e.target.value)}
                rows={2}
                className="w-full p-2.5 sm:p-3 bg-white border border-slate-200 rounded-lg text-sm"
                placeholder="Claims must be filed within 24 hours of service completion..."
              />
            </div>
            
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-2">Timeline Points</label>
              <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
                {refundTimelinePoints.map((point, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 sm:p-2.5 bg-white border border-slate-200 rounded-lg">
                    <span className="flex-1 text-xs sm:text-sm break-words pr-2">{point}</span>
                    <button onClick={() => removeItem(setRefundTimelinePoints, refundTimelinePoints, index)} className="text-red-600 p-1 flex-shrink-0">
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))}
                {refundTimelinePoints.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-2">No timeline points added yet</p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={newTimelinePoint}
                  onChange={(e) => setNewTimelinePoint(e.target.value)}
                  placeholder="Add timeline point..."
                  className="flex-1 p-2.5 sm:p-3 bg-white border border-slate-200 rounded-lg text-sm w-full"
                />
                <button 
                  onClick={() => addItem(setRefundTimelinePoints, refundTimelinePoints, newTimelinePoint, setNewTimelinePoint)}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-3 bg-orange-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-orange-700 transition-colors"
                >
                  <FaPlus /> <span className="sm:hidden">Add Point</span>
                </button>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ===== SECTION 04: SECURITY STANDARDS ===== */}
        <SectionCard 
          title="04. Security Standards" 
          isExpanded={expandedSections.security} 
          onToggle={() => toggleSection('security')}
        >
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">Introduction</label>
              <textarea
                value={securityIntro}
                onChange={(e) => setSecurityIntro(e.target.value)}
                rows={2}
                className="w-full p-2.5 sm:p-3 bg-white border border-slate-200 rounded-lg text-sm"
                placeholder="We employ industry-standard SSL encryption for all transactions..."
              />
            </div>
            
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-2">Security Points</label>
              <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
                {securityPoints.map((point, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 sm:p-2.5 bg-white border border-slate-200 rounded-lg">
                    <span className="flex-1 text-xs sm:text-sm break-words pr-2">{point}</span>
                    <button onClick={() => removeItem(setSecurityPoints, securityPoints, index)} className="text-red-600 p-1 flex-shrink-0">
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))}
                {securityPoints.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-2">No security points added yet</p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={newSecurityPoint}
                  onChange={(e) => setNewSecurityPoint(e.target.value)}
                  placeholder="Add security point..."
                  className="flex-1 p-2.5 sm:p-3 bg-white border border-slate-200 rounded-lg text-sm w-full"
                />
                <button 
                  onClick={() => addItem(setSecurityPoints, securityPoints, newSecurityPoint, setNewSecurityPoint)}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-3 bg-orange-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-orange-700 transition-colors"
                >
                  <FaPlus /> <span className="sm:hidden">Add Point</span>
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">Compliance Note</label>
              <textarea
                value={securityCompliance}
                onChange={(e) => setSecurityCompliance(e.target.value)}
                rows={2}
                className="w-full p-2.5 sm:p-3 bg-white border border-slate-200 rounded-lg text-sm"
                placeholder="All sensitive data is stored in compliance with UK data protection regulations (GDPR)."
              />
            </div>
          </div>
        </SectionCard>

        {/* ===== SECTION 05: DATA RIGHTS & ERASURE ===== */}
        <SectionCard 
          title="05. Data Rights & Erasure" 
          isExpanded={expandedSections.deletion} 
          onToggle={() => toggleSection('deletion')}
        >
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">Introduction</label>
              <textarea
                value={deletionIntro}
                onChange={(e) => setDeletionIntro(e.target.value)}
                rows={2}
                className="w-full p-2.5 sm:p-3 bg-white border border-slate-200 rounded-lg text-sm"
                placeholder="We respect your 'Right to be Forgotten' under UK data protection law..."
              />
            </div>
            
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-2">Data Included in Deletion</label>
              <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
                {deletionIncludes.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 sm:p-2.5 bg-white border border-slate-200 rounded-lg">
                    <span className="flex-1 text-xs sm:text-sm break-words pr-2">{item}</span>
                    <button onClick={() => removeItem(setDeletionIncludes, deletionIncludes, index)} className="text-red-600 p-1 flex-shrink-0">
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))}
                {deletionIncludes.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-2">No deletion items added yet</p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={newDeletionItem}
                  onChange={(e) => setNewDeletionItem(e.target.value)}
                  placeholder="Add item included in deletion..."
                  className="flex-1 p-2.5 sm:p-3 bg-white border border-slate-200 rounded-lg text-sm w-full"
                />
                <button 
                  onClick={() => addItem(setDeletionIncludes, deletionIncludes, newDeletionItem, setNewDeletionItem)}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-3 bg-orange-600 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-orange-700 transition-colors"
                >
                  <FaPlus /> <span className="sm:hidden">Add Item</span>
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">Deletion Instructions</label>
              <textarea
                value={deletionInstruction}
                onChange={(e) => setDeletionInstruction(e.target.value)}
                rows={3}
                className="w-full p-2.5 sm:p-3 bg-white border border-slate-200 rounded-lg text-sm"
                placeholder="Request deletion through your account settings under 'Privacy & Data'..."
              />
            </div>
            
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">Additional Note</label>
              <textarea
                value={deletionNote}
                onChange={(e) => setDeletionNote(e.target.value)}
                rows={2}
                className="w-full p-2.5 sm:p-3 bg-white border border-slate-200 rounded-lg text-sm"
                placeholder="Deletion requests are processed within 30 days."
              />
            </div>
          </div>
        </SectionCard>

        {/* ===== SECTION 06: SERVICE-SPECIFIC POLICIES ===== */}
        <SectionCard 
          title="06. Service-Specific Policies" 
          isExpanded={expandedSections.serviceSpecific} 
          onToggle={() => toggleSection('serviceSpecific')}
        >
          <div className="space-y-6 sm:space-y-8">
            {/* Cleaning Services */}
            <div className="border-l-4 border-blue-400 pl-3 sm:pl-4">
              <h3 className="font-bold text-sm sm:text-base mb-3">Cleaning Services</h3>
              <div className="space-y-2 mb-3 max-h-40 overflow-y-auto pr-1">
                {cleaningPolicyPoints.map((point, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg">
                    <span className="flex-1 text-xs sm:text-sm break-words pr-2">{point}</span>
                    <button onClick={() => removeItem(setCleaningPolicyPoints, cleaningPolicyPoints, index)} className="text-red-600 p-1 flex-shrink-0">
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))}
                {cleaningPolicyPoints.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-2">No points added yet</p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={newCleaningPoint}
                  onChange={(e) => setNewCleaningPoint(e.target.value)}
                  placeholder="Add cleaning policy point..."
                  className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-sm w-full"
                />
                <button 
                  onClick={() => addItem(setCleaningPolicyPoints, cleaningPolicyPoints, newCleaningPoint, setNewCleaningPoint)}
                  className="w-full sm:w-auto px-3 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                >
                  <FaPlus /> <span className="sm:hidden">Add</span>
                </button>
              </div>
            </div>

            {/* Decoration Services */}
            <div className="border-l-4 border-purple-400 pl-3 sm:pl-4">
              <h3 className="font-bold text-sm sm:text-base mb-3">Decoration Services</h3>
              <div className="space-y-2 mb-3 max-h-40 overflow-y-auto pr-1">
                {decorationPolicyPoints.map((point, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg">
                    <span className="flex-1 text-xs sm:text-sm break-words pr-2">{point}</span>
                    <button onClick={() => removeItem(setDecorationPolicyPoints, decorationPolicyPoints, index)} className="text-red-600 p-1 flex-shrink-0">
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))}
                {decorationPolicyPoints.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-2">No points added yet</p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={newDecorationPoint}
                  onChange={(e) => setNewDecorationPoint(e.target.value)}
                  placeholder="Add decoration policy point..."
                  className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-sm w-full"
                />
                <button 
                  onClick={() => addItem(setDecorationPolicyPoints, decorationPolicyPoints, newDecorationPoint, setNewDecorationPoint)}
                  className="w-full sm:w-auto px-3 py-2 bg-purple-600 text-white rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors"
                >
                  <FaPlus /> <span className="sm:hidden">Add</span>
                </button>
              </div>
            </div>

            {/* Health Services */}
            <div className="border-l-4 border-green-400 pl-3 sm:pl-4">
              <h3 className="font-bold text-sm sm:text-base mb-3">Health Services</h3>
              <div className="space-y-2 mb-3 max-h-40 overflow-y-auto pr-1">
                {healthPolicyPoints.map((point, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg">
                    <span className="flex-1 text-xs sm:text-sm break-words pr-2">{point}</span>
                    <button onClick={() => removeItem(setHealthPolicyPoints, healthPolicyPoints, index)} className="text-red-600 p-1 flex-shrink-0">
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))}
                {healthPolicyPoints.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-2">No points added yet</p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={newHealthPoint}
                  onChange={(e) => setNewHealthPoint(e.target.value)}
                  placeholder="Add health policy point..."
                  className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-sm w-full"
                />
                <button 
                  onClick={() => addItem(setHealthPolicyPoints, healthPolicyPoints, newHealthPoint, setNewHealthPoint)}
                  className="w-full sm:w-auto px-3 py-2 bg-green-600 text-white rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
                >
                  <FaPlus /> <span className="sm:hidden">Add</span>
                </button>
              </div>
            </div>

            {/* Renting Services */}
            <div className="border-l-4 border-orange-400 pl-3 sm:pl-4">
              <h3 className="font-bold text-sm sm:text-base mb-3">Renting Services</h3>
              <div className="space-y-2 mb-3 max-h-40 overflow-y-auto pr-1">
                {rentalPolicyPoints.map((point, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg">
                    <span className="flex-1 text-xs sm:text-sm break-words pr-2">{point}</span>
                    <button onClick={() => removeItem(setRentalPolicyPoints, rentalPolicyPoints, index)} className="text-red-600 p-1 flex-shrink-0">
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))}
                {rentalPolicyPoints.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-2">No points added yet</p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={newRentalPoint}
                  onChange={(e) => setNewRentalPoint(e.target.value)}
                  placeholder="Add rental policy point..."
                  className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-sm w-full"
                />
                <button 
                  onClick={() => addItem(setRentalPolicyPoints, rentalPolicyPoints, newRentalPoint, setNewRentalPoint)}
                  className="w-full sm:w-auto px-3 py-2 bg-orange-600 text-white rounded-lg text-sm flex items-center justify-center gap-2 hover:bg-orange-700 transition-colors"
                >
                  <FaPlus /> <span className="sm:hidden">Add</span>
                </button>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ===== FOOTER SECTION ===== */}
        <SectionCard 
          title="Footer Information" 
          isExpanded={expandedSections.footer} 
          onToggle={() => toggleSection('footer')}
        >
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">Contact Email</label>
              <input
                value={footerEmail}
                onChange={(e) => setFooterEmail(e.target.value)}
                placeholder="privacy@isundunrin.co.uk"
                className="w-full p-2.5 sm:p-3 bg-white border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">Contact Address</label>
              <input
                value={footerAddress}
                onChange={(e) => setFooterAddress(e.target.value)}
                placeholder="Data Protection Officer, Isundunrin Services, Bristol, UK"
                className="w-full p-2.5 sm:p-3 bg-white border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">Footer Note</label>
              <textarea
                value={footerNote}
                onChange={(e) => setFooterNote(e.target.value)}
                rows={2}
                className="w-full p-2.5 sm:p-3 bg-white border border-slate-200 rounded-lg text-sm"
                placeholder="Last updated: March 11, 2026. We may update this policy periodically..."
              />
            </div>
          </div>
        </SectionCard>

        {/* Bottom Save Button - Mobile Optimized */}
        <div className="mt-6 sm:mt-8 flex justify-end">
          <button 
            onClick={saveAll} 
            disabled={loading} 
            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-green-600 text-white rounded-xl font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 hover:bg-green-700 transition-all text-sm sm:text-base"
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaSave />} Save All Policy Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== SECTION CARD COMPONENT - Mobile Optimized =====
const SectionCard = ({ title, isExpanded, onToggle, children }: { title: string, isExpanded: boolean, onToggle: () => void, children: React.ReactNode }) => (
  <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-4 sm:mb-6 overflow-hidden">
    <button 
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 sm:p-5 bg-slate-50 hover:bg-slate-100 transition-colors"
    >
      <h2 className="font-bold text-base sm:text-lg text-slate-800">{title}</h2>
      {isExpanded ? <FaChevronUp className="text-slate-500 text-sm sm:text-base" /> : <FaChevronDown className="text-slate-500 text-sm sm:text-base" />}
    </button>
    <AnimatePresence>
      {isExpanded && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }} 
          animate={{ height: 'auto', opacity: 1 }} 
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="p-4 sm:p-5 border-t border-slate-200">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);