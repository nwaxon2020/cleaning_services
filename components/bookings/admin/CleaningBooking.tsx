"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, query, orderBy, onSnapshot, 
  doc, updateDoc, deleteDoc, serverTimestamp, addDoc, getDocs, where
} from 'firebase/firestore';
import { 
  FaWhatsapp, FaEnvelope, FaPhone, FaMapMarkerAlt, FaInfoCircle,
  FaCalendarAlt, FaClock, FaCheckCircle, FaUser, FaList, FaLock,
  FaTrash, FaTimesCircle, FaDollarSign, FaUserTimes, FaFlagCheckered
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function AdminCleaningOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  
  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  
  // Selection States
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [approvingOrder, setApprovingOrder] = useState<any>(null);
  const [cancellingOrder, setCancellingOrder] = useState<any>(null);
  const [completingOrder, setCompletingOrder] = useState<any>(null);
  const [incompleteOrder, setIncompleteOrder] = useState<any>(null);
  
  // Logic States
  const [passcode, setPasscode] = useState("");
  const [areaPrices, setAreaPrices] = useState<{[key: string]: number}>({});
  const [cancelReason, setCancelReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ADMIN_PASSCODE = process.env.NEXT_PUBLIC_ADMIN_PIN; 

  const cancelReasons = [
    { label: "Amount is below average", value: "amount_below_average" },
    { label: "Dates unavailable", value: "dates_unavailable" },
    { label: "Out of service area", value: "location_out_of_area" },
    { label: "Staff unavailable", value: "resources_unavailable" },
    { label: "Incomplete info", value: "incomplete_info" },
    { label: "Customer requested", value: "customer_requested" },
    { label: "Weather conditions", value: "weather_conditions" },
    { label: "Payment issue", value: "payment_issue" },
  ];

  // Helper: Save to Revenue Collection
  const saveToRevenue = async (order: any) => {
    try {
      // Prepare items array from areasList
      const items = order.areasList?.map((area: any, idx: number) => ({
        name: area.areaName,
        category: 'Cleaning Area',
        quantity: area.quantity || 1,
        price: order.approvedPrices?.[`${area.areaName}-${idx}`] || 0,
        subtotal: (order.approvedPrices?.[`${area.areaName}-${idx}`] || 0) * (area.quantity || 1)
      })) || [];

      const revenueData = {
        serviceType: 'Cleaning',
        customerName: order.customerInfo?.fullName || order.userName,
        contactMethod: order.customerInfo?.contactPreference || 'WhatsApp',
        contactValue: order.customerInfo?.phone,
        amount: order.approvedTotal || 0,
        items: items,
        completedAt: serverTimestamp(),
        orderId: order.id
      };

      await addDoc(collection(db, "revenue_transactions"), revenueData);
      console.log("Saved to revenue:", revenueData);
    } catch (error) {
      console.error("Failed to save to revenue:", error);
    }
  };

  // Helper: Remove from Revenue Collection
  const removeFromRevenue = async (orderId: string) => {
    try {
      const q = query(collection(db, "revenue_transactions"), where("orderId", "==", orderId));
      const snapshot = await getDocs(q);
      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref);
      }
      console.log("Removed from revenue for order:", orderId);
    } catch (error) {
      console.error("Failed to remove from revenue:", error);
    }
  };

  useEffect(() => {
    const q = query(collection(db, "cleaning_orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // --- LOGIC: APPROVAL WITH PRICING ---
  const handleApproveClick = (order: any) => {
    setApprovingOrder(order);
    const initialPrices: {[key: string]: number} = {};
    order.areasList?.forEach((area: any, index: number) => {
      initialPrices[`${area.areaName}-${index}`] = 0;
    });
    setAreaPrices(initialPrices);
    setShowApproveModal(true);
  };

  const handleApproveWithPrices = async () => {
    if (!approvingOrder) return;
    const hasEmptyPrice = Object.values(areaPrices).some(price => price <= 0);
    if (hasEmptyPrice) return toast.error("Please set a price for all areas");

    setIsSubmitting(true);
    try {
      const totalAmount = Object.entries(areaPrices).reduce((sum, [key, price]) => {
        const area = approvingOrder.areasList?.find((a: any, idx: number) => `${a.areaName}-${idx}` === key);
        return sum + (price * (area?.quantity || 1));
      }, 0);

      await updateDoc(doc(db, "cleaning_orders", approvingOrder.id), {
        status: 'approved',
        approvedPrices: areaPrices,
        approvedTotal: totalAmount,
        approvedAt: serverTimestamp(),
        approvedBy: 'admin'
      });

      toast.success(`Order approved: £${totalAmount.toFixed(2)}`);
      setShowApproveModal(false);
      setApprovingOrder(null);
      setAreaPrices({});
    } catch (e) {
      toast.error("Approval failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- LOGIC: MARK AS COMPLETED ---
  const handleCompleteOrder = async () => {
    if (!completingOrder) return;
    setIsSubmitting(true);
    try {
      // Save to revenue BEFORE updating status
      await saveToRevenue(completingOrder);
      
      await updateDoc(doc(db, "cleaning_orders", completingOrder.id), {
        status: 'completed',
        completedAt: serverTimestamp(),
      });
      toast.success("Service marked as completed and added to revenue!");
      setShowCompleteModal(false);
      setCompletingOrder(null);
    } catch (e) {
      toast.error("Failed to update status");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- LOGIC: REVERT TO INCOMPLETE ---
  const handleMarkIncomplete = (order: any) => {
    setIncompleteOrder(order);
    setShowDeleteModal(true);
  };

  const executeMarkIncomplete = async (order: any) => {
    setIsSubmitting(true);
    try {
      // Remove from revenue when reverting
      await removeFromRevenue(order.id);
      
      await updateDoc(doc(db, "cleaning_orders", order.id), {
        status: 'approved',
        reopenedAt: serverTimestamp(),
      });
      toast.success("Order moved back to Approved status and removed from revenue");
      setShowDeleteModal(false);
      setIncompleteOrder(null);
      setPasscode("");
    } catch (e) {
      toast.error("Failed to update status");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- LOGIC: CANCELLATION ---
  const handleCancelWithReason = async () => {
    const finalReason = customReason.trim() || cancelReason;
    if (!finalReason) return toast.error("Please select or enter a reason");

    setIsSubmitting(true);
    try {
      const reasonText = customReason.trim() 
        ? customReason 
        : cancelReasons.find(r => r.value === cancelReason)?.label || cancelReason;

      await updateDoc(doc(db, "cleaning_orders", cancellingOrder.id), { 
        status: 'cancelled',
        cancelReason: reasonText,
        cancelledAt: serverTimestamp(),
        cancelledBy: 'admin'
      });
      
      toast.success("Order cancelled");
      setShowCancelModal(false);
      setCancellingOrder(null);
      setCancelReason("");
      setCustomReason("");
    } catch (e) {
      toast.error("Cancel failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- LOGIC: PERMANENT WIPE OR INCOMPLETE VERIFICATION ---
  const confirmDeletion = async () => {
    if (passcode !== ADMIN_PASSCODE) return toast.error("Invalid Admin Passcode");
    
    // If we are reverting a completed order
    if (incompleteOrder) {
      return executeMarkIncomplete(incompleteOrder);
    }

    // If we are deleting
    if (!selectedOrderId) return;
    setIsSubmitting(true);
    try {
      // Also remove from revenue if it was in completed status
      const orderToDelete = orders.find(o => o.id === selectedOrderId);
      if (orderToDelete?.status === 'completed') {
        await removeFromRevenue(selectedOrderId);
      }
      
      await deleteDoc(doc(db, "cleaning_orders", selectedOrderId));
      toast.success("Record permanently deleted");
      setShowDeleteModal(false);
      setSelectedOrderId(null);
      setPasscode("");
    } catch (e) {
      toast.error("Deletion failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedOrder(expandedOrder === id ? null : id);
  };

  const isUserDeclined = (order: any) => {
    return order.status === 'cancelled' && order.cancelledBy === 'customer';
  };

  const getPreferredContactIcon = (preference: string, phone: string, email: string) => {
    if (preference === 'WhatsApp') {
      return { icon: <FaWhatsapp size={12} />, href: `https://wa.me/${phone?.replace(/\D/g, '')}`, label: 'WhatsApp' };
    } else if (preference === 'Phone Call') {
      return { icon: <FaPhone size={12} />, href: `tel:${phone}`, label: 'Phone Call' };
    } else if (preference === 'Email') {
      return { icon: <FaEnvelope size={12} />, href: `mailto:${email}`, label: 'Email' };
    }
    return null;
  };

  const filteredOrders = orders.filter(o => filter === 'all' ? true : o.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
  <div className="w-full p-4 pt-2 md:p-8 md:pt-4 bg-emerald-50 min-h-screen relative">
    <div className="max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900">
          Cleaning <span className="text-emerald-600">Orders</span>
        </h1>
        <div className="w-full md:w-auto flex bg-white border rounded-sm md:rounded-xl p-2 md:p-1 shadow-sm overflow-x-auto">
          {['pending', 'approved', 'completed', 'cancelled', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 md:px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                filter === f ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode='popLayout'>
          {filteredOrders.map((order) => {
            const declinedByUser = isUserDeclined(order);
            const preferredContact = getPreferredContactIcon(
              order.customerInfo?.contactPreference, 
              order.customerInfo?.phone, 
              order.customerInfo?.email || order.userEmail
            );
            
            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={order.id}
                className={`bg-white border md:rounded-xl overflow-hidden shadow-sm ${
                  declinedByUser ? 'border-orange-300 bg-orange-50/30' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col md:flex-row">
                  <div className={`w-full md:w-2 ${
                    order.status === 'pending' ? 'bg-blue-400' : 
                    order.status === 'approved' ? 'bg-emerald-600' : 
                    order.status === 'completed' ? 'bg-purple-500' :
                    declinedByUser ? 'bg-orange-500' : 'bg-slate-400'
                  }`} />
                  
                  <div className="flex-1 p-5">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-slate-400">
                          <FaUser size={10}/> 
                          <span className="text-[9px] font-black uppercase tracking-widest">Customer</span>
                        </div>
                        <h3 className="font-black text-slate-900">{order.customerInfo?.fullName || order.userName}</h3>
                        
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${
                          order.status === 'approved' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                          order.status === 'completed' ? 'bg-purple-50 border-purple-100 text-purple-600' :
                          order.status === 'pending' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                          declinedByUser ? 'bg-orange-50 border-orange-100 text-orange-600' :
                          'bg-slate-50 border-slate-200 text-slate-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            order.status === 'approved' ? 'bg-emerald-500' :
                            order.status === 'completed' ? 'bg-purple-500' :
                            order.status === 'pending' ? 'bg-blue-500 animate-pulse' :
                            declinedByUser ? 'bg-orange-500' :
                            'bg-slate-400'
                          }`} />
                          <span className="text-[10px] font-black uppercase tracking-tighter">
                            {declinedByUser ? 'Declined by User' : order.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {order.sentViaWhatsApp && (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-bold flex items-center gap-1">
                            <FaWhatsapp size={12} /> WhatsApp
                          </span>
                        )}
                        <button onClick={() => toggleExpand(order.id)} className="text-xs text-slate-400 hover:text-slate-600">
                          {expandedOrder === order.id ? 'Show less' : 'Show details'}
                        </button>
                      </div>
                    </div>

                    {/* Status Specific Banners */}
                    {order.status === 'cancelled' && order.cancelReason && (
                      <div className={`mb-4 p-3 rounded-lg border ${declinedByUser ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-100'}`}>
                        <p className={`text-xs font-black flex items-center gap-2 ${declinedByUser ? 'text-orange-600' : 'text-red-600'}`}>
                          {declinedByUser ? <FaUserTimes /> : <FaTimesCircle />} 
                          {declinedByUser ? 'Declined by Customer:' : 'Cancellation Reason:'}
                        </p>
                        <p className={`text-xs mt-1 ${declinedByUser ? 'text-orange-700' : 'text-red-700'}`}>{order.cancelReason}</p>
                      </div>
                    )}

                    {(order.status === 'approved' || order.status === 'completed') && order.approvedTotal && (
                      <div className={`mb-4 p-3 border rounded-lg ${order.status === 'completed' ? 'bg-purple-50 border-purple-100' : 'bg-emerald-50 border-emerald-100'}`}>
                        <p className={`text-xs font-black flex items-center gap-2 ${order.status === 'completed' ? 'text-purple-600' : 'text-emerald-600'}`}>
                          {order.status === 'completed' ? <FaFlagCheckered /> : <FaCheckCircle />} 
                          {order.status === 'completed' ? 'Revenue Generated:' : 'Approved Amount:'}
                        </p>
                        <p className={`text-lg font-black mt-1 ${order.status === 'completed' ? 'text-purple-700' : 'text-emerald-700'}`}>£{order.approvedTotal.toFixed(2)}</p>
                      </div>
                    )}

                    {/* Main Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        {preferredContact && (
                          <a href={preferredContact.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-emerald-200 transition-all mb-2">
                            {preferredContact.icon} Preferred: {preferredContact.label}
                          </a>
                        )}
                        <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                          <FaMapMarkerAlt className="text-red-500"/> {order.customerInfo?.address}
                        </p>
                      </div>

                      <div className="space-y-2 bg-emerald-50 p-3 rounded-xl">
                        <h4 className="text-sm font-black text-emerald-600">{order.serviceName}</h4>
                        <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <FaList size={12}/> Total Areas: {order.totalAreas}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-bold text-slate-700 space-y-2">
                          <p className="flex items-center gap-2"><FaCalendarAlt className="text-slate-300"/> {order.selectedDate}</p>
                          <p className="flex items-center gap-2"><FaClock className="text-slate-300"/> {order.selectedTime}</p>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {expandedOrder === order.id && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 pt-4 border-t border-slate-100">
                          <h5 className="text-xs font-black text-slate-400 uppercase mb-3">Areas to be cleaned:</h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {order.areasList?.map((area: any, idx: number) => (
                              <div key={idx} className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                <p className="text-xs font-black text-slate-900">{area.areaName}</p>
                                <p className="text-xs text-emerald-600">Quantity: {area.quantity}</p>
                                {(order.status === 'approved' || order.status === 'completed') && order.approvedPrices && (
                                  <p className="text-xs font-bold text-emerald-700 mt-1">Price: £{order.approvedPrices[`${area.areaName}-${idx}`] || 0} /unit</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* --- ACTIONS FOOTER --- */}
                    <div className="flex justify-end items-center gap-3 mt-4 pt-3 border-t border-slate-100">
                      {/* 1. PENDING STATE */}
                      {order.status === 'pending' && (
                        <>
                          <button onClick={() => handleApproveClick(order)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2">
                            <FaCheckCircle/> Approve & Quote
                          </button>
                          <button onClick={() => { setCancellingOrder(order); setShowCancelModal(true); }} className="px-4 py-2 bg-white border-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-lg font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2">
                            <FaTimesCircle/> Cancel
                          </button>
                        </>
                      )}

                      {/* 2. APPROVED STATE */}
                      {order.status === 'approved' && (
                        <button 
                          onClick={() => { setCompletingOrder(order); setShowCompleteModal(true); }} 
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-purple-700 transition-all flex items-center gap-2 shadow-lg shadow-purple-100"
                        >
                          <FaFlagCheckered/> Mark Completed
                        </button>
                      )}

                      {/* 3. COMPLETED STATE */}
                      {order.status === 'completed' && (
                        <button 
                          onClick={() => handleMarkIncomplete(order)}
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-amber-100 transition-all flex items-center gap-2"
                        >
                          <FaInfoCircle size={10}/> Mark Incomplete
                        </button>
                      )}

                      {/* 4. GENERAL DELETE */}
                      {(order.status === 'approved' || order.status === 'cancelled' || order.status === 'completed') && (
                        <button onClick={() => { setSelectedOrderId(order.id); setIncompleteOrder(null); setShowDeleteModal(true); }} className="px-4 py-2 bg-red-50 text-red-500 border border-red-100 rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2">
                          <FaTrash size={10}/> Delete
                        </button>
                      )}
                      <span className="text-[8px] font-black text-slate-400 ml-auto">Ref: {order.id.slice(-6).toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>

    {/* --- ALL MODALS (keep existing modals as they are) --- */}

    {/* Approve Modal */}
    <AnimatePresence>
      {showApproveModal && approvingOrder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 md:p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowApproveModal(false); setApprovingOrder(null); setAreaPrices({}); }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-2xl md:rounded-xl p-4 md:p-6 shadow-2xl h-[95vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4 sticky top-0 bg-white pt-2 pb-2 border-b">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center"><FaDollarSign size={20} /></div>
              <h2 className="text-xl font-black text-slate-900">Set Pricing for Areas</h2>
              <button onClick={() => { setShowApproveModal(false); setApprovingOrder(null); setAreaPrices({}); }} className="ml-auto p-2 hover:bg-slate-100 rounded-full transition-all"><FaTimesCircle className="text-slate-400 hover:text-red-500" /></button>
            </div>
            
            <div className="space-y-4 mb-6">
              {approvingOrder.areasList?.map((area: any, idx: number) => {
                const areaKey = `${area.areaName}-${idx}`;
                const quantity = area.quantity || 1;
                return (
                  <div key={idx} className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-black text-slate-900">{area.areaName}</p>
                        <p className="text-xs text-emerald-600">Quantity: {quantity}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-slate-600">£</span>
                        <input type="number" min="0" step="0.01" value={areaPrices[areaKey] || ''} onChange={(e) => { const value = parseFloat(e.target.value) || 0; setAreaPrices(prev => ({ ...prev, [areaKey]: value })); }} placeholder="0.00" className="w-32 p-3 bg-white border-2 border-emerald-200 rounded-xl text-sm font-bold text-right focus:border-emerald-500 focus:outline-none text-slate-900" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-900 p-4 rounded-xl mb-6 flex justify-between items-center">
              <span className="text-white text-xs font-black uppercase">Total:</span>
              <span className="text-2xl font-black text-emerald-400">£{Object.entries(areaPrices).reduce((sum, [key, price]) => {
                const area = approvingOrder.areasList?.find((a: any, idx: number) => `${a.areaName}-${idx}` === key);
                return sum + (price * (area?.quantity || 1));
              }, 0).toFixed(2)}</span>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setShowApproveModal(false); setApprovingOrder(null); }} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest">Cancel</button>
              <button onClick={handleApproveWithPrices} disabled={isSubmitting} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest disabled:bg-emerald-300">{isSubmitting ? 'Saving...' : 'Approve Order'}</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* Complete Modal */}
    <AnimatePresence>
      {showCompleteModal && completingOrder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCompleteModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6"><FaFlagCheckered size={24} /></div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">Mark as Completed?</h2>
            <p className="text-sm text-slate-500 mb-6">Confirm that the cleaning service for <b>{completingOrder.customerInfo?.fullName}</b> has been finished. This will add £{completingOrder.approvedTotal?.toFixed(2)} to revenue.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowCompleteModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-black uppercase text-[10px] tracking-widest">Back</button>
              <button onClick={handleCompleteOrder} disabled={isSubmitting} className="flex-1 py-4 bg-purple-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-purple-700 transition-all disabled:bg-purple-300">
                {isSubmitting ? 'Updating...' : 'Yes, Completed'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* Cancel Modal */}
    <AnimatePresence>
      {showCancelModal && cancellingOrder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowCancelModal(false); setCancellingOrder(null); }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center"><FaTimesCircle size={20} /></div>
              <h2 className="text-xl font-black text-slate-900">Cancel Request</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {cancelReasons.map((reason) => (
                <button key={reason.value} onClick={() => { setCancelReason(reason.value); setCustomReason(""); }} className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${cancelReason === reason.value ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600'}`}>{reason.label}</button>
              ))}
            </div>
            <textarea value={customReason} onChange={(e) => { setCustomReason(e.target.value); if (e.target.value) setCancelReason(""); }} placeholder="Or type custom reason..." rows={3} className="w-full p-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl text-sm outline-none mb-6 text-slate-900" />
            <div className="flex gap-3">
              <button onClick={() => setShowCancelModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest">Back</button>
              <button onClick={handleCancelWithReason} disabled={isSubmitting} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest">{isSubmitting ? 'Cancelling...' : 'Confirm Cancel'}</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* Passcode / Verification Modal */}
    <AnimatePresence>
      {showDeleteModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowDeleteModal(false); setIncompleteOrder(null); setSelectedOrderId(null); setPasscode(""); }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl text-center">
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6 ${incompleteOrder ? 'bg-amber-50 text-amber-500' : 'bg-red-50 text-red-500'}`}>
              <FaLock size={24} />
            </div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">
              {incompleteOrder ? 'Verify Incomplete' : 'Delete Order?'}
            </h2>
            <p className="text-xs text-slate-400 mb-6 font-bold uppercase tracking-widest">Enter Admin Passcode</p>
            <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="••••" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 text-gray-900 text-center text-xl font-black tracking-[1em] mb-6" autoFocus />
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteModal(false); setIncompleteOrder(null); setSelectedOrderId(null); setPasscode(""); }} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-black uppercase text-[10px] tracking-widest">Cancel</button>
              <button onClick={confirmDeletion} disabled={isSubmitting} className={`flex-1 py-4 text-white rounded-xl font-black uppercase text-[10px] tracking-widest ${incompleteOrder ? 'bg-amber-500' : 'bg-red-500'}`}>
                {isSubmitting ? 'Processing...' : incompleteOrder ? 'Verify' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </div>
  );
}