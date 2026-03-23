"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FaFacebook, FaTwitter, FaInstagram, FaGoogle, FaMapMarkerAlt } from 'react-icons/fa';
import { HiLogout, HiMail, HiTrash } from 'react-icons/hi';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from 'firebase/auth';
import toast from 'react-hot-toast';

const Footer = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isEmailUser, setIsEmailUser] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // --- DYNAMIC DATA STATES ---
  const [siteSettings, setSiteSettings] = useState<any>({});
  const [contactInfo, setContactInfo] = useState<any>({});

  useEffect(() => {
    // 1. Auth Listener
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.email) {
        setUser(currentUser);
        const hasPasswordProvider = currentUser.providerData.some(
          (provider) => provider.providerId === 'password'
        );
        setIsEmailUser(hasPasswordProvider);
      } else {
        setUser(null);
        setIsEmailUser(false);
      }
    });

    // 2. Site Settings Listener (Logo, Name, Slogan, Quote)
    const unsubSite = onSnapshot(doc(db, "settings", "site"), (snap) => {
      if (snap.exists()) setSiteSettings(snap.data());
    });

    // 3. Contact Info Listener (Socials, Phone, Email, Address)
    const unsubContact = onSnapshot(doc(db, "settings", "contact_info"), (snap) => {
      if (snap.exists()) setContactInfo(snap.data());
    });

    return () => {
      unsubscribeAuth();
      unsubSite();
      unsubContact();
    };
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleGoogleAuth = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success("Signed in with Google");
    } catch (e) {
      toast.error("Google Auth failed");
    }
  };

  const handleEmailRedirect = () => {
    router.push('/login');
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out");
    } catch (e) {
      toast.error("Error signing out");
    }
  };

  // Handle service click - works both on services page and other pages
  const handleServiceClick = (category: string) => {
    // Set the localStorage for the active tab
    localStorage.setItem('lastVisitedServiceTab', category);
    
    // If already on services page, just refresh to update the active tab
    if (pathname === '/services') {
      // Force a page reload to trigger the services page to read the new localStorage
      window.location.reload();
      // Scroll to top after reload
      setTimeout(scrollToTop, 100);
    } else {
      // If on another page, navigate to services
      router.push('/services');
      // Scroll to top after navigation
      setTimeout(scrollToTop, 100);
    }
  };

  // Handle navigation link click (for normal links)
  const handleNavClick = (href: string) => {
    if (pathname !== href) {
      router.push(href);
      setTimeout(scrollToTop, 100);
    } else {
      // If already on the page, just scroll to top
      scrollToTop();
    }
  };

  return (
    <footer className="bg-black text-white pt-16 pb-8 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid grid-cols-1 md:grid-cols-5 gap-14 mb-12">
          
          {/* Company & Auth Section */}
          <div className="md:col-span-2 space-y-8">
            <div>
              <div className="mb-2 flex items-center gap-1 md:gap-3">
                <img 
                  src={siteSettings.logoUrl || "/favicon.png"} 
                  alt="Logo" 
                  className="w-8 h-8 md:w-10 md:h-10 object-contain rounded-full"
                />
                <div className="flex flex-col">
                  <h3 className="text-[10px] md:text-2xl font-black uppercase tracking-tighter leading-none">
                    {siteSettings.siteName?.split(/(?=[A-Z])/)[0] || "Bristol"}
                    <span className="text-orange-500">
                      {siteSettings.siteName?.split(/(?=[A-Z])/)[1] || "Clean"}
                    </span>
                  </h3>
                  <div className="w-full h-[1px] bg-zinc-800 my-1 md:my-1.5" />
                  <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 leading-none italic">
                    {siteSettings.siteSlogan || "Premier Cleaning"}
                  </p>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                {siteSettings.siteQuote || "Making Bristol sparkle. Professional eco-friendly cleaning services you can trust."}
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Member Access</h4>
              {!user ? (
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleEmailRedirect}
                    className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    <HiMail size={18} className="text-orange-500" /> Email & Password Login
                  </button>

                  <button 
                    onClick={handleGoogleAuth}
                    className="w-full flex items-center justify-center gap-3 bg-white text-black py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all shadow-lg"
                  >
                    <FaGoogle /> Google Sign In
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 p-4 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[10px] uppercase font-black text-green-500 tracking-widest">Active Session</p>
                  <p className="text-xs text-white truncate mb-2">{user.email}</p>
                  
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={handleSignOut}
                      className="flex items-center gap-2 text-red-500 hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition-colors"
                    >
                      <HiLogout size={14} /> Sign Out
                    </button>

                    {isEmailUser && (
                      <Link 
                        href="/delete-account" 
                        className="flex items-center gap-1 text-zinc-500 hover:text-red-500 text-[9px] font-black uppercase tracking-tighter transition-colors"
                        onClick={scrollToTop}
                      >
                        <HiTrash size={12} /> Delete Data
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-black mb-6 text-orange-500 uppercase tracking-[0.2em]">Navigation</h4>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => handleNavClick('/')}
                  className="text-gray-400 hover:text-white text-sm transition-colors cursor-pointer w-full text-left"
                >
                  Home
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavClick('/services')}
                  className="text-gray-400 hover:text-white text-sm transition-colors cursor-pointer w-full text-left"
                >
                  Services
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavClick('/about')}
                  className="text-gray-400 hover:text-white text-sm transition-colors cursor-pointer w-full text-left"
                >
                  About Us
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavClick('/chat')}
                  className="text-gray-400 hover:text-white text-sm transition-colors cursor-pointer w-full text-left"
                >
                  Direct Chat
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavClick('/join-us')}
                  className="text-gray-400 hover:text-white text-sm transition-colors cursor-pointer w-full text-left"
                >
                  Join Our Team
                </button>
              </li>
            </ul>
          </div>

          {/* Expertises - Updated with clickable service links */}
          <div>
            <h4 className="text-xs font-black mb-6 text-orange-500 uppercase tracking-[0.2em]">Expertise</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <button 
                  onClick={() => handleServiceClick('cleaning')}
                  className="text-gray-400 hover:text-orange-500 transition-colors cursor-pointer w-full text-left"
                >
                  Cleaning Services
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleServiceClick('rentals')}
                  className="text-gray-400 hover:text-orange-500 transition-colors cursor-pointer w-full text-left"
                >
                  Rental Services
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleServiceClick('decoration')}
                  className="text-gray-400 hover:text-orange-500 transition-colors cursor-pointer w-full text-left"
                >
                  Decoration Services
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleServiceClick('health')}
                  className="text-gray-400 hover:text-orange-500 transition-colors cursor-pointer w-full text-left"
                >
                  Health Services
                </button>
              </li>
            </ul>
          </div>

          {/* Social & Contact */}
          <div className="space-y-6">
            <h4 className="text-xs font-black text-orange-500 uppercase tracking-[0.2em]">Connect</h4>
            <div className="flex space-x-4">
              {contactInfo.facebook && (
                <a href={contactInfo.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-orange-500 hover:text-white transition-all">
                  <FaFacebook size={18} />
                </a>
              )}
              {contactInfo.twitter && (
                <a href={contactInfo.twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-orange-500 hover:text-white transition-all">
                  <FaTwitter size={18} />
                </a>
              )}
              {contactInfo.instagram && (
                <a href={contactInfo.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-orange-500 hover:text-white transition-all">
                  <FaInstagram size={18} />
                </a>
              )}
            </div>
            <div className="pt-2">
              <p className="text-gray-400 text-xs flex items-center gap-3">
                <FaMapMarkerAlt className="text-orange-500" /> 
                {contactInfo.officeAddress ? `${contactInfo.officeAddress}, ${contactInfo.officeCity}` : "Bristol, United Kingdom"}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-center md:text-left text-gray-600 text-[9px] uppercase font-bold tracking-[0.2em]">
            {siteSettings.footerText || `© ${new Date().getFullYear()} BristolClean. All rights reserved.`}
          </p>
          <div className="flex space-x-6 text-[9px] uppercase font-bold tracking-widest text-gray-600">
            <button 
              onClick={() => handleNavClick('/policy')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Privacy & Terms
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
