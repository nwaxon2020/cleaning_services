"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaStar, FaGoogle, FaTrash, FaExclamationTriangle, FaEnvelope, FaSpinner } from "react-icons/fa";
import { HiShieldCheck } from "react-icons/hi";
import { auth, db } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from "firebase/auth";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp, 
  deleteDoc, 
  doc,
  onSnapshot 
} from "firebase/firestore";
import toast from "react-hot-toast";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

// --- CONSTANTS ---
const SECTION_BG_IMAGE = "/bg_review.jpg";

interface Review {
  id: string;
  userId?: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  createdAt: any;
}

// --- LOADING COMPONENT ---
const ReviewSkeleton = () => (
  <div className="group relative w-[280px] lg:w-full shrink-0 mx-3 lg:mx-0 p-5 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/10" />
        <div className="space-y-2">
          <div className="w-24 h-3 bg-white/10 rounded" />
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-3 h-3 bg-white/10 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
    <div className="space-y-2">
      <div className="w-full h-3 bg-white/10 rounded" />
      <div className="w-3/4 h-3 bg-white/10 rounded" />
    </div>
  </div>
);

const LoadingReviews = () => (
  <div className="flex flex-col gap-4">
    <ReviewSkeleton />
    <ReviewSkeleton />
    <ReviewSkeleton />
  </div>
);

const LoadingMarquee = () => (
  <div className="flex gap-4">
    <ReviewSkeleton />
    <ReviewSkeleton />
    <ReviewSkeleton />
  </div>
);

// --- SUB-COMPONENTS (MEMOIZED TO PREVENT LAG) ---

const StarRating = React.memo(({ rating, setRating, interactive = true }: { rating: number, setRating?: (r: number) => void, interactive?: boolean }) => (
  <div className="flex gap-1.5 justify-center py-2">
    {[1, 2, 3, 4, 5].map((s) => (
      <button
        type="button"
        key={s}
        disabled={!interactive}
        onClick={() => setRating?.(s)}
        className={`${interactive ? "hover:scale-110 active:scale-95" : "cursor-default"} transition-transform`}
      >
        <FaStar className={`text-xl ${s <= rating ? "text-orange-500" : "text-white/10"}`} />
      </button>
    ))}
  </div>
));
StarRating.displayName = "StarRating";

const ReviewCard = React.memo(({ rev, isCurrentUser }: { rev: Review, isCurrentUser: boolean }) => (
  <div className="group relative w-[280px] lg:w-full shrink-0 mx-3 lg:mx-0 p-5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md shadow-xl hover:border-orange-500/30 transition-colors">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-orange-500/20 bg-zinc-800">
          {rev.userPhoto ? (
            <Image src={rev.userPhoto} alt="" fill className="object-cover" sizes="40px" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-bold">{rev.userName.charAt(0)}</div>
          )}
        </div>
        <div>
          <h4 className="text-white font-bold text-sm leading-none">{rev.userName}</h4>
          <div className="flex gap-0.5 mt-1.5">
            {[...Array(5)].map((_, i) => (
              <FaStar key={i} size={10} className={i < rev.rating ? "text-orange-500" : "text-white/10"} />
            ))}
          </div>
        </div>
      </div>
      {isCurrentUser && (
        <span className="text-[8px] font-black text-orange-500 bg-orange-500/10 px-2 py-1 rounded-full border border-orange-500/20 uppercase">You</span>
      )}
    </div>
    <p className="text-slate-300 text-xs italic leading-relaxed line-clamp-3">"{rev.comment}"</p>
  </div>
));
ReviewCard.displayName = "ReviewCard";

const SmartReviewSection = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const pathname = usePathname();

  // 1. Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // 2. REAL-TIME Firestore Listener
  useEffect(() => {
    setLoading(true);
    
    // Create query
    const q = query(
      collection(db, "reviews"), 
      orderBy("createdAt", "desc"), 
      limit(15)
    );
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const fetched = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Review));
        setReviews(fetched);
        setLoading(false);
      },
      (error) => {
        console.error("Real-time fetch error:", error);
        toast.error("Failed to load reviews");
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array = runs once on mount

  // 3. User Review Logic
  const currentUserReview = useMemo(() => 
    reviews.find(r => r.userId === user?.uid), 
  [reviews, user]);

  // 4. Actions
  const handleAuth = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      toast.success("Welcome!");
    } catch (e) {
      toast.error("Auth failed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !comment.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "reviews"), {
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        userPhoto: user.photoURL || null,
        rating,
        comment,
        createdAt: serverTimestamp(),
      });
      setComment("");
      setRating(5); // Reset rating to default
      toast.success("Review posted!");
      // No need to reload data - real-time listener will update automatically
    } catch (e) {
      toast.error("Error posting review");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentUserReview) return;
    setSubmitting(true);
    try {
      await deleteDoc(doc(db, "reviews", currentUserReview.id));
      setShowDeleteModal(false);
      toast.success("Review deleted");
      // No need to reload data - real-time listener will update automatically
    } catch (e) {
      toast.error("Delete failed");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // Don't render on pages other than home, about, faq
  if (!["/", "/about", "/faq"].includes(pathname)) return null;

  return (
    <section className="relative w-full py-20 overflow-hidden min-h-[600px]">
      {/* Background image */}
      <div 
        className="fixed inset-0 -z-10 pointer-events-none bg-cover bg-center bg-no-repeat will-change-transform"
        style={{ backgroundImage: `url(${SECTION_BG_IMAGE})` }}
      />
      <div className="fixed inset-0 -z-[5] pointer-events-none bg-black/60 backdrop-blur-[2px]" />

      <div className="relative z-10 max-w-6xl mx-auto md:px-6">
        <header className="text-center mb-16">
          <h2 className="p-4 text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">
            what our <span className="text-orange-500">Feedback</span> says
          </h2>
          <div className="h-1.5 w-16 bg-orange-500 mx-auto mt-3 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.6)]" />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* LEFT: INPUT AREA */}
          <div className="px-3 lg:col-span-5 lg:sticky lg:top-28">
            <div className="p-4 md:p-6 rounded-3xl bg-black/50 border border-white/10 backdrop-blur-xl shadow-2xl">
              {!user ? (
                <div className="text-center py-4">
                  <HiShieldCheck className="text-6xl text-orange-500 mx-auto mb-4" />
                  <h3 className="text-white font-bold text-xl mb-2">Share Your Story</h3>
                  <p className="text-slate-400 text-sm mb-8">We only accept reviews from verified users.</p>
                  <button 
                    onClick={handleAuth}
                    className="w-full bg-white text-black py-4 rounded-xl font-black text-sm flex items-center justify-center gap-3 hover:bg-gray-200 transition-all active:scale-95"
                  >
                    <FaGoogle /> CONTINUE WITH GOOGLE
                  </button>
                  
                  <Link href="/login" className="my-4 w-full flex items-center justify-center gap-3 py-4 bg-blue-800 text-white text-xs font-black uppercase rounded-xl hover:bg-blue-900 transition-all">
                    <FaEnvelope /> Email & Password
                  </Link> 
                </div>
              ) : currentUserReview ? (
                <div className="text-center">
                  <p className="text-orange-500 font-black uppercase text-[10px] tracking-widest mb-4">You have already reviewed</p>
                  <div className="bg-white/5 border border-white/10 p-5 rounded-2xl mb-6">
                    <StarRating rating={currentUserReview.rating} interactive={false} />
                    <p className="text-slate-300 italic text-sm mt-2">"{currentUserReview.comment}"</p>
                  </div>
                  <button 
                    onClick={() => setShowDeleteModal(true)}
                    className="text-red-500 text-xs font-bold uppercase flex items-center justify-center gap-2 mx-auto hover:text-red-400 transition-colors"
                  >
                    <FaTrash /> Remove and write new one
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <StarRating rating={rating} setRating={setRating} />
                  <textarea 
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Describe your experience..."
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all resize-none"
                  />
                  <button 
                    disabled={submitting}
                    type="submit"
                    className="w-full bg-orange-500 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <FaSpinner className="animate-spin" /> Posting...
                      </span>
                    ) : "Publish Review"}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* RIGHT: REVIEWS DISPLAY */}
          <div className="lg:col-span-7 w-full overflow-hidden">
            {/* MOBILE MARQUEE (Real-time updates) */}
            <div className="lg:hidden relative">
              {loading ? (
                <div className="flex gap-4">
                  <LoadingMarquee />
                </div>
              ) : reviews.length > 0 ? (
                <div className="marquee-container flex">
                  <div className="flex animate-scroll-mobile">
                    {/* Map twice for seamless infinite loop */}
                    {[...reviews, ...reviews].map((rev, i) => (
                      <ReviewCard key={`${rev.id}-${i}`} rev={rev} isCurrentUser={user?.uid === rev.userId} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 bg-black/30 rounded-2xl border border-white/5">
                  <p className="text-slate-400 text-sm">No reviews yet. Be the first to share your experience!</p>
                </div>
              )}
            </div>

            {/* DESKTOP VERTICAL (Real-time updates) */}
            <div className="hidden lg:flex flex-col gap-4 max-h-[650px] overflow-y-auto pr-3 custom-scrollbar">
              {loading ? (
                <LoadingReviews />
              ) : reviews.length > 0 ? (
                <AnimatePresence mode="popLayout">
                  {reviews.map((rev) => (
                    <motion.div 
                      key={rev.id} 
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ReviewCard rev={rev} isCurrentUser={user?.uid === rev.userId} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              ) : (
                <div className="text-center py-16 bg-black/30 rounded-2xl border border-white/5">
                  <p className="text-slate-400 text-sm">No reviews yet. Be the first to share your experience!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DELETE MODAL */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              className="bg-zinc-900 border border-white/10 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl"
            >
              <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
              <h3 className="text-white font-bold text-xl mb-2">Are you sure?</h3>
              <p className="text-slate-400 text-sm mb-8">This will permanently delete your feedback from our platform.</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowDeleteModal(false)} 
                  className="flex-1 py-3 bg-zinc-800 text-white rounded-xl font-bold hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete} 
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
                >
                  {submitting ? <FaSpinner className="animate-spin mx-auto" /> : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        /* CUSTOM SCROLLBAR FOR DESKTOP */
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(249, 115, 22, 0.3); border-radius: 10px; }

        /* GPU ACCELERATED MARQUEE */
        @keyframes scroll-mobile {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .animate-scroll-mobile {
          animation: scroll-mobile 30s linear infinite;
          will-change: transform;
        }
        .marquee-container:hover .animate-scroll-mobile {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

export default SmartReviewSection;