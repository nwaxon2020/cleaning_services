"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import toast from 'react-hot-toast';
import { 
  FaTachometerAlt, FaCalendarAlt, FaStar, 
  FaUsers, FaCog, FaSignOutAlt, FaHome 
} from 'react-icons/fa';

export default function AdminClientWrapper({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
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
    { name: 'Users', href: '/admin/users', icon: FaUsers },
    { name: 'Settings', href: '/admin/settings', icon: FaCog },
  ];

  if (loading) return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-[999]">
      <div className="w-8 h-8 border-t-2 border-orange-500 rounded-full animate-spin"></div>
    </div>
  );

  if (!isAdmin) return null;

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#111] border-r border-white/5 flex flex-col shrink-0">
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
                  <Icon /> <span>{item.name}</span>
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
      <main className="flex-1 h-full overflow-y-auto bg-black p-4 md:p-10">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}