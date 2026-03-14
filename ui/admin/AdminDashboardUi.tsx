"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs,} from 'firebase/firestore';
import { FaCalendarCheck, FaStar, FaUsers, FaMoneyBillWave, FaShoppingBag, FaPaintBrush, FaTruck, FaClock, FaCheckCircle, FaTimesCircle, FaHourglassHalf } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function AdminDashboardUi() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalReviews: 0,
    totalUsers: 0,
    revenue: 0,
    potentialRevenue: 0,
    serviceFees: 0,
    recentBookings: [] as any[],
    recentReviews: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all booking collections
        const canceledRentOrdersRef = collection(db, 'canceled_rent_order');
        const decorationBookingsRef = collection(db, 'decoration_bookings');
        const rentingOrdersRef = collection(db, 'renting_orders');
        const reviewsRef = collection(db, 'reviews');

        // Get all documents from each collection
        const [canceledSnap, decorationSnap, rentingSnap, reviewsSnap] = await Promise.all([
          getDocs(canceledRentOrdersRef),
          getDocs(decorationBookingsRef),
          getDocs(rentingOrdersRef),
          getDocs(reviewsRef)
        ]);

        // Process each collection with proper typing (using any for admin page)
        const canceledOrders = canceledSnap.docs.map(doc => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            type: 'canceled_rent',
            serviceType: 'Rentals (Canceled)',
            userName: data.customerName || 'Anonymous',
            amount: data.pricePaid || 0,
            refundAmount: data.refundAmount || 0,
            status: 'cancelled',
            userId: data.userId || data.customerId,
            ...data,
            createdAt: data.canceledAt || data.createdAt
          };
        });

        const decorationBookings = decorationSnap.docs.map(doc => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            type: 'decoration',
            serviceType: 'Decoration',
            userName: data.fullName || 'Anonymous',
            amount: data.bidAmount || 0,
            status: data.status || 'pending',
            userId: data.userId,
            ...data,
            createdAt: data.createdAt
          };
        });

        const rentingOrders = rentingSnap.docs.map(doc => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            type: 'renting',
            serviceType: 'Rentals',
            userName: data.fullName || 'Anonymous',
            amount: data.total || 0,
            status: data.status || 'pending',
            userId: data.userId,
            ...data,
            createdAt: data.createdAt
          };
        });

        // Get all reviews
        const allReviews = reviewsSnap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() as any,
          createdAt: (doc.data() as any).createdAt
        }));

        // Combine all bookings for recent list
        const allBookings = [
          ...decorationBookings,
          ...rentingOrders,
          ...canceledOrders
        ];

        // Sort by createdAt (most recent first) and take top 20
        const sortedBookings = allBookings
          .filter(b => b.createdAt) // Only include bookings with dates
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
            const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 20);

        // Calculate revenue and fees
        let totalRevenue = 0;
        let totalPotentialRevenue = 0;
        let totalServiceFees = 0;

        // Process decoration bookings
        decorationBookings.forEach(booking => {
          const amount = booking.bidAmount || 0;
          if (booking.status === 'approved') {
            totalRevenue += amount;
          }
          if (booking.status === 'pending' || booking.status === 'approved') {
            totalPotentialRevenue += amount;
          }
        });

        // Process renting orders
        rentingOrders.forEach(order => {
          const amount = order.total || 0;
          if (order.status === 'paid') {
            totalRevenue += amount;
          }
          if (order.status === 'paid' || order.status === 'pending') {
            totalPotentialRevenue += amount;
          }
        });

        // Process canceled orders - calculate 15% fee from original price
        canceledOrders.forEach(order => {
          const pricePaid = order.pricePaid || 0;
          totalServiceFees += pricePaid * 0.15; // 15% fee kept from cancelled orders
        });

        // Calculate unique users across all collections
        const uniqueUsers = new Set();
        decorationBookings.forEach(b => b.userId && uniqueUsers.add(b.userId));
        rentingOrders.forEach(o => o.userId && uniqueUsers.add(o.userId));
        canceledOrders.forEach(o => o.userId && uniqueUsers.add(o.userId));

        setStats({
          totalBookings: allBookings.length,
          totalReviews: allReviews.length,
          totalUsers: uniqueUsers.size,
          revenue: Math.round(totalRevenue * 100) / 100, // Round to 2 decimals
          potentialRevenue: Math.round(totalPotentialRevenue * 100) / 100,
          serviceFees: Math.round(totalServiceFees * 100) / 100,
          recentBookings: sortedBookings,
          recentReviews: allReviews.slice(0, 5)
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
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const getStatusIcon = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'paid':
      case 'approved':
        return <FaCheckCircle className="text-green-500" size={12} />;
      case 'cancelled':
        return <FaTimesCircle className="text-red-500" size={12} />;
      case 'pending':
        return <FaHourglassHalf className="text-orange-500" size={12} />;
      case 'delivered':
        return <FaTruck className="text-blue-500" size={12} />;
      default:
        return <FaClock className="text-gray-500" size={12} />;
    }
  };

  const getServiceIcon = (type: string) => {
    switch(type) {
      case 'decoration':
        return <FaPaintBrush className="text-purple-500" size={12} />;
      case 'renting':
        return <FaShoppingBag className="text-blue-500" size={12} />;
      case 'canceled_rent':
        return <FaTimesCircle className="text-red-500" size={12} />;
      default:
        return <FaCalendarCheck className="text-orange-500" size={12} />;
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'No date';
    try {
      const d = date?.toDate?.() || new Date(date);
      return d.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const statCards = [
    { 
      title: 'Total Bookings', 
      value: stats.totalBookings.toLocaleString(), 
      icon: FaCalendarCheck, 
      color: 'from-blue-500 to-blue-600',
      subtext: 'All services combined'
    },
    { 
      title: 'Active Reviews', 
      value: stats.totalReviews.toLocaleString(), 
      icon: FaStar, 
      color: 'from-orange-500 to-yellow-500',
      subtext: 'Customer feedback'
    },
    { 
      title: 'Unique Clients', 
      value: stats.totalUsers.toLocaleString(), 
      icon: FaUsers, 
      color: 'from-green-500 to-green-600',
      subtext: 'Registered users'
    },
    { 
      title: 'Revenue', 
      value: `£${stats.revenue.toLocaleString()}`, 
      icon: FaMoneyBillWave, 
      color: 'from-purple-500 to-pink-500',
      subtext: `Potential: £${stats.potentialRevenue.toLocaleString()}`
    },
  ];

  return (
    <div className="space-y-6 md:space-y-10 px-3 py-4 md:p-8 bg-black min-h-screen">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase">
            Admin <span className="text-orange-500">Dashboard</span>
          </h1>
          <p className="text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">
            Real-time business performance • {new Date().toLocaleDateString('en-GB')}
          </p>
        </div>
        <div className="bg-orange-500/10 px-3 py-2 rounded-lg border border-orange-500/20">
          <span className="text-orange-500 text-xs font-bold flex items-center gap-2">
            <FaMoneyBillWave /> Service Fees: £{stats.serviceFees.toLocaleString()}
          </span>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        {statCards.map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.1 }} 
            className="bg-zinc-900 border border-white/5 p-4 md:p-6 rounded-xl md:rounded-2xl hover:border-orange-500/20 transition-colors"
          >
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 md:mb-4 text-white`}>
              <stat.icon size={16} className="md:w-5 md:h-5" />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white">{stat.value}</h3>
            <p className="text-zinc-500 text-[8px] md:text-[10px] uppercase font-bold tracking-widest">{stat.title}</p>
            <p className="text-zinc-600 text-[7px] md:text-[8px] uppercase mt-1">{stat.subtext}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity Grid */}
      <div className="grid lg:grid-cols-2 gap-4 md:gap-8">
        {/* Recent Bookings - 20 items with scroll */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-xl md:rounded-3xl p-4 md:p-6">
          <h2 className="text-white font-black uppercase text-xs md:text-sm mb-4 md:mb-6 flex items-center gap-2">
            <div className="w-1 h-4 bg-orange-500 rounded-full" /> 
            Recent Activity <span className="text-zinc-500 text-[8px] ml-2">({stats.recentBookings.length} items)</span>
          </h2>
          <div className="max-h-[500px] md:max-h-[500px] overflow-y-auto pr-1 md:pr-2 custom-scrollbar space-y-2 md:space-y-3">
            {stats.recentBookings.length > 0 ? (
              stats.recentBookings.map((booking, index) => (
                <motion.div 
                  key={`${booking.id}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 bg-white/[0.02] rounded-xl md:rounded-2xl border border-white/[0.02] hover:bg-white/[0.04] hover:border-orange-500/10 transition-all"
                >
                  <div className="flex-1 mb-2 md:mb-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getServiceIcon(booking.type)}
                      <p className="text-white text-xs md:text-sm font-bold truncate max-w-[150px] md:max-w-none">
                        {booking.userName || booking.fullName || booking.customerName || 'Anonymous'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 md:gap-2">
                      <span className="text-zinc-500 text-[7px] md:text-[8px] uppercase font-bold bg-white/5 px-1.5 md:px-2 py-0.5 md:py-1 rounded flex items-center gap-1">
                        {getServiceIcon(booking.type)}
                        {booking.serviceType || booking.serviceName || 'Unknown'}
                      </span>
                      {booking.amount > 0 && (
                        <span className="text-green-500 text-[7px] md:text-[8px] font-mono bg-green-500/10 px-1.5 md:px-2 py-0.5 md:py-1 rounded">
                          £{booking.amount?.toLocaleString?.() || booking.amount}
                        </span>
                      )}
                      <span className="text-zinc-500 text-[7px] md:text-[8px] font-mono">
                        {formatDate(booking.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3 self-end md:self-auto">
                    <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg">
                      {getStatusIcon(booking.status)}
                      <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest ${
                        booking.status === 'paid' || booking.status === 'approved' ? 'text-green-500' :
                        booking.status === 'cancelled' ? 'text-red-500' :
                        booking.status === 'delivered' ? 'text-blue-500' :
                        'text-orange-500'
                      }`}>
                        {booking.status || 'pending'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="text-zinc-500 text-xs md:text-sm text-center py-8">No recent bookings</p>
            )}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-xl md:rounded-3xl p-4 md:p-6">
          <h2 className="text-white font-black uppercase text-xs md:text-sm mb-4 md:mb-6 flex items-center gap-2">
            <div className="w-1 h-4 bg-yellow-500 rounded-full" /> 
            Latest Feedback <span className="text-zinc-500 text-[8px] ml-2">({stats.recentReviews.length} items)</span>
          </h2>
          <div className="max-h-[500px] md:max-h-[500px] overflow-y-auto pr-1 md:pr-2 custom-scrollbar space-y-2 md:space-y-3">
            {stats.recentReviews.length > 0 ? (
              stats.recentReviews.map((review, index) => (
                <motion.div 
                  key={review.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 md:p-4 bg-white/[0.02] rounded-xl md:rounded-2xl border border-white/[0.02] hover:bg-white/[0.04] hover:border-yellow-500/10 transition-all"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-xs md:text-sm font-bold">{review.userName || 'Anonymous'}</p>
                      <span className="text-zinc-500 text-[7px] md:text-[8px]">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-lg">
                      <FaStar className="text-yellow-500" size={10} /> 
                      <span className="text-yellow-500 text-[9px] md:text-[10px] font-black">{review.rating || 5}</span>
                    </div>
                  </div>
                  <p className="text-zinc-400 text-[10px] md:text-xs italic line-clamp-2 pl-1">
                    "{review.comment || 'No comment provided'}"
                  </p>
                </motion.div>
              ))
            ) : (
              <p className="text-zinc-500 text-xs md:text-sm text-center py-8">No reviews yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
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