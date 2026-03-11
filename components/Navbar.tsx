"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineMenuAlt3, HiX, HiAdjustments, HiLogout, HiUserCircle, HiCamera, HiBell, HiChevronDown } from "react-icons/hi"; 
import { FaHeadset } from "react-icons/fa";
import UserAvatar from "@/components/auth/UserAvatar";
import { auth, storage, db } from "@/lib/firebase"; 
import { onAuthStateChanged, User, signOut, updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import toast from "react-hot-toast";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false); 
  const [isProfileOpen, setIsProfileOpen] = useState(false); 
  const [isAboutOpen, setIsAboutOpen] = useState(false); 
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [unreadCount, setUnreadCount] = useState(0); 
  const [uploading, setUploading] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  
  const [siteData, setSiteData] = useState<any>(null);
  // New state for contact information
  const [contactData, setContactData] = useState<any>(null);

  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);

  const ADMIN_ID = process.env.NEXT_PUBLIC_ADMIN_ID; 

  const whitePages = ["/about", "/faq", "/login", "/services"];
  const isWhitePage = whitePages.includes(pathname);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    // REAL-TIME SITE SETTINGS LISTENER
    const unsubSite = onSnapshot(doc(db, "settings", "site"), 
      (snap) => {
        if (snap.exists()) {
          setSiteData(snap.data());
        }
      },
      (err) => {
        if (err.code !== 'permission-denied') console.error("Site Settings Error:", err);
      }
    );

    // NEW: REAL-TIME CONTACT INFO LISTENER
    const unsubContact = onSnapshot(doc(db, "settings", "contact_info"), 
      (snap) => {
        if (snap.exists()) {
          setContactData(snap.data());
        }
      },
      (err) => {
        if (err.code !== 'permission-denied') console.error("Contact Info Error:", err);
      }
    );
    
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (currentUser?.email) {
        setUser(currentUser);
        
        if (currentUser.uid === ADMIN_ID) {
          unsubscribeSnapshot = onSnapshot(collection(db, "chats"), 
            (snapshot) => {
              let total = 0;
              snapshot.docs.forEach(doc => total += (doc.data().unreadCountAdmin || 0));
              setUnreadCount(total);
            },
            (err) => {
              if (err.code !== 'permission-denied') console.error("Admin Chat Error:", err);
            }
          );
        } else {
          unsubscribeSnapshot = onSnapshot(doc(db, "chats", currentUser.uid), 
            (docSnap) => {
              if (docSnap.exists()) setUnreadCount(docSnap.data().unreadCountUser || 0);
            },
            (err) => {
              if (err.code !== 'permission-denied') console.warn("User Chat Error:", err.message);
            }
          );
        }
      } else {
        setUser(null);
        setUnreadCount(0);
      }
    });

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
      unsubscribeAuth();
      unsubSite();
      unsubContact(); // Clean up contact listener
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, [ADMIN_ID]);

  // Rest of your logic (handleSubscribe, handleSignOut, handleImageChange) remains exactly the same
  const handleSubscribe = async () => {
    if (!user?.email) return;
    setSubscribing(true);
    try {
      const q = query(collection(db, "news_letters"), where("email", "==", user.email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        toast.error("Already subscribed!");
        return;
      }
      await addDoc(collection(db, "news_letters"), {
        email: user.email,
        uid: user.uid,
        subscribedAt: serverTimestamp(),
      });
      toast.success("Subscribed!");
      setIsProfileOpen(false);
      setIsOpen(false);
    } catch (e) {
      toast.error("Failed to subscribe");
    } finally {
      setSubscribing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsOpen(false);
      setIsProfileOpen(false);
      toast.success("Signed out");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large (Max 5MB)");
      return;
    }
    setUploading(true);
    const storageRef = ref(storage, `profiles/${user.uid}/avatar`);
    try {
      const metadata = { contentType: file.type };
      const snapshot = await uploadBytes(storageRef, file, metadata);
      const downloadURL = await getDownloadURL(snapshot.ref);
      await updateProfile(user, { photoURL: downloadURL });
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { 
        photoURL: downloadURL,
        email: user.email,
        displayName: user.displayName,
        lastUpdated: serverTimestamp()
      }, { merge: true }); 
      toast.success("Avatar updated!");
      window.location.reload();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Upload failed: " + (error.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Services", href: "/services" },
    { name: "Chat", href: "/chat", isChat: true },
  ];

  const aboutLinks = [
    { name: "About Us", href: "/about" },
    { name: "FAQ", href: "/faq" },
    { name: "Location", href: "/location" },
  ];

  const isAboutActive = aboutLinks.some(link => link.href === pathname);
  const siteName = siteData?.siteName || "";
  const nameParts = siteName.split(" ");
  const firstWord = nameParts[0];
  const secondWord = nameParts.slice(1).join(" ");

  // Global Contact Link Logic
  const displayPhone = contactData?.generalPhone || "+44..000...";
  const dialPhone = displayPhone.replace(/\s+/g, '');

  return (
    <nav className={`fixed left-0 right-0 z-[30] transition-all duration-500 ease-in-out ${scrolled ? "top-2 px-3" : "top-0 px-0"}`}>
      <div className={`max-w-8xl mx-auto transition-all duration-500 px-4 md:px-10 flex justify-between items-center ${scrolled ? "bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl h-14 md:h-16" : "bg-black/20 md:bg-transparent h-16 md:h-20 border-transparent"}`}>
        
        <Link href="/" className="group flex items-center gap-2 shrink-0">
          <img 
            src={siteData?.logoUrl || "/favicon.png"} 
            alt="Site Logo" 
            className="bg-white w-8 h-8 md:w-11 md:h-11 rounded-full object-contain transition-transform group-hover:scale-110 duration-300"
          />

          <div className="flex flex-col justify-center">
            <span className={`text-[10px] md:text-xl font-black tracking-tighter leading-none uppercase`}>
              <span className={isWhitePage ? "text-zinc-400" : "text-white"}>{firstWord}</span>
              <span className="text-orange-500 group-hover:text-orange-400 transition-colors">{secondWord}</span>
            </span>

            <div className="w-full h-[1px] bg-white/20 mt-1 mb-1 group-hover:bg-orange-500/50 transition-colors" />

            <span className="text-[8px] md:text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase leading-none italic">
              {siteData?.siteSlogan || ""}
            </span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-5">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`relative px-4 py-2 text-sm uppercase tracking-widest font-semibold transition-colors duration-300 ${
                pathname === link.href
                  ? isWhitePage ? "text-orange-500 font-black" : "text-white font-black" 
                  : isWhitePage ? "text-slate-400 hover:text-orange-500" : "text-gray-200 hover:text-white"
              }`}
            >
              {link.name}
              {link.isChat && unreadCount > 0 && pathname !== "/chat" && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[8px] font-black text-white ring-2 ring-black">
                  {unreadCount}
                </span>
              )}
              {pathname === link.href && <motion.div layoutId="nav-underline" className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500 mx-4" />}
            </Link>
          ))}

          <div 
            className="relative group h-full flex items-center" 
            ref={aboutRef}
            onMouseEnter={() => setIsAboutOpen(true)}
            onMouseLeave={() => setIsAboutOpen(false)}
          >
            <button className={`flex items-center gap-1 px-4 py-2 text-sm uppercase tracking-widest font-semibold transition-colors duration-300 ${
              isAboutActive 
                ? isWhitePage ? "text-orange-500 font-black" : "text-white font-black" 
                : isWhitePage ? "text-slate-400 hover:text-orange-500" : "text-gray-200 group-hover:text-white"
            }`}>
              About <HiChevronDown className={`transition-transform duration-300 ${isAboutOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {isAboutOpen && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={`absolute top-full left-0 mt-0 w-48 border rounded-xl shadow-2xl overflow-hidden py-2 ${isWhitePage ? "bg-white border-slate-100" : "bg-zinc-900 border-white/10"}`}>
                  {aboutLinks.map((link) => (
                    <Link key={link.name} href={link.href} className={`block px-4 py-2 text-[10px] uppercase font-black tracking-widest transition-colors ${
                      pathname === link.href 
                        ? "text-orange-500 bg-orange-500/5" 
                        : isWhitePage ? "text-slate-600 hover:bg-slate-50 hover:text-orange-500" : "text-gray-300 hover:bg-orange-500/50 hover:text-white"
                    }`}>
                      {link.name}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 shrink-0 relative" ref={dropdownRef}>
          {user && user.uid === ADMIN_ID ? (
            <Link href="/admin" className="p-2 bg-orange-500/10 text-orange-400 font-black rounded-lg hover:bg-orange-500 hover:text-white transition-all">
              <HiAdjustments size={20} />
            </Link>
          ): (
            /* Updated Contact Number Section */
            <Link href={`tel:${dialPhone}`} className={`hidden md:flex items-center gap-2 p-2 underline bg-black/90 rounded-lg text-gray-50 text-sm hover:bg-gray-900 transition-colors`}>
              <FaHeadset size={16} className="text-white" /> 
              <span>{displayPhone}</span>
            </Link>
          )}

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                <span className="hidden md:block text-[10px] font-black text-orange-400 uppercase tracking-widest">{user.displayName?.split(" ")[0]}</span>
                <div className="w-8 h-8 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-orange-500 hover:scale-105 transition-transform">
                   <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=f97316&color=fff`} alt="profile" className="w-full h-full object-cover" />
                </div>
              </div>
            ) : (
              <Link href="/login" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-orange-500 text-white text-[10px] md:text-xs font-black uppercase tracking-widest rounded-lg hover:bg-orange-600 transition-all">
                <HiUserCircle size={16} /> <span className="hidden md:inline">Sign In</span>
              </Link>
            )}

            {/* Profile Dropdown and Mobile Menu logic below remain identical to your original code */}
            <AnimatePresence>
              {isProfileOpen && user && (
                <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="hidden md:block absolute top-[calc(100%+15px)] right-0 w-64 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-3 z-[100]">
                  <div className="flex items-center gap-3 p-3 border-b border-white/5 mb-2">
                    <div className="relative cursor-pointer group shrink-0" onClick={() => fileInputRef.current?.click()}>
                      <UserAvatar />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <HiCamera className="text-white text-xs" />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-white font-bold text-xs truncate w-32">{uploading ? "Uploading..." : user.displayName}</p>
                      <p className="text-zinc-500 text-[10px] truncate w-32">{user.email}</p>
                    </div>
                  </div>
                  
                  <button onClick={handleSubscribe} disabled={subscribing} className="w-full flex items-center gap-3 p-3 text-black bg-white hover:bg-gray-200 rounded-xl font-bold text-xs uppercase tracking-widest transition-all mb-1">
                    <HiBell/> {subscribing ? "Wait..." : "Subscribe"}
                  </button>

                  <button onClick={handleSignOut} className="w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-500/10 rounded-xl font-bold text-xs uppercase tracking-widest transition-all">
                    <HiLogout size={18} /> Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />

            <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-white bg-zinc-700/10 rounded-lg active:bg-orange-500 transition-colors flex items-center justify-center">
              {isOpen ? <HiX size={22} /> : <HiOutlineMenuAlt3 size={22} />}
              {!isOpen && unreadCount > 0 && pathname !== "/chat" && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-black text-white border-2 border-black">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu AnimatePresence remains exactly the same */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-[calc(100%+8px)] left-0 right-0 md:hidden bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-[40] mx-2">
            <div className="p-4 flex flex-col gap-2">
              {user && user.uid === ADMIN_ID && (
                <Link href="/admin" onClick={() => setIsOpen(false)} className="flex items-center gap-3 text-orange-500 font-bold p-4 rounded-xl bg-orange-500/10">
                  <HiAdjustments size={22} /> Admin Dashboard
                </Link>
              )}
              {navLinks.map((link) => (
                <Link key={link.name} href={link.href} onClick={() => setIsOpen(false)} className={`relative text-lg font-bold py-3 px-4 rounded-xl transition-all ${pathname === link.href ? "bg-orange-500 text-white" : "text-gray-300"}`}>
                  {link.name}
                  {link.isChat && unreadCount > 0 && pathname !== "/chat" && (
                    <span className="ml-3 px-2 py-0.5 bg-orange-500 text-white text-[10px] rounded-full">
                      {unreadCount} New
                    </span>
                  )}
                </Link>
              ))}
              <div className="bg-zinc-800/50 rounded-xl overflow-hidden">
                <p className="px-4 pt-2 text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">Company</p>
                {aboutLinks.map((link) => (
                  <Link key={link.name} href={link.href} onClick={() => setIsOpen(false)} className={`block text-lg font-bold p-4 transition-all ${pathname === link.href ? "text-orange-500" : "text-gray-300"}`}>
                    {link.name}
                  </Link>
                ))}
              </div>
              {user && (
                <button onClick={handleSubscribe} className="flex items-center gap-3 text-black font-bold p-4 rounded-xl bg-white border border-orange-500/20">
                  <HiBell/> {subscribing ? "Subscribing..." : "Subscribe to News"}
                </button>
              )}
              {user && (
                <button onClick={handleSignOut} className="my-2 flex items-center gap-3 text-red-500 font-bold p-4 rounded-xl bg-red-500/10 active:bg-red-500 active:text-white transition-all">
                  <HiLogout size={22} /> Sign Out
                </button>
              )}
              {user && (
                <div className="mt-1 pt-4 border-t border-white/10 flex items-center gap-3 px-2 pb-2">
                  <div onClick={() => fileInputRef.current?.click()} className="relative cursor-pointer group shrink-0">
                    <UserAvatar />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <HiCamera className="text-white text-xs" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-sm leading-tight">{user.displayName}</span>
                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest italic">{user.email}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;