"use client";

import { motion } from 'framer-motion';
import { 
  FaPlusCircle, FaMinusCircle, FaChevronLeft, FaChevronRight, FaCreditCard, FaMapMarkerAlt,
} from 'react-icons/fa';

/**
 * Counter Component
 * Logic: Handles increment/decrement of room units
 */
export const Counter = ({ label, count, onChange, price }: any) => (
  <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
    <div className="flex flex-col">
      <span className="text-[11px] font-black uppercase tracking-tight text-slate-700">{label}</span>
      <span className="text-[8px] font-bold text-slate-400 italic">£{price} each</span>
    </div>
    <div className="flex items-center gap-4">
      <button 
        onClick={() => onChange(Math.max(0, count - 1))} 
        className="text-slate-300 hover:text-orange-500 transition-colors"
      >
        <FaMinusCircle size={22} />
      </button>
      <span className="w-6 text-center font-black text-slate-900 text-sm">{count}</span>
      <button 
        onClick={() => onChange(count + 1)} 
        className="text-slate-300 hover:text-orange-500 transition-colors"
      >
        <FaPlusCircle size={22} />
      </button>
    </div>
  </div>
);

/**
 * RequirementSlider Component
 * Logic: Provides a horizontal scrolling checklist for site requirements
 */
export const RequirementSlider = ({ requirements, checkedRequirements, onToggle, scrollRef, onScroll }: any) => (
  <div className="mb-10 relative">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Essential Site Checklist</h3>
      <div className="flex gap-2">
        <button onClick={() => onScroll('left')} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-all">
          <FaChevronLeft size={10} />
        </button>
        <button onClick={() => onScroll('right')} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-all">
          <FaChevronRight size={10} />
        </button>
      </div>
    </div>
    <div 
      ref={scrollRef} 
      className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x"
    >
      {requirements.map((req: any) => (
        <motion.div 
          key={req.id} 
          whileTap={{ scale: 0.95 }}
          onClick={() => onToggle(req.id)}
          className={`flex-shrink-0 w-40 p-5 rounded-2xl border-2 transition-all cursor-pointer snap-start ${
            checkedRequirements[req.id] ? 'border-orange-500 bg-orange-50 shadow-inner' : 'border-slate-100 bg-slate-50'
          }`}
        >
          <div className={`mb-3 text-lg ${checkedRequirements[req.id] ? 'text-orange-600' : 'text-slate-300'}`}>
            {req.icon}
          </div>
          <p className="text-[9px] font-black uppercase tracking-tight leading-tight">{req.label}</p>
        </motion.div>
      ))}
    </div>
  </div>
);

/**
 * PaymentModal Component
 * Logic: Final confirmation step.
 */
export const PaymentModal = ({ bookingData, onConfirm, onCancel }: any) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl"
      >
        <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-6 flex items-center gap-2">
          <FaCreditCard className="text-orange-500" /> Finalize Booking
        </h2>
        
        <div className="space-y-4 mb-8">
          <div className="bg-slate-900 rounded-2xl p-6 text-center text-white">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Amount Due</span>
            <div className="text-4xl font-black text-orange-500 italic">£{bookingData.total.toFixed(2)}</div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3 text-[10px] font-bold uppercase">
            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-400">Service</span>
              <span className="text-slate-900">{bookingData.service}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-400">Schedule</span>
              {/* FIXED: Changed from bookingTime to bookingData.time */}
              <span className="text-slate-900">{bookingData.date} @ {bookingData.time}</span>
            </div>
            <div className="flex items-start gap-3 pt-1">
              <FaMapMarkerAlt className="text-orange-500 mt-0.5" />
              <p className="text-slate-600 leading-tight">{bookingData.address || 'Address not provided'}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onCancel} 
            className="flex-1 py-4 bg-slate-100 text-slate-900 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="flex-1 py-4 bg-orange-600 text-white rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-orange-700 shadow-xl active:scale-95 transition-all"
          >
            Confirm & Pay
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};