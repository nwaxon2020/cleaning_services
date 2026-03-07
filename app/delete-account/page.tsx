"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { auth, db } from "@/lib/firebase";
import { 
  onAuthStateChanged, 
  reauthenticateWithCredential, 
  EmailAuthProvider, 
  deleteUser 
} from "firebase/auth";
import { doc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { FaExclamationTriangle, FaLock, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";

export default function DeleteAccountPage() {
  const [user, setUser] = useState<any>(null);
  const [password, setPassword] = useState("");
  const [showOverlay, setShowOverlay] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEmailUser, setIsEmailUser] = useState(false);
  const router = useRouter();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Check if the user signed in with 'password' provider
        const isEmail = currentUser.providerData.some(
          (p) => p.providerId === "password"
        );
        setIsEmailUser(isEmail);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // If not an email user, don't show the page content
  if (!isEmailUser) return null;

  const handleDeleteRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setShowOverlay(true);
  };

  const confirmAccountDeletion = async () => {
    if (!user || !password) return;
    setLoading(true);

    try {
      // 1. Re-authenticate the user
      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);

      // 2. Delete User Data from Firestore (Clean up reviews, etc.)
      const reviewsRef = collection(db, "reviews");
      const q = query(reviewsRef, where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      const deletePromises = querySnapshot.docs.map((docSnap) => 
        deleteDoc(doc(db, "reviews", docSnap.id))
      );
      await Promise.all(deletePromises);

      // 3. Delete the Auth User
      await deleteUser(user);

      toast.success("Account and data deleted successfully.");
      router.push("/");
    } catch (error: any) {
      console.error(error);
      if (error.code === "auth/wrong-password") {
        toast.error("Incorrect password.");
      } else {
        toast.error("Deletion failed. Try logging out and back in.");
      }
      setShowOverlay(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative">
      <div className="max-w-md w-full bg-zinc-900 border border-white/10 p-8 rounded-3xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaTrash size={24} />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">Delete Account</h1>
          <p className="text-gray-400 text-sm mt-2">
            This will permanently remove your reviews and profile.
          </p>
        </div>

        <form onSubmit={handleDeleteRequest} className="space-y-6">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Confirm Password</label>
            <div className="relative mt-2">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your current password"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white outline-none focus:border-red-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-red-600 text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-red-700 active:scale-95 transition-all shadow-lg shadow-red-600/20"
          >
            Request Data Deletion
          </button>
        </form>
      </div>

      {/* CONFIRMATION OVERLAY */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-sm w-full bg-zinc-900 border border-white/20 p-8 rounded-3xl text-center shadow-3xl"
            >
              <FaExclamationTriangle className="text-orange-500 text-5xl mx-auto mb-6" />
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Final Confirmation</h2>
              <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                Are you absolutely sure? All your data in <span className="text-white">Bristol City Cleaning</span> will be lost forever.
              </p>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <button
                  onClick={() => setShowOverlay(false)}
                  className="py-3 rounded-xl bg-zinc-800 text-white font-bold text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAccountDeletion}
                  disabled={loading}
                  className="py-3 rounded-xl bg-red-600 text-white font-bold text-xs uppercase disabled:opacity-50"
                >
                  {loading ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}