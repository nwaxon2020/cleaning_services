"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
import { FiUser, FiMail, FiPhone, FiFileText, FiUploadCloud } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function EmploymentFormUi() {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email')?.toString().toLowerCase().trim();

    try {
      // STEP 1: Email check
      console.log("🔍 STEP 1: Checking email uniqueness for:", email);
      const q = query(collection(db, "employment_applications"), where("email", "==", email));
      const querySnapshot = await getDocs(q);
      console.log("📊 Email check result:", querySnapshot.empty ? "✅ New email" : "❌ Email exists");

      if (!querySnapshot.empty) {
        toast.error("You have already submitted an application with this email.");
        setLoading(false);
        return;
      }

      // STEP 2: File upload - Store only the path, not the URL
      console.log("🔍 STEP 2: Processing file upload");
      let documentPath = "";
      if (file) {
        try {
          console.log("📤 Uploading file:", file.name);
          const fileName = `${Date.now()}_${file.name}`;
          const fileRef = ref(storage, `cvs/${fileName}`);
          await uploadBytes(fileRef, file);
          console.log("✅ File uploaded successfully");
          
          // Store ONLY the path, not the URL
          documentPath = `cvs/${fileName}`;
          console.log("🔗 Document path:", documentPath);
        } catch (storageError: any) {
          console.error("❌ STORAGE ERROR:", {
            code: storageError.code,
            message: storageError.message,
            name: storageError.name
          });
          toast.error(`File upload failed: ${storageError.message}`);
          setLoading(false);
          return;
        }
      } else {
        console.log("⚠️ No file to upload");
      }

      // STEP 3: Prepare data
      console.log("🔍 STEP 3: Preparing application data");
      const applicationData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: email,
        phone: formData.get('phone'),
        coverLetter: formData.get('coverLetter') || "",
        documentPath: documentPath, // CHANGED: from documentUrl to documentPath
        status: 'pending',
        createdAt: serverTimestamp(),
      };
      console.log("📦 Application data:", applicationData);

      // STEP 4: Save to Firestore
      console.log("🔍 STEP 4: Saving to Firestore...");
      const docRef = await addDoc(collection(db, "employment_applications"), applicationData);
      console.log("✅ FIRESTORE SUCCESS! Document ID:", docRef.id);

      toast.success("Your application was submitted successfully!");
      
      // Reset form
      (e.target as HTMLFormElement).reset();
      setFile(null);
      
      // Redirect
      setTimeout(() => {
        router.push('/');
      }, 2000);
      
    } catch (error: any) {
      console.error("❌❌❌ FULL ERROR OBJECT:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Error name:", error.name);
      
      // Specific error messages
      if (error.code === 'permission-denied') {
        toast.error("Permission denied. Please check Firebase rules.");
      } else if (error.code === 'not-found') {
        toast.error("Firestore collection not found.");
      } else if (error.code === 'invalid-argument') {
        toast.error("Invalid data format.");
      } else if (error.message?.includes('network')) {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error(`Error: ${error.message || "Please try again"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 flex items-center justify-center px-2 md:p-6 py-20 md:py-25">
      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-xl shadow-[0_32px_64px_-15px_rgba(0,0,0,0.1)] rounded-xl border border-white p-4 md:p-9 relative overflow-hidden">
        
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-100 rounded-full blur-3xl opacity-50" />
        
        <header className="relative z-10 mb-10 text-center">
          <span className="inline-block px-4 py-1.5 mb-4 text-xs font-bold tracking-widest text-orange-600 uppercase bg-orange-100 rounded-full">
            Careers
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Join Our Team</h2>
          <p className="text-slate-500 mt-2 font-medium">Submit your details to start your journey.</p>
        </header>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="relative">
              <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input required name="firstName" placeholder="First Name" className="w-full pl-11 pr-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:ring-2 ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" />
            </div>
            <div className="relative">
              <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input required name="lastName" placeholder="Last Name" className="w-full pl-11 pr-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:ring-2 ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" />
            </div>
          </div>

          <div className="relative">
            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input required name="email" type="email" placeholder="Email Address" className="w-full pl-11 pr-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:ring-2 ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" />
          </div>

          <div className="relative">
            <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input required name="phone" type="tel" placeholder="Phone Number" className="w-full pl-11 pr-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:ring-2 ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm" />
          </div>

          <div className="relative">
            <div className="flex justify-between items-center mb-1 px-1">
               <label className="text-xs font-bold text-slate-400 uppercase">Cover Letter</label>
               <span className="text-[10px] font-bold text-slate-300 italic">Optional</span>
            </div>
            <FiFileText className="absolute left-4 top-[52px] text-slate-400" />
            <textarea name="coverLetter" placeholder="Tell us a bit about yourself..." rows={4} className="w-full pl-11 pr-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:ring-2 ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm resize-none" />
          </div>
          
          <div className="group relative border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center bg-slate-50/50 hover:bg-white hover:border-orange-500 transition-all cursor-pointer">
            <input 
              required 
              type="file" 
              accept=".pdf,.doc,.docx,.jpg,.png"
              onChange={(e) => setFile(e.target.files?.[0] || null)} 
              className="absolute inset-0 opacity-0 cursor-pointer z-20" 
            />
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FiUploadCloud className="text-orange-600 text-xl" />
              </div>
              <p className="text-sm font-bold text-slate-700">
                {file ? file.name : "Upload CV / Documents *"}
              </p>
              <p className="text-xs text-slate-400 mt-1">PDF, Word or Image (Required)</p>
            </div>
          </div>

          <button 
            disabled={loading} 
            className="w-full py-5 bg-orange-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-orange-700 hover:shadow-[0_20px_40px_-10px_rgba(234,88,12,0.3)] disabled:bg-slate-300 disabled:shadow-none transition-all active:scale-[0.98]"
          >
            {loading ? "Sending..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}