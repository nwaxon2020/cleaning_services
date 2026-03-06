"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaFacebook, FaTwitter, FaInstagram, FaEnvelope, FaPhone, FaMapMarkerAlt, FaGoogle } from 'react-icons/fa';
import { HiLogout, HiMail } from 'react-icons/hi';
import { auth } from '@/lib/firebase';
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
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

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
    // Send user to your custom black login card page
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

  return (
    <footer className="bg-black text-white pt-16 pb-8 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Company & Auth Section */}
          <div className="space-y-8">
            <div>
              {/* LOGO AND TITLE */}
              <div className="mb-2 flex items-center gap-1 md:gap-3">
                {/* LOGO IMAGE */}
                <img 
                  src="/favicon.png" 
                  alt="BostonClean Logo" 
                  className="w-8 h-8 md:w-10 md:h-10 object-contain rounded-full"
                />

                <div className="flex flex-col">
                  {/* TITLE */}
                  <h3 className="text-[10px] md:text-2xl font-black uppercase tracking-tighter leading-none">
                    Boston<span className="text-orange-500">Clean</span>
                  </h3>

                  {/* UNDERLINE SEPARATOR */}
                  <div className="w-full h-[1px] bg-zinc-800 my-1 md:my-1.5" />

                  {/* SUBTITLE */}
                  <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 leading-none italic">
                    Premier Cleaning
                  </p>
                </div>
              </div>

              <p className="text-gray-400 text-sm leading-relaxed">
                Making Boston sparkle. Professional eco-friendly cleaning services you can trust.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Member Access</h4>
              {!user ? (
                <div className="flex flex-col gap-3">
                  {/* Email Redirect Button */}
                  <button 
                    onClick={handleEmailRedirect}
                    className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    <HiMail size={18} className="text-orange-500" /> Email & Password Login
                  </button>

                  {/* Google Instant Auth Button */}
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
                  <button 
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-red-500 hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition-colors"
                  >
                    <HiLogout size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-black mb-6 text-orange-500 uppercase tracking-[0.2em]">Navigation</h4>
            <ul className="space-y-3">
              <li><Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">Home</Link></li>
              <li><Link href="/services" className="text-gray-400 hover:text-white text-sm transition-colors">Services</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-white text-sm transition-colors">About Us</Link></li>
              <li><Link href="/chat" className="text-gray-400 hover:text-white text-sm transition-colors">Direct Chat</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-xs font-black mb-6 text-orange-500 uppercase tracking-[0.2em]">Expertise</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="hover:text-white transition-colors cursor-default">Home Cleaning</li>
              <li className="hover:text-white transition-colors cursor-default">Commercial Space</li>
              <li className="hover:text-white transition-colors cursor-default">Deep Sanitization</li>
              <li className="hover:text-white transition-colors cursor-default">End of Tenancy</li>
            </ul>
          </div>

          {/* Social & Contact */}
          <div className="space-y-6">
            <h4 className="text-xs font-black text-orange-500 uppercase tracking-[0.2em]">Location</h4>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-orange-500 hover:text-white transition-all">
                <FaFacebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-orange-500 hover:text-white transition-all">
                <FaTwitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-orange-500 hover:text-white transition-all">
                <FaInstagram size={18} />
              </a>
            </div>
            <div className="pt-2">
              <p className="text-gray-400 text-xs flex items-center gap-3">
                <FaMapMarkerAlt className="text-orange-500" /> Boston, Lincolnshire, UK
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-[9px] uppercase font-bold tracking-[0.2em]">
            © {new Date().getFullYear()} BostonClean. All rights reserved.
          </p>
          <div className="flex space-x-6 text-[9px] uppercase font-bold tracking-widest text-gray-600">
            <Link href="/policy" className="hover:text-white transition-colors">Privacy & Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;