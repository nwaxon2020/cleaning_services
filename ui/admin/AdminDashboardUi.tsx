"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, getDocs, query, orderBy, limit, 
  doc, deleteDoc, updateDoc, onSnapshot, where 
} from 'firebase/firestore';
import { 
  FaCalendarCheck, FaStar, FaUsers, FaMoneyBillWave, 
  FaShoppingBag, FaPaintBrush, FaTruck, FaClock, 
  FaCheckCircle, FaTimesCircle, FaHourglassHalf, 
  FaBroom, FaTrash, FaLock, FaTimes, FaEye
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// Add this interface at the top of your file (after imports)
interface RevenueTransaction {
  id: string;
  serviceType: string;
  customerName: string;
  contactMethod: string;
  contactValue?: string;
  amount: number;
  items?: Array<{
    name: string;
    category?: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  completedAt: any;
  orderId?: string;
}

export default function AdminDashboardUi() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalReviews: 0,
    totalUsers: 0,
    totalApplicants: 0,
    revenue: 0,
    potentialRevenue: 0,
    serviceFees: 0,
    recentBookings: [] as any[],
    recentReviews: [] as any[]
  });
  const [loading, setLoading] = useState(true);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [revenueFilter, setRevenueFilter] = useState('all');
  const [revenueTransactions, setRevenueTransactions] = useState<RevenueTransaction[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [passcode, setPasscode] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const ADMIN_PASSCODE = process.env.NEXT_PUBLIC_ADMIN_PIN;

  // Real-time listener for revenue transactions
  useEffect(() => {
    const q = query(collection(db, "revenue_transactions"), orderBy("completedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const transactions = snap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as RevenueTransaction));
      setRevenueTransactions(transactions);
      
      // Calculate total revenue
      const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      setStats(prev => ({ ...prev, revenue: totalRevenue }));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all booking collections
        const canceledRentOrdersRef = collection(db, 'canceled_rent_order');
        const decorationBookingsRef = collection(db, 'decoration_bookings');
        const rentingOrdersRef = collection(db, 'renting_orders');
        const cleaningOrdersRef = collection(db, 'cleaning_orders');
        const reviewsRef = collection(db, 'reviews');
        const applicantsRef = collection(db, 'employment_applications');

        // Get all documents
        const [canceledSnap, decorationSnap, rentingSnap, cleaningSnap, reviewsSnap, applicantsSnap] = await Promise.all([
          getDocs(canceledRentOrdersRef),
          getDocs(decorationBookingsRef),
          getDocs(rentingOrdersRef),
          getDocs(cleaningOrdersRef),
          getDocs(reviewsRef),
          getDocs(applicantsRef)
        ]);

        // Process each collection
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
            ...data,
            createdAt: data.createdAt
          };
        });

        const cleaningOrders = cleaningSnap.docs.map(doc => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            type: 'cleaning',
            serviceType: 'Cleaning',
            userName: data.customerInfo?.fullName || data.userName || 'Anonymous',
            amount: data.approvedTotal || 0,
            status: data.status || 'pending',
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

        const totalApplicants = applicantsSnap.size;

        // Combine all bookings for recent list
        const allBookings = [
          ...decorationBookings,
          ...rentingOrders,
          ...canceledOrders,
          ...cleaningOrders
        ];

        // Sort by createdAt
        const sortedBookings = allBookings
          .filter(b => b.createdAt)
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
            const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, 20);

        // Calculate potential revenue (sum of all pending/approved orders)
        let totalPotentialRevenue = 0;
        decorationBookings.forEach(booking => {
          const amount = booking.bidAmount || 0;
          if (booking.status === 'pending' || booking.status === 'approved') {
            totalPotentialRevenue += amount;
          }
        });
        rentingOrders.forEach(order => {
          const amount = order.total || 0;
          if (order.status === 'pending' || order.status === 'approved') {
            totalPotentialRevenue += amount;
          }
        });
        cleaningOrders.forEach(order => {
          const amount = order.approvedTotal || 0;
          if (order.status === 'pending' || order.status === 'approved') {
            totalPotentialRevenue += amount;
          }
        });

        // Calculate service fees from cancelled orders
        let totalServiceFees = 0;
        canceledOrders.forEach(order => {
          const pricePaid = order.pricePaid || 0;
          totalServiceFees += pricePaid * 0.15;
        });

        // Calculate unique users
        const uniqueUsers = new Set();
        decorationBookings.forEach(b => b.userId && uniqueUsers.add(b.userId));
        rentingOrders.forEach(o => o.userId && uniqueUsers.add(o.userId));
        canceledOrders.forEach(o => o.userId && uniqueUsers.add(o.userId));
        cleaningOrders.forEach(o => o.userId && uniqueUsers.add(o.userId));

        setStats(prev => ({
          ...prev,
          totalBookings: allBookings.length,
          totalReviews: allReviews.length,
          totalUsers: uniqueUsers.size,
          totalApplicants: totalApplicants,
          potentialRevenue: Math.round(totalPotentialRevenue * 100) / 100,
          serviceFees: Math.round(totalServiceFees * 100) / 100,
          recentBookings: sortedBookings,
          recentReviews: allReviews.slice(0, 5)
        }));
      } catch (error) {
        console.error('Dashboard Fetch Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleDeleteTransaction = async () => {
    if (passcode !== ADMIN_PASSCODE) {
      toast.error("Invalid Admin Passcode");
      return;
    }
    if (!selectedTransaction) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "revenue_transactions", selectedTransaction.id));
      toast.success("Transaction permanently deleted");
      setShowDeleteModal(false);
      setSelectedTransaction(null);
      setPasscode("");
    } catch (error) {
      toast.error("Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAll = async () => {
    if (passcode !== ADMIN_PASSCODE) {
      toast.error("Invalid Admin Passcode");
      return;
    }
    
    setIsDeleting(true);
    try {
      const transactions = revenueTransactions.filter(t => 
        revenueFilter === 'all' ? true : t.serviceType?.toLowerCase() === revenueFilter
      );
      
      for (const transaction of transactions) {
        await deleteDoc(doc(db, "revenue_transactions", transaction.id));
      }
      toast.success(`Cleared ${transactions.length} transactions`);
      setShowDeleteModal(false);
      setPasscode("");
    } catch (error) {
      toast.error("Failed to clear transactions");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredTransactions = revenueTransactions.filter(t => 
    revenueFilter === 'all' ? true : t.serviceType?.toLowerCase() === revenueFilter
  );

  const filteredTotal = filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

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
      case 'cleaning':
        return <FaBroom className="text-green-500" size={12} />;
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
      subtext: `Potential: £${stats.potentialRevenue.toLocaleString()}`,
      onClick: () => setShowRevenueModal(true),
      clickable: true
    },
  ];

  return (
    <div className="space-y-6 md:space-y-10 px-3 py-4 md:p-8 bg-black min-h-screen">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className='text-center'>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase">
            Admin <span className="text-orange-500">Dashboard</span>
          </h1>
          <p className="text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">
            Real-time business performance • {new Date().toLocaleDateString('en-GB')}
          </p>
        </div>

        <div className='flex justify-center items-center gap-2 md:gap-4'>
          <div className="bg-orange-500/10 px-3 py-2 md:rounded-lg border border-orange-500/20">
            <span className="text-orange-500 text-xs font-bold flex items-center gap-2">
              <FaMoneyBillWave /> Service Fees: £{stats.serviceFees.toLocaleString()}
            </span>
          </div>
          <div className="bg-green-500/10 px-3 py-2 md:rounded-lg border border-green-500/20">
            <span className="text-green-500 text-xs font-bold flex items-center gap-2">
              <FaMoneyBillWave /> Job Applicants: {stats.totalApplicants.toLocaleString()}
            </span>
          </div>
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
            onClick={stat.onClick}
            className={`bg-zinc-900 border border-white/5 p-4 md:p-6 rounded md:rounded-xl hover:border-orange-500/20 transition-colors ${stat.clickable ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
          >
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 md:mb-4 text-white`}>
              <stat.icon size={16} className="md:w-5 md:h-5" />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white">{stat.value}</h3>
            <p className="text-zinc-500 text-xs uppercase font-bold tracking-widest">{stat.title}</p>
            <p className="text-orange-500 font-semibold text-[10px] uppercase mt-1">{stat.subtext}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity Grid */}
      <div className="grid lg:grid-cols-2 gap-4 md:gap-8">
        {/* Recent Bookings */}
        <div className="bg-zinc-900/50 border border-white/5 rounded-lg md:rounded-xl p-4 md:p-6">
          <h2 className="text-white font-black uppercase text-xs md:text-sm mb-4 md:mb-6 flex items-center gap-2">
            <div className="w-1 h-4 bg-orange-500 rounded-full" /> 
            Recent Activity <span className="text-zinc-500 text-[8px] ml-2">({stats.recentBookings.length} items)</span>
          </h2>
          <div className="max-h-[500px] md:max-h-[500px] overflow-y-auto md:pr-2 custom-scrollbar space-y-2 md:space-y-3">
            {stats.recentBookings.length > 0 ? (
              stats.recentBookings.map((booking, index) => (
                <motion.div 
                  key={`${booking.id}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 bg-white/[0.02] md:rounded-xl border border-white/[0.02] hover:bg-white/[0.04] hover:border-orange-500/10 transition-all"
                >
                  <div className="flex-1 mb-2 md:mb-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getServiceIcon(booking.type)}
                      <p className="text-white text-xs md:text-sm font-bold truncate max-w-[150px] md:max-w-none">
                        {booking.userName || booking.fullName || booking.customerName || booking.customerInfo?.fullName || 'Anonymous'}
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
        <div className="bg-zinc-900/50 border border-white/5 rounded-lg md:rounded-xl p-4 md:p-6">
          <h2 className="text-white font-black uppercase text-xs md:text-sm mb-4 md:mb-6 flex items-center gap-2">
            <div className="w-1 h-4 bg-yellow-500 rounded-full" /> 
            Latest Feedback <span className="text-zinc-500 text-[8px] ml-2">({stats.recentReviews.length} items)</span>
          </h2>
          <div className="max-h-[500px] md:max-h-[500px] overflow-y-auto md:pr-2 custom-scrollbar space-y-2 md:space-y-3">
            {stats.recentReviews.length > 0 ? (
              stats.recentReviews.map((review, index) => (
                <motion.div 
                  key={review.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 md:p-4 bg-white/[0.02] md:rounded-xl border border-white/[0.02] hover:bg-white/[0.04] hover:border-yellow-500/10 transition-all"
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

      {/* Revenue Modal */}
      <AnimatePresence>
        {showRevenueModal && (
          <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 md:p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 w-full max-w-5xl h-[95vh] md:rounded-xl flex flex-col overflow-hidden border border-white/10"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center p-2 md:p-6 border-b border-white/10">
                <div>
                  <h2 className="md:text-xl font-black text-white uppercase">Revenue <span className="text-green-500">Transactions</span></h2>
                  <p className="text-zinc-500 font-black text-[11px] mt-1">Total: £{filteredTotal.toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setPasscode("");
                      setSelectedTransaction(null);
                      setShowDeleteModal(true);
                    }}
                    className="p-2 md:px-3 bg-red-500/10 text-red-500 rounded-lg text-[10px] font-black uppercase hover:bg-red-500/20 transition-all"
                  >
                    Clear All
                  </button>
                  <button onClick={() => setShowRevenueModal(false)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                    <FaTimes className="text-white" />
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4 border-b border-white/5">
                {['all', 'cleaning', 'rentals', 'decoration'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setRevenueFilter(filter)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                      revenueFilter === filter 
                        ? 'bg-green-600 text-white' 
                        : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                    }`}
                  >
                    {filter === 'all' ? 'All' : filter}
                  </button>
                ))}
              </div>

              {/* Transactions List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <div key={transaction.id} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-green-500/30 transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {getServiceIcon(transaction.serviceType?.toLowerCase())}
                            <span className="text-white font-bold text-sm uppercase">{transaction.serviceType}</span>
                            <span className="text-zinc-500 text-[10px]">{formatDate(transaction.completedAt)}</span>
                          </div>
                          <p className="text-white text-xs font-bold">{transaction.customerName}</p>
                          <p className="text-zinc-400 text-[10px]">Contact: {transaction.contactMethod}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-500 text-xl font-black">£{transaction.amount.toFixed(2)}</p>
                          <button 
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setShowDeleteModal(true);
                            }}
                            className="mt-2 text-red-500 hover:text-red-400 text-[10px] flex items-center gap-1"
                          >
                            <FaTrash size={10} /> Delete
                          </button>
                        </div>
                      </div>
                      
                      {/* Items Details */}
                      <div className="mt-2 pt-2 border-t border-white/5">
                        <p className="text-[10px] text-zinc-500 font-black mb-2">Items:</p>
                        <div className="space-y-1">
                          {transaction.items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-[10px]">
                              <span className="text-white">• <span className="font-black">*{item.name}*</span> {item.category ? `(${item.category})` : ''}</span>
                              <span className="text-green-400 font-black">*£{item.subtotal?.toFixed(2) || (item.price * item.quantity).toFixed(2)}*</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-1 border-t border-white/5 flex justify-between">
                          <span className="text-[10px] font-black text-zinc-400">Total Paid:</span>
                          <span className="text-green-500 font-black text-sm">*£{transaction.amount.toFixed(2)}*</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-zinc-500 text-sm">No transactions found</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 w-full max-w-md rounded-2xl p-6 text-center border border-white/10"
            >
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaLock size={24} />
              </div>
              <h2 className="text-xl font-black text-white mb-2">
                {selectedTransaction ? 'Delete Transaction?' : 'Clear All Transactions?'}
              </h2>
              <p className="text-zinc-400 text-xs mb-6">
                {selectedTransaction 
                  ? `This will permanently delete the transaction for ${selectedTransaction.customerName}`
                  : `This will permanently delete ALL ${revenueFilter === 'all' ? '' : revenueFilter} transactions`}
              </p>
              <input 
                type="password" 
                value={passcode} 
                onChange={(e) => setPasscode(e.target.value)} 
                placeholder="Enter Admin Passcode" 
                className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-center text-sm font-bold mb-6 focus:border-red-500 outline-none" 
                autoFocus 
              />
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedTransaction(null);
                    setPasscode("");
                  }} 
                  className="flex-1 py-3 bg-white/5 text-zinc-400 rounded-xl font-black uppercase text-[10px] hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={selectedTransaction ? handleDeleteTransaction : handleClearAll} 
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black uppercase text-[10px] hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {isDeleting ? 'Processing...' : (selectedTransaction ? 'Delete' : 'Clear All')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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