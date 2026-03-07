"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaCheckCircle, FaCalendarCheck, FaPrint, FaTimes } from 'react-icons/fa';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function BookingSuccess() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;
  const [bookingData, setBookingData] = useState<any>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) return;
      const docRef = doc(db, 'bookings', bookingId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setBookingData(docSnap.data());
      }
    };
    fetchBooking();
  }, [bookingId]);

  // Logic to join service name + room labels with commas
  const getServiceList = () => {
    if (!bookingData) return "Loading services...";
    const rooms = bookingData.roomDetails?.map((r: any) => `${r.count}x ${r.label}`) || [];
    return [bookingData.service, ...rooms].join(', ');
  };

  return (
    <div className="fixed inset-0 z-[500] bg-white flex items-center justify-center p-4">
      {/* Background Decor to make it look like an overlay */}
      <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-sm -z-10" />
      
      <div className="bg-white w-full max-w-sm border-2 border-slate-900 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.2)] relative">
        
        {/* X to Cancel/Close */}
        <button 
          onClick={() => router.back()}
          className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
        >
          <FaTimes size={14} />
        </button>

        {/* Receipt Header - Reduced Size */}
        <div className="bg-slate-900 pt-10 pb-6 px-8 text-center text-white">
          <img src="/favicon.png" alt="Logo" className="w-10 h-10 rounded-full mx-auto mb-3 object-contain" />
          <FaCheckCircle className="text-orange-500 text-3xl mx-auto mb-2" />
          <h1 className="text-lg font-black uppercase italic tracking-tighter">Payment Received</h1>
          <p className="text-[8px] text-slate-400 uppercase tracking-[0.2em] font-bold">Official Digital Receipt</p>
        </div>
        
        {/* Receipt Body */}
        <div className="py-4 px-5 space-y-1">
          <div className="flex flex-col justify-start text-start border-b-2 border-dashed border-slate-100 pb-1">
            <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Reference ID: </span>
            <span className="text-[10px] font-black text-slate-900 font-mono tracking-tight break-all uppercase">
              {bookingId}
            </span>
          </div>

          {/* Combined Services List - Horizontal with wrap */}
          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 uppercase">Items Paid</span>
            <p className="text-[10px] font-bold text-slate-800 leading-relaxed capitalize">
              {getServiceList()}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-0.5">
               <span className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-1">
                 <FaCalendarCheck className="text-orange-500" /> Status
               </span>
               <span className="text-[10px] font-bold text-slate-900 block uppercase italic">Confirmed</span>
            </div>
            <div className="text-right space-y-0.5">
               <span className="text-[8px] font-black text-slate-400 uppercase block">Total Amount</span>
               <span className="text-sm font-black text-green-600 uppercase">
                 £{bookingData?.total?.toFixed(2) || '0.00'}
               </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-[8px] font-bold text-slate-500 leading-relaxed uppercase text-center">
              Please present this ID or a screenshot to the cleaning team upon arrival at {bookingData?.bookingTime} on {bookingData?.bookingDate}.
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-slate-50 p-4 flex justify-center border-t border-slate-100">
          <button 
            onClick={() => window.print()} 
            className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-900 hover:text-orange-600 transition-all px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-sm"
          >
            <FaPrint /> Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}