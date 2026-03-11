"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { FaCalendarCheck, FaStar, FaUsers, FaMoneyBillWave, } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function AdminDashboardUi() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalReviews: 0,
    totalUsers: 0,
    revenue: 0,
    recentBookings: [] as any[],
    recentReviews: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Get all bookings for count
        const bookingsRef = collection(db, 'bookings');
        const bookingsSnap = await getDocs(bookingsRef);
        const bookings = bookingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Get recent bookings (last 5) using fullName field
        const recentBookingsQuery = query(bookingsRef, orderBy('createdAt', 'desc'), limit(5));
        const recentBookingsSnap = await getDocs(recentBookingsQuery);
        const recentBookings = recentBookingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Get reviews - only 5 most recent
        const reviewsRef = collection(db, 'reviews');
        const recentReviewsQuery = query(reviewsRef, orderBy('createdAt', 'desc'), limit(5));
        const recentReviewsSnap = await getDocs(recentReviewsQuery);
        const recentReviews = recentReviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Get all reviews for count
        const allReviewsSnap = await getDocs(reviewsRef);
        const allReviews = allReviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const revenue = bookings.length * 40; // Estimated revenue

        setStats({
          totalBookings: bookings.length,
          totalReviews: allReviews.length,
          totalUsers: new Set(bookings.map((b: any) => b.userId)).size,
          revenue,
          recentBookings: recentBookings,
          recentReviews: recentReviews
        });
      } catch (error) {
        console.error('Dashboard Fetch Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const statCards = [
    { title: 'Bookings', value: stats.totalBookings, icon: FaCalendarCheck, color: 'from-blue-500 to-blue-600', trend: '+12%' },
    { title: 'Reviews', value: stats.totalReviews, icon: FaStar, color: 'from-orange-500 to-yellow-500', trend: '+8%' },
    { title: 'Clients', value: stats.totalUsers, icon: FaUsers, color: 'from-green-500 to-green-600', trend: '+5%' },
    { title: 'Revenue', value: `£${stats.revenue}`, icon: FaMoneyBillWave, color: 'from-purple-500 to-pink-500', trend: '+15%' },
  ];

  return (
    <div className="space-y-10 px-3 py-5 md:p-8">
      <header>
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Overview</h1>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Real-time business performance</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-zinc-900 border border-white/5 p-3 md:p-6 rounded-2xl">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 text-white`}>
              <stat.icon size={20} />
            </div>
            <h3 className="text-2xl font-black text-white">{stat.value}</h3>
            <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">{stat.title}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Bookings Table - with max height and scroll */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-lg md:rounded-3xl p-4 md:p-6">
          <h2 className="text-white font-black uppercase text-sm mb-6 flex items-center gap-2">
            <div className="w-1 h-4 bg-orange-500 rounded-full" /> Recent Bookings
          </h2>
          <div className="max-h-[500px] md:max-h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
            {stats.recentBookings.length > 0 ? (
              stats.recentBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/[0.02] hover:bg-white/[0.04] transition-colors">
                  <div className="flex-1">
                    <p className="text-white text-sm font-bold">{b.fullName || b.userName || 'Anonymous'}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-zinc-500 text-[8px] uppercase font-bold bg-white/5 px-2 py-1 rounded">
                        {b.service || b.serviceCategory || 'Unknown'}
                      </span>
                      <span className="text-orange-500 text-[8px] font-mono bg-orange-500/10 px-2 py-1 rounded">
                        {b.bookingDate || 'No date'}
                      </span>
                      <span className="text-blue-500 text-[8px] font-mono bg-blue-500/10 px-2 py-1 rounded">
                        {b.bookingTime || 'No time'}
                      </span>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-orange-500/10 text-orange-500 text-[9px] font-black uppercase rounded-lg tracking-widest ml-2">
                    {b.status || 'pending'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-zinc-500 text-sm text-center py-8">No recent bookings</p>
            )}
          </div>
        </div>

        {/* Reviews Table - with max height and scroll, limited to 5 */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-lg md:rounded-3xl p-4 md:p-6">
          <h2 className="text-white font-black uppercase text-sm mb-6 flex items-center gap-2">
            <div className="w-1 h-4 bg-yellow-500 rounded-full" /> Latest Feedback
          </h2>
          <div className="max-h-[500px] md:max-h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
            {stats.recentReviews.length > 0 ? (
              stats.recentReviews.map((r) => (
                <div key={r.id} className="p-4 bg-white/[0.02] md:rounded-2xl border border-white/[0.02] hover:bg-white/[0.04] transition-colors">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-white text-sm font-bold">{r.userName}</p>
                    <div className="flex text-yellow-500 gap-0.5 items-center">
                      <FaStar size={8} /> 
                      <span className="text-[10px] font-black">{r.rating}</span>
                    </div>
                  </div>
                  <p className="text-zinc-500 text-xs italic line-clamp-2">"{r.comment || ''}"</p>
                </div>
              ))
            ) : (
              <p className="text-zinc-500 text-sm text-center py-8">No reviews yet</p>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(249, 115, 22, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(249, 115, 22, 0.5);
        }
      `}</style>
    </div>
  );
}