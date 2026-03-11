"use client";

import { useState, useEffect, useCallback } from 'react';
import { db, storage } from '@/lib/firebase';
import { 
  doc, setDoc, serverTimestamp, onSnapshot 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  FaSave, FaSpinner, FaPlus, FaTrash, FaImage,
  FaGlobe, FaCloudUploadAlt, FaTimes
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from "react-hot-toast";

interface AboutPreviewData {
  mainHeading: string;
  mainHighlight: string;
  mainDescription: string;
  features: string[];
  aboutImage: string;
  buttonText: string;
  buttonLink: string;
}

export default function AboutPreviewEditorUi() {
  // Form fields
  const [mainHeading, setMainHeading] = useState('A Local Team You Can');
  const [mainHighlight, setMainHighlight] = useState('Trust Fully');
  const [mainDescription, setMainDescription] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');
  const [aboutImage, setAboutImage] = useState('');
  const [buttonText, setButtonText] = useState('Learn More About Us');
  const [buttonLink, setButtonLink] = useState('/about');
  
  // Track original data for "isDirty" check
  const [originalData, setOriginalData] = useState<AboutPreviewData | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Image upload states
  const [imageType, setImageType] = useState<'url' | 'file'>('url');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load existing data
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "about_preview"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as AboutPreviewData;
        setMainHeading(data.mainHeading || 'A Local Team You Can');
        setMainHighlight(data.mainHighlight || 'Trust Fully');
        setMainDescription(data.mainDescription || '');
        setFeatures(data.features || []);
        setAboutImage(data.aboutImage || '');
        setImagePreview(data.aboutImage || null);
        setButtonText(data.buttonText || 'Learn More About Us');
        setButtonLink(data.buttonLink || '/about');
        
        // Save as original for comparison
        setOriginalData(data);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Check for changes
  useEffect(() => {
    if (!originalData) return;

    const hasChanged = 
      mainHeading !== originalData.mainHeading ||
      mainHighlight !== originalData.mainHighlight ||
      mainDescription !== originalData.mainDescription ||
      buttonText !== originalData.buttonText ||
      buttonLink !== originalData.buttonLink ||
      aboutImage !== originalData.aboutImage ||
      imageFile !== null ||
      JSON.stringify(features) !== JSON.stringify(originalData.features);

    setIsDirty(hasChanged);
  }, [mainHeading, mainHighlight, mainDescription, buttonText, buttonLink, aboutImage, features, imageFile, originalData]);

  // Discard changes
  const discardChanges = useCallback(() => {
    if (originalData) {
      setMainHeading(originalData.mainHeading);
      setMainHighlight(originalData.mainHighlight);
      setMainDescription(originalData.mainDescription);
      setFeatures(originalData.features);
      setAboutImage(originalData.aboutImage);
      setImagePreview(originalData.aboutImage);
      setButtonText(originalData.buttonText);
      setButtonLink(originalData.buttonLink);
      setImageFile(null);
      setIsDirty(false);
      toast.success('Changes discarded');
    }
  }, [originalData]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear image
  const clearImage = () => {
    setAboutImage('');
    setImageFile(null);
    setImagePreview(null);
  };

  // Add feature
  const addFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  // Remove feature
  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  // Save all data
  const handleSave = async () => {
    if (!mainHeading || !mainHighlight || !mainDescription || features.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      let finalImageUrl = aboutImage;
      if (imageType === 'file' && imageFile) {
        const storageRef = ref(storage, `about/preview/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(snapshot.ref);
      }

      await setDoc(doc(db, "settings", "about_preview"), {
        mainHeading,
        mainHighlight,
        mainDescription,
        features,
        aboutImage: finalImageUrl,
        buttonText,
        buttonLink,
        updatedAt: serverTimestamp()
      });

      toast.success('About preview saved successfully!');
      setIsDirty(false);
      if (imageType === 'file') setImageFile(null);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save about preview');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-orange-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* UNSAVED CHANGES BAR - EXACT STYLE AND POSITIONING */}
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
                  onClick={handleSave} 
                  disabled={saving} 
                  className="w-full md:w-50 text-xs md:px-8 p-4 bg-orange-600 text-white rounded-xl font-black uppercase text-xs flex justify-center items-center gap-2"
                >
                  {saving ? <FaSpinner className="animate-spin" /> : <FaSave />} Save
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-slate-200">
        <h2 className="text-xl font-black text-slate-900">About Preview Editor</h2>
        <p className="text-sm text-slate-500 mt-1">Customize the about section preview on your homepage</p>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        {/* Heading Section */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Main Heading <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={mainHeading}
              onChange={(e) => setMainHeading(e.target.value)}
              placeholder="A Local Team You Can"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Highlighted Word <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={mainHighlight}
              onChange={(e) => setMainHighlight(e.target.value)}
              placeholder="Trust Fully"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={mainDescription}
            onChange={(e) => setMainDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        {/* Features */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Features / Bullet Points <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-col md:flex-row gap-2">
            <input
              type="text"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addFeature()}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
            <button onClick={addFeature} className="py-3 px-6 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex justify-center items-center gap-2 font-medium">
              <FaPlus size={14} /> Add
            </button>
          </div>
          <div className="space-y-2 mt-4">
            {features.map((feature, index) => (
              <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg group">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-sm text-slate-700">{feature}</span>
                </div>
                <button onClick={() => removeFeature(index)} className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity">
                  <FaTrash size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Image Section */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">About Image</label>
          <AnimatePresence>
            {imagePreview && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="relative w-full h-48 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 mb-4">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button onClick={clearImage} className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700"><FaTimes size={14} /></button>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setImageType('url')} className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-colors ${imageType === 'url' ? 'border-orange-600 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-500'}`}><FaGlobe className="inline mr-2" /> URL</button>
            <button onClick={() => setImageType('file')} className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition-colors ${imageType === 'file' ? 'border-orange-600 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-500'}`}><FaCloudUploadAlt className="inline mr-2" /> Upload</button>
          </div>
          {imageType === 'url' ? (
            <input type="url" value={aboutImage} onChange={(e) => { setAboutImage(e.target.value); setImagePreview(e.target.value); }} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
          ) : (
            <div className="relative">
              <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <div className="w-full px-4 py-3 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 text-sm flex items-center justify-center gap-2"><FaImage className="text-orange-500" /> Click to select an image</div>
            </div>
          )}
        </div>

        {/* Links */}
        <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Button Text</label>
            <input type="text" value={buttonText} onChange={(e) => setButtonText(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Button Link</label>
            <input type="text" value={buttonLink} onChange={(e) => setButtonLink(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
          </div>
        </div>

        {/* Static Save Button (Original) */}
        <div className="pt-6 border-t border-slate-200">
          <button onClick={handleSave} disabled={saving} className="w-full py-4 bg-green-600 text-white rounded-xl font-bold uppercase flex items-center justify-center gap-3 hover:bg-green-700 transition-colors disabled:opacity-50">
            {saving ? <FaSpinner className="animate-spin" /> : <FaSave />} Save About Preview
          </button>
        </div>
      </div>
    </div>
  );
}