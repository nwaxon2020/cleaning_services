"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, query, orderBy, onSnapshot, 
  doc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { 
  FaWhatsapp, FaEnvelope, FaPhone, FaMapMarkerAlt, 
  FaCalendarAlt, FaClock, FaCheckCircle, FaUser,
  FaLayerGroup, FaLock, FaMapPin, FaList, FaPaw, FaKey,
  FaInfoCircle, FaFileAlt, FaTrash, FaTimesCircle, FaComment, FaDollarSign, FaUserTimes
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function AdminCleaningOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [passcode, setPasscode] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  
  // Cancel reason states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  // Approve pricing states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvingOrder, setApprovingOrder] = useState<any>(null);
  const [areaPrices, setAreaPrices] = useState<{[key: string]: number}>({});
  const [isSubmittingApprove, setIsSubmittingApprove] = useState(false);

  const ADMIN_PASSCODE = process.env.NEXT_PUBLIC_ADMIN_PIN; 

  // Predefined cancel reasons
  const cancelReasons = [
    { label: "Amount is below average", value: "amount_below_average" },
    { label: "Dates cannot be met", value: "dates_unavailable" },
    { label: "Location out of service area", value: "location_out_of_area" },
    { label: "Service temporarily unavailable", value: "service_unavailable" },
    { label: "Incomplete information provided", value: "incomplete_info" },
    { label: "Duplicate request", value: "duplicate_request" },
    { label: "Customer requested cancellation", value: "customer_requested" },
    { label: "Staff/Resource unavailable", value: "resources_unavailable" },
    { label: "Weather conditions", value: "weather_conditions" },
    { label: "Payment issue", value: "payment_issue" },
  ];

  useEffect(() => {
    const q = query(collection(db, "cleaning_orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const updateStatus = async (id: string, newStatus: string, priceData?: any) => {
    try {
      await updateDoc(doc(db, "cleaning_orders", id), { 
        status: newStatus,
        ...priceData
      });
      toast.success(`Order ${newStatus}`);
    } catch (e) { 
      toast.error("Update failed"); 
    }
  };

  const handleApproveClick = (order: any) => {
    setApprovingOrder(order);
    // Initialize area prices with default 0
    const initialPrices: {[key: string]: number} = {};
    if (order.areasList) {
      order.areasList.forEach((area: any, index: number) => {
        initialPrices[`${area.areaName}-${index}`] = 0;
      });
    }
    setAreaPrices(initialPrices);
    setShowApproveModal(true);
  };

  const handleApproveWithPrices = async () => {
    if (!approvingOrder) return;
    
    // Validate that all areas have prices > 0
    const hasEmptyPrice = Object.values(areaPrices).some(price => price <= 0);
    if (hasEmptyPrice) {
      toast.error("Please set a price for all areas");
      return;
    }

    setIsSubmittingApprove(true);

    try {
      // Calculate total amount (sum of area prices)
      const totalAmount = Object.values(areaPrices).reduce((sum, price) => sum + price, 0);
      
      // Prepare the price data to save
      const priceData = {
        approvedPrices: areaPrices,
        approvedTotal: totalAmount,
        approvedAt: new Date(),
        approvedBy: 'admin'
      };

      await updateStatus(approvingOrder.id, 'approved', priceData);
      
      setShowApproveModal(false);
      setApprovingOrder(null);
      setAreaPrices({});
      toast.success(`Order approved with total: £${totalAmount.toFixed(2)}`);
    } catch (e) {
      toast.error("Approval failed");
    } finally {
      setIsSubmittingApprove(false);
    }
  };

  const handleCancelWithReason = async () => {
    if (!cancellingOrder) return;
    
    const finalReason = customReason.trim() || cancelReason;
    
    if (!finalReason) {
      toast.error("Please select or enter a cancellation reason");
      return;
    }

    try {
      const reasonText = customReason.trim() 
        ? customReason 
        : cancelReasons.find(r => r.value === cancelReason)?.label || cancelReason;

      await updateDoc(doc(db, "cleaning_orders", cancellingOrder.id), { 
        status: 'cancelled',
        cancelReason: reasonText,
        cancelledAt: new Date(),
        cancelledBy: 'admin'
      });
      
      toast.success("Order cancelled with reason");
      setShowCancelModal(false);
      setCancellingOrder(null);
      setCancelReason("");
      setCustomReason("");
    } catch (e) { 
      toast.error("Cancel failed"); 
    }
  };

  const handleWipeRequest = (id: string) => {
    setSelectedOrderId(id);
    setShowDeleteModal(true);
  };

  const confirmDeletion = async () => {
    if (passcode !== ADMIN_PASSCODE) {
      toast.error("Invalid Admin Passcode");
      return;
    }
    if (!selectedOrderId) return;
    try {
      await deleteDoc(doc(db, "cleaning_orders", selectedOrderId));
      toast.success("Record permanently deleted");
      setShowDeleteModal(false);
      setPasscode("");
      setSelectedOrderId(null);
    } catch (e) { 
      toast.error("Deletion failed"); 
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedOrder(expandedOrder === id ? null : id);
  };

  const filteredOrders = orders.filter(o => filter === 'all' ? true : o.status === filter);

  // Helper function to determine if order was cancelled by user
  const isUserDeclined = (order: any) => {
    return order.status === 'cancelled' && order.cancelledBy === 'customer';
  };

  if(loading){
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 rounded-full animate-spin border-2 border-t-transparent border-emerald-500"></div>
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
          <div className="w-full md:w-auto flex bg-white border rounded-sm md:rounded-xl p-2 md:p-1 shadow-sm">
            {['pending', 'approved', 'cancelled', 'all'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 md:px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
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
                      declinedByUser ? 'bg-orange-500' : 'bg-slate-400'
                    }`} />
                    
                    <div className="flex-1 p-5">
                      {/* Header Row */}
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 text-slate-400">
                            <FaUser size={10}/> 
                            <span className="text-[9px] font-black uppercase tracking-widest">Customer</span>
                          </div>
                          <h3 className="font-black text-slate-900">{order.customerInfo?.fullName || order.userName}</h3>
                          
                          {filter === 'all' && (
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${
                              order.status === 'approved' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                              order.status === 'pending' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                              declinedByUser ? 'bg-orange-50 border-orange-100 text-orange-600' :
                              'bg-slate-50 border-slate-200 text-slate-500'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                order.status === 'approved' ? 'bg-emerald-500' :
                                order.status === 'pending' ? 'bg-blue-500 animate-pulse' :
                                declinedByUser ? 'bg-orange-500' :
                                'bg-slate-400'
                              }`} />
                              <span className="text-[10px] font-black uppercase tracking-tighter">
                                {declinedByUser ? 'Declined by User' : order.status}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {order.sentViaWhatsApp && (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-bold flex items-center gap-1">
                              <FaWhatsapp size={12} /> WhatsApp
                            </span>
                          )}
                          <button 
                            onClick={() => toggleExpand(order.id)}
                            className="text-xs text-slate-400 hover:text-slate-600"
                          >
                            {expandedOrder === order.id ? 'Show less' : 'Show details'}
                          </button>
                        </div>
                      </div>

                      {/* Show cancel reason if order is cancelled */}
                      {order.status === 'cancelled' && order.cancelReason && (
                        <div className={`mb-4 p-3 rounded-lg border ${
                          declinedByUser 
                            ? 'bg-orange-50 border-orange-200' 
                            : 'bg-red-50 border-red-100'
                        }`}>
                          <p className={`text-xs font-black flex items-center gap-2 ${
                            declinedByUser ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {declinedByUser ? <FaUserTimes /> : <FaTimesCircle />} 
                            {declinedByUser ? 'Declined by Customer:' : 'Cancellation Reason:'}
                          </p>
                          <p className={`text-xs mt-1 ${
                            declinedByUser ? 'text-orange-700' : 'text-red-700'
                          }`}>{order.cancelReason}</p>
                          {order.cancelledBy === 'customer' && (
                            <p className="text-[9px] font-bold text-orange-500 mt-1">
                              • Customer declined the offer
                            </p>
                          )}
                        </div>
                      )}

                      {/* Show approved prices if order is approved */}
                      {order.status === 'approved' && order.approvedTotal && (
                        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                          <p className="text-xs font-black text-emerald-600 flex items-center gap-2">
                            <FaCheckCircle /> Approved Amount:
                          </p>
                          <p className="text-lg font-black text-emerald-700 mt-1">£{order.approvedTotal.toFixed(2)}</p>
                        </div>
                      )}

                      {/* Main Info Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Column 1: Contact Info */}
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                            <FaMapMarkerAlt className="text-red-500"/> {order.customerInfo?.address}
                          </p>
                          <p className="text-xs font-bold text-emerald-600 flex items-center gap-2">
                            <FaMapPin className="text-emerald-500"/> Preferred: {order.customerInfo?.contactPreference}
                          </p>
                          <div className="flex gap-2 mt-4">
                            <a href={`https://wa.me/${order.customerInfo?.phone?.replace(/\D/g,'')}`} target="_blank" className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all">
                              <FaWhatsapp size={14}/>
                            </a>
                            <a href={`tel:${order.customerInfo?.phone}`} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all">
                              <FaPhone size={14}/>
                            </a>
                            <a href={`mailto:${order.customerInfo?.email || order.userEmail}`} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all">
                              <FaEnvelope size={14}/>
                            </a>
                          </div>
                        </div>

                        {/* Column 2: Service Info */}
                        <div className="space-y-2 bg-emerald-50 p-3 rounded-xl">
                          <div className="flex items-center gap-2 text-emerald-400 mb-2">
                            <FaLayerGroup size={10}/> 
                            <span className="text-[9px] font-black uppercase tracking-widest">Service</span>
                          </div>
                          <h4 className="text-sm font-black text-emerald-600">{order.serviceName}</h4>
                          <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <FaList size={12}/> Total Areas: {order.totalAreas}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {order.customerInfo?.pets && (
                              <span className="px-2 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[8px] font-bold flex items-center gap-1">
                                <FaPaw size={10}/> Pets
                              </span>
                            )}
                            {order.customerInfo?.securityKeys && (
                              <span className="px-2 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[8px] font-bold flex items-center gap-1">
                                <FaKey size={10}/> Keys
                              </span>
                            )}
                            {order.customerInfo?.fence && (
                              <span className="px-2 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[8px] font-bold flex items-center gap-1">
                                <FaLock size={10}/> Fence
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Column 3: Schedule */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-slate-400">
                            <FaCalendarAlt size={10}/> 
                            <span className="text-[9px] font-black uppercase tracking-widest">Schedule</span>
                          </div>
                          <div className="text-xs font-bold text-slate-700 space-y-2">
                            <p className="flex items-center gap-2">
                              <FaCalendarAlt className="text-slate-300"/> {order.selectedDate}
                            </p>
                            <p className="flex items-center gap-2">
                              <FaClock className="text-slate-300"/> {order.selectedTime}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Areas Details */}
                      <AnimatePresence>
                        {expandedOrder === order.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-slate-100"
                          >
                            <h5 className="text-xs font-black text-slate-400 uppercase mb-3">Areas to be cleaned:</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {order.areasList?.map((area: any, idx: number) => (
                                <div key={idx} className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                  <p className="text-xs font-black text-slate-900">{area.areaName}</p>
                                  <p className="text-xs text-emerald-600">Quantity: {area.quantity}</p>
                                  {order.status === 'approved' && order.approvedPrices && (
                                    <p className="text-xs font-bold text-emerald-700 mt-1">
                                      Price: £{order.approvedPrices[`${area.areaName}-${idx}`] || 0}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>

                            {order.customerInfo?.additionalNotes && (
                              <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
                                <p className="text-xs font-black text-emerald-600 flex items-center gap-2">
                                  <FaFileAlt size={12}/> Additional Notes:
                                </p>
                                <p className="text-xs text-emerald-700 mt-1">{order.customerInfo.additionalNotes}</p>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Actions Footer */}
                      <div className="flex justify-end items-center gap-3 mt-4 pt-3 border-t border-slate-100">
                        {order.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleApproveClick(order)}
                              className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2"
                            >
                              <FaCheckCircle/> View Request
                            </button>
                            <button 
                              onClick={() => {
                                setCancellingOrder(order);
                                setShowCancelModal(true);
                              }}
                              className="px-4 py-2 bg-white border-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 rounded-lg font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2"
                            >
                              <FaTimesCircle/> Cancel Request
                            </button>
                          </>
                        )}

                        {(filter === 'approved' || filter === 'cancelled') && (
                          <button 
                            onClick={() => handleWipeRequest(order.id)}
                            className="px-4 py-2 bg-red-50 text-red-500 border border-red-100 rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                          >
                            <FaTrash size={10}/> Delete
                          </button>
                        )}
                        
                        <span className="text-[8px] font-black text-slate-400 ml-auto">
                          Ref: {order.id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Approve with Pricing Modal */}
      <AnimatePresence>
        {showApproveModal && approvingOrder && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 md:p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => {
                setShowApproveModal(false);
                setApprovingOrder(null);
                setAreaPrices({});
              }} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="relative bg-white w-full max-w-2xl md:rounded-xl p-4 md:p-6 shadow-2xl h-[95vh] overflow-y-auto"
            >
              <div className="flex items-center gap-3 mb-4 sticky top-0 bg-white pt-2 pb-2 border-b">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <FaDollarSign size={20} />
                </div>
                <h2 className="text-xl font-black text-slate-900">Set Pricing for Areas</h2>
                <button 
                  onClick={() => {
                    setShowApproveModal(false);
                    setApprovingOrder(null);
                    setAreaPrices({});
                  }} 
                  className="ml-auto p-2 hover:bg-slate-100 rounded-full transition-all"
                >
                  <FaTimesCircle className="text-slate-400 hover:text-red-500" />
                </button>
              </div>
              
              <p className="text-sm text-slate-500 mb-6">
                Set the price for each area. The total will be calculated automatically.
              </p>

              {/* Areas List with Price Inputs */}
              <div className="space-y-4 mb-6">
                {approvingOrder.areasList?.map((area: any, idx: number) => {
                  const areaKey = `${area.areaName}-${idx}`;
                  const quantity = area.quantity || 1;
                  
                  return (
                    <div key={idx} className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-black text-slate-900">{area.areaName}</p>
                          <p className="text-xs text-emerald-600">Quantity: {quantity} {quantity > 1 ? 'units' : 'unit'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-slate-600">£</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={areaPrices[areaKey] || ''}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              setAreaPrices(prev => ({
                                ...prev,
                                [areaKey]: value
                              }));
                            }}
                            placeholder="0.00"
                            className="text-gray-500 w-32 p-3 bg-white border-2 border-emerald-200 rounded-xl text-sm font-bold text-right focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      {areaPrices[areaKey] > 0 && (
                        <p className="text-xs text-emerald-600 mt-2 text-right">
                          Subtotal: £{(areaPrices[areaKey] * quantity).toFixed(2)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Total Calculation */}
              <div className="bg-slate-900 p-4 rounded-xl mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-white text-xs font-black uppercase">Total Amount:</span>
                  <span className="text-2xl font-black text-emerald-400">
                    £{Object.entries(areaPrices).reduce((sum, [key, price]) => {
                      const areaKey = key;
                      const area = approvingOrder.areasList?.find((a: any, idx: number) => `${a.areaName}-${idx}` === areaKey);
                      const quantity = area?.quantity || 1;
                      return sum + (price * quantity);
                    }, 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowApproveModal(false);
                    setApprovingOrder(null);
                    setAreaPrices({});
                  }} 
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleApproveWithPrices} 
                  disabled={isSubmittingApprove}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all disabled:bg-emerald-300 flex items-center justify-center gap-2"
                >
                  {isSubmittingApprove ? 'Saving...' : 'Approve Order'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Reason Modal */}
      <AnimatePresence>
        {showCancelModal && cancellingOrder && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => {
                setShowCancelModal(false);
                setCancellingOrder(null);
                setCancelReason("");
                setCustomReason("");
              }} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="relative bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <FaTimesCircle size={20} />
                </div>
                <h2 className="text-xl font-black text-slate-900">Cancel Request</h2>
              </div>
              
              <p className="text-sm text-slate-500 mb-4">
                Please provide a reason for cancelling this order
              </p>

              {/* Quick reason buttons */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {cancelReasons.slice(0, 6).map((reason) => (
                  <button
                    key={reason.value}
                    onClick={() => {
                      setCancelReason(reason.value);
                      setCustomReason("");
                    }}
                    className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      cancelReason === reason.value
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                    }`}
                  >
                    {reason.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {cancelReasons.slice(6).map((reason) => (
                  <button
                    key={reason.value}
                    onClick={() => {
                      setCancelReason(reason.value);
                      setCustomReason("");
                    }}
                    className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      cancelReason === reason.value
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                    }`}
                  >
                    {reason.label}
                  </button>
                ))}
              </div>

              {/* Custom reason input */}
              <div className="relative mb-6">
                <div className="absolute left-3 top-3 text-emerald-400">
                  <FaComment size={14} />
                </div>
                <textarea
                  value={customReason}
                  onChange={(e) => {
                    setCustomReason(e.target.value);
                    if (e.target.value) setCancelReason("");
                  }}
                  placeholder="Or type custom reason..."
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl text-sm outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancellingOrder(null);
                    setCancelReason("");
                    setCustomReason("");
                  }} 
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                >
                  Back
                </button>
                <button 
                  onClick={handleCancelWithReason} 
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all"
                >
                  Confirm Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowDeleteModal(false)} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                <FaLock size={24} />
              </div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">
                Delete Order?
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Enter admin passcode to permanently delete this cleaning order
              </p>
              <input 
                type="password" 
                value={passcode} 
                onChange={(e) => setPasscode(e.target.value)} 
                placeholder="••••" 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 text-gray-900 text-center text-xl font-black tracking-[1em] focus:border-emerald-500 focus:outline-none transition-all mb-6" 
                autoFocus 
              />
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteModal(false)} 
                  className="flex-1 py-3 bg-slate-100 text-slate-500 border border-gray-400 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeletion} 
                  className="flex-1 py-4 bg-red-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}