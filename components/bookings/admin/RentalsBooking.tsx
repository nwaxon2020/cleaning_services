"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, query, orderBy, onSnapshot, 
  doc, updateDoc, deleteDoc, serverTimestamp, addDoc, getDocs, where
} from 'firebase/firestore';
import { 
  FaWhatsapp, FaEnvelope, FaPhone, FaMapMarkerAlt, 
  FaCalendarAlt, FaClock, FaCheckCircle, FaUser,
  FaBox, FaLock, FaMapPin, FaList, FaTrash, 
  FaTimesCircle, FaComment, FaUserTimes, FaFlagCheckered, FaInfoCircle
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function AdminRentalOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  
  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  
  // Selection States
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [approvingOrder, setApprovingOrder] = useState<any>(null);
  const [cancellingOrder, setCancellingOrder] = useState<any>(null);
  const [completingOrder, setCompletingOrder] = useState<any>(null);
  const [incompleteOrder, setIncompleteOrder] = useState<any>(null);
  
  // Logic States
  const [passcode, setPasscode] = useState("");
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
      // Prepare items array with details
      const items = order.items?.map((item: any) => ({
        name: item.name,
        category: item.categoryName || '',
        quantity: item.quantity || 1,
        price: item.price || 0,
        subtotal: (item.price || 0) * (item.quantity || 1)
      })) || [];

      const revenueData = {
        serviceType: 'Rentals',
        customerName: order.fullName,
        contactMethod: order.contactPreference || 'WhatsApp',
        contactValue: order.phone,
        amount: order.total || 0,
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
    const q = query(collection(db, "renting_orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // --- LOGIC: APPROVAL ---
  const handleApproveClick = (order: any) => {
    setApprovingOrder(order);
    setShowApproveConfirm(true);
  };

  const handleApproveOrder = async () => {
    if (!approvingOrder) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "renting_orders", approvingOrder.id), { 
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: 'admin'
      });
      toast.success(`Order approved for ${approvingOrder.fullName}`);
      setShowApproveConfirm(false);
      setApprovingOrder(null);
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
      
      await updateDoc(doc(db, "renting_orders", completingOrder.id), {
        status: 'completed',
        completedAt: serverTimestamp(),
      });
      toast.success("Rental order marked as completed and added to revenue!");
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
      
      await updateDoc(doc(db, "renting_orders", order.id), {
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

      await updateDoc(doc(db, "renting_orders", cancellingOrder.id), { 
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

  // --- LOGIC: PERMANENT WIPE ---
  const confirmDeletion = async () => {
    if (passcode !== ADMIN_PASSCODE) return toast.error("Invalid Admin Passcode");
    
    if (incompleteOrder) {
      return executeMarkIncomplete(incompleteOrder);
    }
    if (!selectedOrderId) return;
    setIsSubmitting(true);
    try {
      // Also remove from revenue if it was in completed status
      const orderToDelete = orders.find(o => o.id === selectedOrderId);
      if (orderToDelete?.status === 'completed') {
        await removeFromRevenue(selectedOrderId);
      }
      
      await deleteDoc(doc(db, "renting_orders", selectedOrderId));
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
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="w-full p-4 pt-2 md:p-8 md:pt-4 bg-blue-50 min-h-screen relative">
      <div className="max-w-6xl mx-auto">
        <header>
          <div className="w-full md:w-auto flex justify-between bg-white border rounded-sm md:rounded-xl p-2 md:p-1 shadow-sm overflow-x-auto">
            {['pending', 'approved', 'completed', 'cancelled', 'all'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 md:px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${
                  filter === f ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'
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
              const preferredContact = getPreferredContactIcon(order.contactPreference, order.phone, order.email);
              
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
                      order.status === 'approved' ? 'bg-green-600' : 
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
                          <h3 className="font-black text-slate-900">{order.fullName}</h3>
                          
                          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${
                            order.status === 'approved' ? 'bg-green-50 border-green-100 text-green-600' :
                            order.status === 'completed' ? 'bg-purple-50 border-purple-100 text-purple-600' :
                            order.status === 'pending' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                            declinedByUser ? 'bg-orange-50 border-orange-100 text-orange-600' :
                            'bg-slate-50 border-slate-200 text-slate-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              order.status === 'approved' ? 'bg-green-500' :
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
                          <button onClick={() => toggleExpand(order.id)} className="text-xs text-slate-400 hover:text-slate-600">
                            {expandedOrder === order.id ? 'Show less' : 'Show details'}
                          </button>
                        </div>
                      </div>

                      {order.status === 'cancelled' && order.cancelReason && (
                        <div className={`mb-4 p-3 rounded-lg border ${declinedByUser ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-100'}`}>
                          <p className={`text-xs font-black flex items-center gap-2 ${declinedByUser ? 'text-orange-600' : 'text-red-600'}`}>
                            {declinedByUser ? <FaUserTimes /> : <FaTimesCircle />} 
                            {declinedByUser ? 'Declined by Customer:' : 'Cancellation Reason:'}
                          </p>
                          <p className={`text-xs mt-1 ${declinedByUser ? 'text-orange-700' : 'text-red-700'}`}>{order.cancelReason}</p>
                        </div>
                      )}

                      {(order.status === 'approved' || order.status === 'completed') && order.total && (
                        <div className={`mb-4 p-3 border rounded-lg ${order.status === 'completed' ? 'bg-purple-50 border-purple-100' : 'bg-green-50 border-green-100'}`}>
                          <p className={`text-xs font-black flex items-center gap-2 ${order.status === 'completed' ? 'text-purple-600' : 'text-green-600'}`}>
                            {order.status === 'completed' ? <FaFlagCheckered /> : <FaCheckCircle />} 
                            {order.status === 'completed' ? 'Revenue Generated:' : 'Approved Amount:'}
                          </p>
                          <p className={`text-lg font-black mt-1 ${order.status === 'completed' ? 'text-purple-700' : 'text-green-700'}`}>£{order.total.toFixed(2)}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          {preferredContact && (
                            <a href={preferredContact.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-blue-200 transition-all mb-2">
                              {preferredContact.icon} Preferred: {preferredContact.label}
                            </a>
                          )}
                          <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                            <FaMapMarkerAlt className="text-red-500"/> {order.address}
                          </p>
                        </div>

                        <div className="space-y-2 bg-blue-50 p-3 rounded-xl">
                          <div className="flex items-center gap-2 text-blue-400 mb-2">
                            <FaBox size={10}/> 
                            <span className="text-[9px] font-black uppercase tracking-widest">Items Ordered</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {order.items?.map((item: any, idx: number) => (
                              <span key={idx} className="px-2 py-1 bg-white text-blue-600 rounded-lg text-[9px] font-bold border border-blue-100">
                                {item.quantity}x {item.name}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-xs font-bold text-slate-700 space-y-2">
                            <p className="flex items-center gap-2"><FaCalendarAlt className="text-slate-300"/> {order.date || 'Not specified'}</p>
                            <p className="flex items-center gap-2"><FaClock className="text-slate-300"/> {order.time || 'Not specified'}</p>
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedOrder === order.id && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 pt-4 border-t border-slate-100">
                            <h5 className="text-xs font-black text-slate-400 uppercase mb-3">Items Details:</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {order.items?.map((item: any, idx: number) => (
                                <div key={idx} className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                  <p className="text-xs font-black text-slate-900">{item.name}</p>
                                  <p className="text-xs text-blue-600">Quantity: {item.quantity}</p>
                                  <p className="text-xs font-bold text-slate-700">Price: £{item.price} each</p>
                                  <p className="text-xs font-bold text-blue-600 mt-1">Subtotal: £{(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                              ))}
                            </div>
                            {order.notes && (
                              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                <p className="text-xs font-black text-blue-600">Additional Notes:</p>
                                <p className="text-xs text-blue-700 mt-1">{order.notes}</p>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex justify-end items-center gap-3 mt-4 pt-3 border-t border-slate-100">
                        {order.status === 'pending' && (
                          <>
                            <button onClick={() => handleApproveClick(order)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2">
                              <FaCheckCircle/> Approve Order
                            </button>
                            <button onClick={() => { setCancellingOrder(order); setShowCancelModal(true); }} className="px-4 py-2 bg-white border-2 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2">
                              <FaTimesCircle/> Cancel Order
                            </button>
                          </>
                        )}
                        {order.status === 'approved' && (
                          <button onClick={() => { setCompletingOrder(order); setShowCompleteModal(true); }} className="px-4 py-2 bg-purple-600 text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-purple-700 transition-all flex items-center gap-2">
                            <FaFlagCheckered/> Mark Completed
                          </button>
                        )}
                        {order.status === 'completed' && (
                          <button onClick={() => handleMarkIncomplete(order)} disabled={isSubmitting} className="px-4 py-2 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-amber-100 transition-all flex items-center gap-2">
                            <FaInfoCircle size={10}/> Mark Incomplete
                          </button>
                        )}
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

      {/* Approve Modal */}
      <AnimatePresence>
        {showApproveConfirm && approvingOrder && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowApproveConfirm(false); setApprovingOrder(null); }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle size={24} />
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-2 text-center">Approve Order?</h2>
              <p className="text-sm text-slate-500 mb-6 text-center">
                Are you sure you want to approve this rental order for <span className="font-bold text-slate-900">{approvingOrder?.fullName}</span>?
              </p>
              
              <div className="bg-blue-50 p-4 rounded-xl mb-6">
                <p className="text-xs font-black text-blue-600 mb-2">Order Summary:</p>
                <div className="space-y-2">
                  {approvingOrder?.items?.map((item: any, idx: number) => {
                    const category = approvingOrder.categories?.find((c: any) => c.id === item.categoryId);
                    const categoryName = category?.name || '';
                    const itemTotal = (item.price || 0) * (item.quantity || 1);
                    return (
                      <div key={idx} className="border-b border-blue-200 pb-2 last:border-0">
                        <p className="text-xs font-black text-slate-800">• <span className="font-black text-slate-900">*{item.name}*</span> {categoryName ? `(${categoryName})` : ''}</p>
                        <div className="flex justify-between text-xs font-bold text-slate-600 mt-1">
                          <span>Quantity: {item.quantity}</span>
                          <span>Price: £{item.price} each</span>
                          <span className="text-blue-600">Total: *£{itemTotal.toFixed(2)}*</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-2 border-t border-blue-200">
                  <div className="flex justify-between text-sm font-black">
                    <span className="text-slate-700">Grand Total:</span>
                    <span className="text-blue-600">£{approvingOrder?.total?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setShowApproveConfirm(false); setApprovingOrder(null); }} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest">Cancel</button>
                <button onClick={handleApproveOrder} disabled={isSubmitting} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest">{isSubmitting ? 'Approving...' : 'Confirm Approval'}</button>
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
              <p className="text-sm text-slate-500 mb-6">Confirm that the rental order for <b>{completingOrder.fullName}</b> has been fulfilled. This will add £{completingOrder.total?.toFixed(2)} to revenue.</p>
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
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center"><FaTimesCircle size={20} /></div>
                <h2 className="text-xl font-black text-slate-900">Cancel Order</h2>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {cancelReasons.map((reason) => (
                  <button key={reason.value} onClick={() => { setCancelReason(reason.value); setCustomReason(""); }} className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${cancelReason === reason.value ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>{reason.label}</button>
                ))}
              </div>
              <textarea value={customReason} onChange={(e) => { setCustomReason(e.target.value); if (e.target.value) setCancelReason(""); }} placeholder="Or type custom reason..." rows={3} className="w-full p-3 bg-blue-50 border-2 border-blue-200 rounded-xl text-sm outline-none mb-6 text-slate-900" />
              <div className="flex gap-3">
                <button onClick={() => setShowCancelModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest">Back</button>
                <button onClick={handleCancelWithReason} disabled={isSubmitting} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest">{isSubmitting ? 'Cancelling...' : 'Confirm Cancel'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Passcode Modal */}
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