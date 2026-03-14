"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWhatsapp, FaEnvelope, FaPhone, FaCheckCircle, FaTrash, FaChartLine, FaExclamationTriangle, FaTruck, FaHistory, FaLock, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function RentalAdmin() {
  const [orders, setOrders] = useState<any[]>([]);
  const [cancelledOrders, setCancelledOrders] = useState<any[]>([]);
  const [confirmDelivery, setConfirmDelivery] = useState<any>(null);
  
  // NEW STATES
  const [showHistory, setShowHistory] = useState(false);
  const [secureDelete, setSecureDelete] = useState<{ id: string, collection: string } | null>(null);
  const [pinInput, setPinInput] = useState("");

  useEffect(() => {
    const unsubOrders = onSnapshot(query(collection(db, "renting_orders"), orderBy("createdAt", "desc")), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubCancelled = onSnapshot(query(collection(db, "canceled_rent_order"), orderBy("canceledAt", "desc")), (snap) => {
      setCancelledOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubOrders(); unsubCancelled(); };
  }, []);

  // --- REVENUE LOGIC ---
  const activeRevenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (o.total || 0), 0);
  const cancellationFees = cancelledOrders.reduce((sum, o) => sum + ((o.pricePaid || 0) * 0.15), 0);
  const totalRevenue = activeRevenue + cancellationFees;

  // --- STATS LOGIC ---
  const activeBookingsCount = orders.filter(o => o.status === 'paid' || o.status === 'processing').length;

    // --- DELIVERY LOGIC ---
    const handleMarkDelivered = async (order: any) => {
        try {
            const orderRef = doc(db, "renting_orders", order.id);
            await updateDoc(orderRef, { status: 'delivered' });

            const receiptUrl = `${window.location.origin}/receipts/${order.id}`;
            const message = `Hello ${order.fullName}, your order #${order.id.slice(0,5)} has been delivered! View receipt: ${receiptUrl}`;

            if (order.contactPreference === 'WhatsApp') {
            // 1. Remove all spaces, dashes, and brackets
            let cleanNumber = order.phone.replace(/\D/g, '');

            // 2. Bristol/UK Format Correction
            if (cleanNumber.startsWith('0')) {
                // Replace the leading 0 with 44
                cleanNumber = '44' + cleanNumber.substring(1);
            } else if (!cleanNumber.startsWith('44')) {
                // If they didn't include 44 or 0, assume it's a local number and add 44
                cleanNumber = '44' + cleanNumber;
            }

            // 3. Open WhatsApp
            window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
            } else if (order.contactPreference === 'Email') {
            window.location.href = `mailto:${order.email}?subject=Order Delivered&body=${encodeURIComponent(message)}`;
            }

            toast.success("Order delivered & user notified!");
            setConfirmDelivery(null);
        } catch (e) {
            toast.error("Update failed");
        }
    };

  // --- SECURE DELETE LOGIC ---
  const handlePermanentDelete = async () => {
    if (pinInput !== process.env.NEXT_PUBLIC_ADMIN_PIN) {
      return toast.error("Incorrect Admin PIN");
    }

    try {
      await deleteDoc(doc(db, secureDelete!.collection, secureDelete!.id));
      toast.success("Data wiped permanently");
      setSecureDelete(null);
      setPinInput("");
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-8 pt-4 pb-6 md:p-4 bg-[#020617] min-h-screen text-slate-100 relative">
      
      {/* HEADER WITH LIVE COUNTER */}
      <div className="flex justify-center md:justify-end items-end border-b border-white/10 pb-2">
        
        <div className="flex gap-4">
            <div className="bg-blue-600 px-6 py-2 rounded-2xl flex flex-col items-center shadow-lg shadow-blue-500/20">
                <span className="text-xl font-black leading-tight">{activeBookingsCount}</span>
                <span className="text-[8px] font-black uppercase tracking-tighter">Active</span>
            </div>
            <button 
                onClick={() => setShowHistory(!showHistory)}
                className="bg-white/5 border border-white/10 px-6 py-2 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase hover:bg-white/10 transition-all"
            >
                <FaHistory /> {showHistory ? "Close History" : "Transaction History"}
            </button>
        </div>
      </div>

      {/* 1. ANALYTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RevenueCard title="Total Revenue" amount={totalRevenue} icon={<FaChartLine />} color="text-emerald-400" subtitle="Incl. 15% Cancel Fees" />
        <RevenueCard title="Active Orders" amount={activeRevenue} icon={<FaTruck />} color="text-blue-400" subtitle="Pending & Paid" />
        <RevenueCard title="Cancellation Income" amount={cancellationFees} icon={<FaExclamationTriangle />} color="text-orange-400" subtitle="15% Retention" />
      </div>

      {/* 2. ACTIVE ORDERS LIST (Hides 'delivered' and 'cancelled') */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-sm font-black uppercase tracking-widest text-blue-500">Dispatch Queue</h2>
        </div>
        
        <div className="divide-y divide-white/5">
          {orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').map(order => (
            <div key={order.id} className="p-6 hover:bg-white/[0.02] transition-colors">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-500/20 text-blue-500 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                      {order.status}
                    </span>
                    <span className="text-slate-500 text-[10px] font-mono uppercase italic">#{order.id.slice(-6)}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white uppercase">{order.fullName}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-2"><FaTruck className="text-blue-500"/> {order.address}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    {order.items?.map((item: any, i: number) => (
                      <span key={i} className="text-[9px] font-black bg-white/5 border border-white/10 px-2 py-1 rounded-md text-slate-300">
                        {item.quantity}x {item.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-4 min-w-[200px]">
                  <div className="text-right">
                    <p className="text-2xl font-black text-white italic">£{order.total?.toFixed(2)}</p>
                    <div className="flex justify-end gap-3 mt-2">
                      <ContactIcon type="WhatsApp" value={order.phone} active={order.contactPreference === 'WhatsApp'} />
                      <ContactIcon type="Email" value={order.email} active={order.contactPreference === 'Email'} />
                      <ContactIcon type="Phone" value={order.phone} active={order.contactPreference === 'Phone Call'} />
                    </div>
                  </div>

                  <button 
                    onClick={() => setConfirmDelivery(order)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Mark as Delivered
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. HISTORY DROPDOWN (ABSOLUTE) */}
      <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="min-h-[20rem] absolute top-20 left-4 right-4 z-50 bg-white border border-white/10 rounded-lg shadow-2xl overflow-hidden max-h-[70vh] flex flex-col"
          >
            <div className="p-6 py-3 text-black border-b border-black/10 flex justify-between items-center ">
                <h2 className="font-black uppercase italic tracking-tighter">Transaction Ledger (Closed)</h2>
                <button onClick={() => setShowHistory(false)} className="text-black hover:text-red-500"><FaTimes /></button>
            </div>
            <div className="overflow-y-auto p-4 space-y-3">
                {[...orders.filter(o => o.status === 'delivered'), ...cancelledOrders].map((item: any) => (
                    <div key={item.id} className={`p-4 rounded-xl border border-gray-300 flex items-center justify-between ${item.status === 'delivered' ? 'bg-emerald-500/5 border-emerald-100' : 'bg-gray-200 border-red-100 opacity-60'}`}>
                        <div className="flex items-center gap-4">
                            <div className={item.status === 'delivered' ? 'text-emerald-800' : 'text-red-600'}>
                                {item.status === 'delivered' ? <FaCheckCircle /> : <FaTimes />}
                            </div>
                            <div>
                                <p className="text-black text-[10px] font-black uppercase">{item.fullName || "Cancelled Order"}</p>
                                <p className="text-[9px] text-black">£{item.total?.toFixed(2) || item.pricePaid?.toFixed(2)} — {item.status || 'CANCELLED'}</p>
                            </div>
                        </div>

                        {/* VIEW RECEIPT BUTTON - ONLY FOR DELIVERED */}
                        {item.status === 'delivered' && (
                            <button 
                            onClick={() => window.open(`/receipts/${item.id}`)}
                            className="flex items-center gap-2 bg-black text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase text-blue-400 hover:bg-blue-500 transition-all"
                            >
                            <FaChartLine size={10} /> View Receipt
                            </button>
                        )}

                        <button 
                            onClick={() => setSecureDelete({ id: item.id, collection: item.status === 'delivered' ? 'renting_orders' : 'canceled_rent_order' })}
                            className="text-slate-900 hover:text-red-500 p-2 transition-all"
                        >
                            <FaTrash size={12}/>
                        </button>
                    </div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. SECURE DELETE PIN OVERLAY */}
      <AnimatePresence>
        {secureDelete && (
          <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-900 border border-red-500/30 p-8 rounded-2xl max-w-sm w-full text-center">
              <FaLock className="text-red-500 text-3xl mx-auto mb-4" />
              <h3 className="text-xl font-black uppercase text-white mb-2">Security Check</h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-6 leading-relaxed">Wiping data is permanent and cannot be recovered from the database. Enter Admin PIN to proceed.</p>
              
              <input 
                type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)}
                placeholder="****"
                className="w-full bg-black/40 border border-white/10 p-4 rounded-2xl text-center text-2xl tracking-[0.5em] mb-6 outline-none focus:border-red-500 transition-all"
              />

              <div className="flex gap-4">
                <button onClick={() => { setSecureDelete(null); setPinInput(""); }} className="flex-1 py-4 border-1 border-gray-400 rounded-2xl text-gray-400 font-bold uppercase text-[10px]">Cancel</button>
                <button onClick={handlePermanentDelete} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px]">Wipe Data</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. DELIVERY CONFIRMATION OVERLAY */}
      <AnimatePresence>
        {confirmDelivery && (
          <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-white/10 p-8 rounded-3xl max-w-sm text-center">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                <FaCheckCircle />
              </div>
              <h3 className="text-xl font-black text-white uppercase mb-2">Confirm Delivery?</h3>
              <p className="text-slate-400 text-xs mb-6">This will notify {confirmDelivery.fullName} via {confirmDelivery.contactPreference} and move order to History.</p>
              <div className="flex gap-4">
                <button onClick={() => setConfirmDelivery(null)} className="flex-1 py-3 text-slate-400 font-bold uppercase text-[10px]">Cancel</button>
                <button onClick={() => handleMarkDelivered(confirmDelivery)} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px]">Yes, Delivered</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-components as defined in your code
function RevenueCard({ title, amount, icon, color, subtitle }: any) {
  return (
    <div className="bg-white/5 border border-white/10 p-6 rounded-xl relative overflow-hidden group">
      <div className={`absolute -right-4 -bottom-4 text-6xl opacity-5 transition-transform group-hover:scale-110 ${color}`}>{icon}</div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{title}</p>
      <p className={`text-3xl font-black italic mt-1 ${color}`}>£{amount.toFixed(2)}</p>
      <p className="text-[9px] text-slate-500 mt-2 uppercase">{subtitle}</p>
    </div>
  );
}

function ContactIcon({ type, value, active }: any) {
  // --- BRISTOL / UK NUMBER FIX ---
  const formatUKNumber = (num: string) => {
    if (!num) return "";
    let clean = num.replace(/\D/g, ''); // Remove all non-digits
    if (clean.startsWith('0')) {
      clean = '44' + clean.substring(1); // Change 07... to 447...
    } else if (!clean.startsWith('44')) {
      clean = '44' + clean; // Add 44 if missing
    }
    return clean;
  };

  const icons: any = { 
    WhatsApp: { 
      icon: <FaWhatsapp />, 
      href: `https://wa.me/${formatUKNumber(value)}` 
    },
    Email: { 
      icon: <FaEnvelope />, 
      href: `mailto:${value}` 
    },
    Phone: { 
      icon: <FaPhone />, 
      href: `tel:${value}` 
    }
  };
  
  return (
    <a 
      href={icons[type].href} 
      target="_blank" 
      rel="noreferrer"
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
        active 
          ? 'bg-blue-500 text-white scale-110 shadow-lg shadow-blue-500/40' 
          : 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10'
      }`}
      title={`${type}: ${value}`}
    >
      {icons[type].icon}
    </a>
  );
}