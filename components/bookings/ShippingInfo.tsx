"use client";

import { motion } from 'framer-motion';
import { FaTruck, FaInfoCircle, FaExclamationCircle } from 'react-icons/fa';

interface ShippingInfoProps {
  totalPrice: number;
}

export default function ShippingInfo({ totalPrice }: ShippingInfoProps) {
  // CONFIGURATION
  const MOV = 30.00; // Minimum Order Value for delivery
  const SHIPPING_THRESHOLD = 90.00; // Free delivery threshold
  const DELIVERY_FEE = 15.00;

  const isUnderMOV = totalPrice < MOV;
  const isFreeShipping = totalPrice >= SHIPPING_THRESHOLD;
  const amountToFree = Math.max(0, SHIPPING_THRESHOLD - totalPrice);
  const progressPercent = Math.min(100, (totalPrice / SHIPPING_THRESHOLD) * 100);

  return (
    <div className="mt-6 p-3 bg-slate-50 border border-slate-200 rounded-md space-y-4">
      {/* Header Status */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FaTruck className={isFreeShipping ? "text-emerald-500" : "text-blue-600"} />
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Bristol Delivery
          </h3>
        </div>
        {isFreeShipping ? (
          <span className="text-[9px] font-black text-emerald-600 uppercase bg-emerald-100 px-2 py-1 rounded-full">
            Free Delivery Unlocked
          </span>
        ) : (
          <span className="text-[9px] font-black text-blue-600 uppercase bg-blue-100 px-2 py-1 rounded-full">
            Tiered Delivery
          </span>
        )}
      </div>

      {/* Progress Bar for Free Shipping */}
      {!isFreeShipping && (
        <div className="space-y-2">
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-blue-600"
            />
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase italic flex justify-between">
            <span>Progress to Free Shipping</span>
            <span className="text-slate-900">£{amountToFree.toFixed(2)} left</span>
          </p>
        </div>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className={`p-2 flex items-center gap-2 rounded-xl border ${isUnderMOV ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'} transition-colors`}>
          <div className="flex items-center gap-1">
            <FaInfoCircle size={8} className="text-slate-400" />
            <p className="text-[8px] font-black uppercase text-slate-400">Min. Order</p>
          </div>
          <p className={`text-sm font-black ${isUnderMOV ? 'text-red-600' : 'text-slate-800'}`}>
            £{MOV.toFixed(2)}
          </p>
        </div>

        <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-100">
          <div className="flex items-center gap-1">
            <FaTruck size={8} className="text-slate-400" />
            <p className="text-[8px] font-black uppercase text-slate-400">Std. Delivery</p>
          </div>
          <p className="text-xs font-black text-slate-800">
            £{DELIVERY_FEE.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Minimum Order Warning */}
      {isUnderMOV && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-2 bg-red-600 text-white rounded-xl flex items-center gap-3 shadow-lg shadow-orange-500/20"
        >
          <FaExclamationCircle className="shrink-0" />
          <p className="text-[9px] font-black uppercase italic leading-tight">
            Order is below £{MOV}. Delivery not available. (Local Pickup Only)
          </p>
        </motion.div>
      )}
    </div>
  );
}