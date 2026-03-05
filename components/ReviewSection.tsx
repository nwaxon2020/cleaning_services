"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaStar, FaGoogle, FaTrash, FaExclamationTriangle } from "react-icons/fa"; 
import { HiMail, HiShieldCheck } from "react-icons/hi";
import { auth, db } from "@/lib/firebase";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";
import {
  collection,
  addDoc,
  query,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { useRouter, usePathname } from "next/navigation";

// --- CONFIGURABLE BACKGROUND IMAGE ---
const SECTION_BG_IMAGE = "https://img.freepik.com/free-photo/group-happy-african-volunteers-with-garbage-bags-cleaning-area-park-africa-volunteering-charity-people-ecology-concept_627829-351.jpg?semt=ais_rp_progressive&w=740&q=80"; 

interface Review {
  id: string;
  userId?: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  createdAt: any;
  isMock?: boolean;
}

const MOCK_REVIEWS: Review[] = [
  {
    id: "mock-1",
    userName: "Sarah Jenkins",
    rating: 5,
    comment: "The best cleaning service in Boston. My office has never looked this sharp.",
    createdAt: new Date(),
    isMock: true,
    userPhoto: "https://i.pravatar.cc/150?u=sarah"
  },
  {
    id: "mock-2",
    userName: "David Thompson",
    rating: 5,
    comment: "Fast, reliable, and professional. The team arrived exactly on time. Highly recommended.",
    createdAt: new Date(),
    isMock: true,
    userPhoto: "https://i.pravatar.cc/150?u=david"
  }
];

const SmartReviewSection = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    fetchRealReviews();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const existing = reviews.find(r => r.userId === user.uid);
      setUserReview(existing || null);
    } else {
      setUserReview(null);
    }
  }, [reviews, user]);

  const fetchRealReviews = async () => {
    try {
      const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"), limit(20));
      const snapshot = await getDocs(q);
      const realData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Review));
      setReviews([...realData, ...MOCK_REVIEWS]);
    } catch (e) { 
      console.error("Firestore error:", e); 
    }
  };

  const handleStartInteraction = () => {
    setIsPaused(true);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
  };

  const handleEndInteraction = () => {
    pauseTimerRef.current = setTimeout(() => setIsPaused(false), 10000);
  };

  const confirmDelete = async () => {
    if (!userReview) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, "reviews", userReview.id));
      toast.success("Review deleted");
      setShowDeleteModal(false);
      fetchRealReviews();
    } catch (e) {
      toast.error("Error deleting review");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success("Signed in successfully");
    } catch (e) { 
      toast.error("Google Auth failed"); 
    }
  };

  const handleEmailRedirect = () => {
    router.push(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "reviews"), {
        userId: user.uid,
        userName: user.displayName || "Client",
        userPhoto: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=f97316&color=fff`,
        rating,
        comment,
        createdAt: serverTimestamp(),
      });
      toast.success("Review posted!");
      setComment("");
      fetchRealReviews();
    } catch (e) { 
      toast.error("Error posting review"); 
    }
    setLoading(false);
  };

  // Only render section on Home or About pages
  if (!["/faq", "/", "/about",].includes(pathname)) return null;

  return (
    <section className="relative w-full py-12 md:py-20 md:px-6 overflow-hidden">
      {/* FIXED BACKGROUND IMAGE */}
      <div 
        className="absolute inset-0 z-0 bg-fixed bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${SECTION_BG_IMAGE})` }}
      />
      {/* OVERLAY */}
      <div className="absolute inset-0 z-[1] bg-black/40 backdrop-blur-[1px] bg-gradient-to-b from-transparent via-black/20 to-black/60" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="px-5 text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight uppercase drop-shadow-lg">
            What Clients Say <span className="text-orange-500">About Us</span>
          </h2>
          <div className="h-1 w-10 bg-orange-500 mx-auto rounded-full shadow-lg shadow-orange-500/50"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-10 items-start">
          <div className="px-4 lg:col-span-5 lg:sticky lg:top-24 w-full">
            <div className="relative p-6 rounded-2xl bg-black/60 border border-white/20 backdrop-blur-2xl shadow-2xl">
              {!user ? (
                <div className="relative z-10 text-center py-4">
                  <HiShieldCheck className="text-4xl text-orange-500 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-white mb-1 tracking-tight">Verified Reviews Only</h3>
                  <p className="text-slate-300 text-xs mb-6 font-medium">Log in to share your experience.</p>
                  
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={handleGoogleAuth}
                      className="flex items-center justify-center gap-2 bg-white text-slate-950 py-3 rounded-lg font-bold text-sm hover:bg-orange-500 hover:text-white transition-all active:scale-95 w-full"
                    >
                      <FaGoogle /> Sign in with Google
                    </button>
                    <button 
                      onClick={handleEmailRedirect}
                      className="flex items-center justify-center gap-2 bg-slate-800 text-white border border-slate-700 py-3 rounded-lg text-sm font-semibold hover:bg-slate-700 transition-all w-full"
                    >
                      <HiMail className="text-lg" /> Email & Password
                    </button>
                  </div>
                </div>
              ) : userReview ? (
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img 
                        src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=f97316&color=fff`} 
                        className="w-10 h-10 rounded-full border border-orange-500/50 p-0.5 object-cover" 
                        alt="profile" 
                      />
                      <div>
                        <p className="text-white text-sm font-bold leading-none mb-1">Your Review</p>
                        <p className="text-orange-500 text-[9px] uppercase font-black tracking-widest italic">Here is what you said</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowDeleteModal(true)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      title="Delete and rewrite"
                    >
                      <FaTrash size={16} />
                    </button>
                  </div>
                  
                  <div className="flex gap-1.5 py-1">
                    {[...Array(5)].map((_, idx) => (
                      <FaStar key={idx} className={`text-xl ${idx < userReview.rating ? "text-orange-500" : "text-white/10"}`} />
                    ))}
                  </div>

                  <div className="bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-slate-200 italic min-h-[100px] leading-relaxed">
                    "{userReview.comment}"
                  </div>
                  
                  <p className="text-[10px] text-slate-400 text-center uppercase tracking-tighter font-semibold">
                    Delete your review to write a new one
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=f97316&color=fff`} 
                      className="w-10 h-10 rounded-full border border-orange-500/50 p-0.5 object-cover" 
                      alt="profile" 
                    />
                    <div>
                      <p className="text-white text-sm font-bold leading-none mb-1">{user.displayName || 'User'}</p>
                      <p className="text-orange-500 text-[9px] uppercase font-black tracking-widest">Verified Member</p>
                    </div>
                  </div>

                  <div className="flex gap-1.5 py-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button type="button" key={s} onClick={() => setRating(s)}>
                        <FaStar className={`text-xl transition-colors ${s <= rating ? "text-orange-500" : "text-white/10"}`} />
                      </button>
                    ))}
                  </div>

                  <textarea 
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write your review here..."
                    className="w-full bg-black/40 border border-white/20 rounded-lg p-3 text-sm text-white focus:ring-1 focus:ring-orange-500/50 outline-none h-24 transition-all"
                  />
                  
                  <button 
                    disabled={loading}
                    className="w-full bg-orange-500 py-3 rounded-lg font-bold text-white text-sm uppercase tracking-wider shadow-lg hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? "Posting..." : "Submit Review"}
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 w-full overflow-hidden" ref={containerRef}>
            {/* MOBILE VIEW */}
            <div className="lg:hidden w-full cursor-grab active:cursor-grabbing">
              <motion.div 
                className="flex gap-4 w-max py-4"
                drag="x"
                dragConstraints={{ right: 0, left: -1500 }}
                onDragStart={handleStartInteraction}
                onDragEnd={handleEndInteraction}
                animate={isPaused ? undefined : { x: [0, -1500] }}
                transition={{
                  x: {
                    repeat: Infinity,
                    repeatType: "loop",
                    duration: 40,
                    ease: "linear"
                  }
                }}
              >
                {[...reviews, ...reviews, ...reviews].map((rev, i) => (
                  <ReviewCard key={`${rev.id}-${i}`} rev={rev} user={user} isMobile />
                ))}
              </motion.div>
            </div>

            {/* DESKTOP VIEW */}
            <div className="hidden lg:block relative group/list h-full">
              <div className="max-h-[600px] overflow-y-auto pr-2 flex flex-col gap-4 scrollbar-hide">
                <AnimatePresence mode="popLayout">
                  {reviews.map((rev) => (
                    <motion.div
                      key={rev.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <ReviewCard rev={rev} user={user} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showDeleteModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm bg-slate-900 border border-white/10 p-6 rounded-2xl shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaExclamationTriangle size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Review?</h3>
              <p className="text-slate-400 text-sm mb-6">
                This action cannot be undone. You will need to write a new review from scratch.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {loading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

const ReviewCard = ({ rev, user, isMobile = false }: { rev: Review, user: User | null, isMobile?: boolean }) => (
  <div className={`
    p-5 rounded-2xl bg-black/60 border border-white/20 hover:border-orange-500/40 transition-all group relative select-none backdrop-blur-xl shadow-xl
    ${isMobile ? "w-[80vw] sm:w-[320px] shrink-0" : "w-full"}
  `}>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <img 
          src={rev.userPhoto || `https://ui-avatars.com/api/?name=${rev.userName}&background=334155&color=fff`}
          className="w-9 h-9 rounded-full object-cover border-2 border-orange-500/20 pointer-events-none"
          alt={rev.userName}
        />
        <div>
          <h4 className="text-white font-bold text-sm leading-none">{rev.userName}</h4>
          <div className="flex gap-0.5 mt-1.5">
            {[...Array(5)].map((_, idx) => (
              <FaStar key={idx} size={9} className={idx < rev.rating ? "text-orange-500" : "text-white/10"} />
            ))}
          </div>
        </div>
      </div>
      
      {user?.uid === rev.userId ? (
          <span className="text-[7px] text-orange-500 uppercase font-black tracking-widest bg-orange-500/10 px-2 py-1 rounded-full border border-orange-500/20">YOU</span>
      ) : (
        (rev.isMock || rev.userId) && (
          <span className="text-[7px] text-white/40 uppercase font-black tracking-widest bg-white/5 px-2 py-1 rounded-full border border-white/5">Verified</span>
        )
      )}
    </div>
    <p className="text-slate-200 text-xs leading-relaxed italic line-clamp-3 pointer-events-none py-1">
      "{rev.comment}"
    </p>
  </div>
);

export default SmartReviewSection;