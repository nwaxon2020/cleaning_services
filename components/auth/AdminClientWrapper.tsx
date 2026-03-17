"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { 
  FaTachometerAlt, FaCalendarAlt, FaStar, 
  FaBuilding, FaCog, FaSignOutAlt, FaHome,
  FaBars, FaTimes,
  FaBook
} from 'react-icons/fa';
import { FaBowlFood, FaClover, FaHospital } from 'react-icons/fa6';

export default function AdminClientWrapper({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newApplicantsCount, setNewApplicantsCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  const ADMIN_ID = process.env.NEXT_PUBLIC_ADMIN_ID;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.uid === ADMIN_ID) {
        setIsAdmin(true);
        setLoading(false);
      } else if (!user) {
        router.push('/login?redirect=/admin');
      } else {
        router.push('/');
        toast.error('Unauthorized access');
      }
    });
    return () => unsubscribe();
  }, [router, ADMIN_ID]);

  // Listen for new employment applications
  useEffect(() => {
    if (!isAdmin) return;

    // Query for applications created in the last 7 days (or all pending)
    // You can adjust the time frame as needed
    const q = query(
      collection(db, "employment_applications"),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Only count as "new" if the user hasn't viewed the applicants page
      // We'll use localStorage to track last viewed time
      const lastViewed = localStorage.getItem('applicants-last-viewed');
      const now = Date.now();
      
      if (pathname === '/admin/applicants') {
        // If currently on applicants page, set count to 0 and update last viewed
        setNewApplicantsCount(0);
        localStorage.setItem('applicants-last-viewed', now.toString());
      } else {
        // Count applications created after last viewed time
        const newCount = snapshot.docs.filter(doc => {
          const createdAt = doc.data().createdAt?.toDate?.() || new Date(0);
          return !lastViewed || createdAt.getTime() > parseInt(lastViewed);
        }).length;
        setNewApplicantsCount(newCount);
      }
    });

    return () => unsubscribe();
  }, [isAdmin, pathname]);

  // Clear counter when navigating to applicants page
  useEffect(() => {
    if (pathname === '/admin/applicants') {
      setNewApplicantsCount(0);
      localStorage.setItem('applicants-last-viewed', Date.now().toString());
    }
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
      toast.success('Signed out');
    } catch (e) { toast.error('Error signing out'); }
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: FaTachometerAlt },
    { name: 'Bookings', href: '/admin/bookings', icon: FaCalendarAlt },
    { name: 'Reviews', href: '/admin/reviews', icon: FaStar },
    { name: 'Cleaning Services', href: '/admin/cleaning-services', icon: FaClover },
    { name: 'Rental Services', href: '/admin/rental-services', icon: FaBowlFood },
    { name: 'Decorations', href: '/admin/decoration-services', icon: FaBuilding },
    { name: 'Health Services', href: '/admin/health-services', icon: FaHospital },
    { 
      name: 'Applicants', 
      href: '/admin/applicants', 
      icon: FaBook,
      badge: newApplicantsCount > 0 ? newApplicantsCount : undefined 
    },
    { name: 'Settings', href: '/admin/settings', icon: FaCog },
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  if (loading) return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-[999]">
      <div className="w-8 h-8 border-t-2 border-orange-500 rounded-full animate-spin"></div>
    </div>
  );

  if (!isAdmin) return null;

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#111] border-b border-white/5">
        <h2 className="text-xl font-black text-white uppercase tracking-tighter">
          Admin <span className="text-orange-500">Panel</span>
        </h2>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-white bg-white/5 rounded-lg"
        >
          {mobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-[72px] left-0 right-0 bg-[#111] border-b border-white/5 z-50 max-h-[calc(100vh-72px)] overflow-y-auto">
          <div className="p-4 space-y-2">
            <Link 
              href="/" 
              onClick={closeMobileMenu}
              className="flex items-center gap-3 px-4 py-4 rounded-xl transition-all text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/5 mb-2 border border-white/5 bg-white/5"
            >
              <FaHome size={16}/> <span>Back to Site</span>
            </Link>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 px-4 py-4 rounded-xl transition-all text-xs font-bold uppercase tracking-widest ${isActive ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                >
                  <Icon size={16} /> 
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            <button 
              onClick={() => {
                handleSignOut();
                closeMobileMenu();
              }} 
              className="flex items-center gap-3 px-4 py-4 text-zinc-500 hover:text-red-500 font-bold text-xs uppercase tracking-widest transition-all w-full border-t border-white/5 mt-4 pt-4"
            >
              <FaSignOutAlt size={16} /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="hidden md:flex w-60 bg-[#111] border-r border-white/5 flex-col shrink-0">
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">
              Admin <span className="text-orange-500">Panel</span>
            </h2>
          </div>
          
          <nav className="space-y-1">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-white hover:bg-white/5 mb-6 border border-white/5 bg-white/5">
              <FaHome size={16}/> <span>Back to Site</span>
            </Link>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-[11px] font-bold uppercase tracking-widest ${isActive ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                  <Icon /> 
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-white/5">
          <button onClick={handleSignOut} className="flex items-center gap-3 text-zinc-500 hover:text-red-500 font-bold text-[11px] uppercase tracking-widest transition-all w-full">
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto bg-black">
        <div className="mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}