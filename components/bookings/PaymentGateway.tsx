"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCreditCard, FaLock, FaSpinner } from 'react-icons/fa';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface PaymentProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  customerOrder: any; // This will hold the items from Rental/Cleaning etc.
  serviceType: string;
  onSuccess: () => void;
}

export default function PaymentGateway({ 
  isOpen, onClose, totalAmount, customerOrder, serviceType, onSuccess 
}: PaymentProps) {
  const [isPaying, setIsPaying] = useState(false);

  const handleFinalProcess = async () => {
    setIsPaying(true);
    try {
      // Logic for all services goes to the same 'bookings' collection
      await addDoc(collection(db, "bookings"), {
        serviceType: serviceType,
        location: 'Bristol, UK',
        orderData: customerOrder,
        amount: totalAmount,
        status: 'paid',
        createdAt: serverTimestamp()
      });

      toast.success("Payment successful!");
      onSuccess(); // Clear cart and close modal in parent
      onClose();
    } catch (error) {
      toast.error("Transaction failed. Please try again.");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/90 z-[200] flex items-center justify-center p-4 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
            className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl relative"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaLock size={24} />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight">Secure Checkout</h3>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{serviceType} Service</p>
            </div>

            {/* Payment Fields (Visual Only) */}
            <div className="space-y-4 mb-8 text-left">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Card Number</label>
                <input disabled placeholder="•••• •••• •••• 4242" className="bg-transparent w-full outline-none font-mono text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Expiry</label>
                  <input disabled placeholder="01 / 28" className="bg-transparent w-full outline-none font-mono text-sm" />
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">CVC</label>
                  <input disabled placeholder="•••" className="bg-transparent w-full outline-none font-mono text-sm" />
                </div>
              </div>
            </div>

            <button
              onClick={handleFinalProcess}
              disabled={isPaying}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
            >
              {isPaying ? <FaSpinner className="animate-spin" /> : `Pay £${totalAmount.toFixed(2)}`}
            </button>

            <button
              onClick={onClose}
              className="w-full mt-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-red-500 transition-colors"
            >
              Cancel and Return
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}