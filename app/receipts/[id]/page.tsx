"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaCheckCircle, FaCalendarCheck, FaPrint, FaTimes, FaTools, FaReceipt } from 'react-icons/fa';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function BookingSuccess() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) return;

    // We listen to 'renting_orders' because that is where your UI saves rentals
    const unsub = onSnapshot(doc(db, 'renting_orders', bookingId), (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data());
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [bookingId]);

  // Logic to handle the 'items' array from your Rental UI
  const getServiceList = () => {
    if (!data) return "Loading...";
    if (data.items && Array.isArray(data.items)) {
      return data.items.map((item: any) => `${item.quantity}x ${item.name}`).join(', ');
    }
    return "Rental Items Not Specified";
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center font-black uppercase text-[10px] tracking-widest text-slate-400">
        Authenticating Receipt...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-6 text-center">
        <FaReceipt className="text-slate-200 text-6xl mb-4" />
        <h2 className="text-xl font-black uppercase italic">Receipt Not Found</h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 leading-relaxed">
          The order ID <span className="text-black font-mono">{bookingId}</span> <br/> could not be found in our records.
        </p>
        <button onClick={() => router.back()} className="mt-6 text-[10px] font-black underline uppercase">Return to Store</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[500] bg-white flex items-center justify-center p-4">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-sm -z-10" />
      
      <div className="bg-white w-full max-w-sm border-2 border-slate-900 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.2)] relative">
        
        {/* Close Button */}
        <button 
          onClick={() => router.back()}
          className="absolute top-4 right-4 z-10 p-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-full transition-colors"
        >
          <FaTimes size={14} />
        </button>

        {/* Receipt Header */}
        <div className="bg-slate-900 pt-10 pb-6 px-8 text-center text-white">
          <img src="/favicon.png" alt="Logo" className="w-10 h-10 rounded-full mx-auto mb-3 object-contain border border-white/20" />
          <FaCheckCircle className="text-orange-500 text-3xl mx-auto mb-2" />
          <h1 className="text-lg font-black uppercase italic tracking-tighter">Payment Received</h1>
          <div className="flex items-center justify-center gap-1 mt-1">
            <FaTools className="text-orange-500 text-[8px]" />
            <p className="text-[8px] text-slate-400 uppercase tracking-[0.2em] font-bold">Official Rental Receipt</p>
          </div>
        </div>
        
        {/* Receipt Body */}
        <div className="py-4 px-5 space-y-4">
          <div className="flex flex-col text-start border-b-2 border-dashed border-slate-100 pb-2">
            <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Reference ID: </span>
            <span className="text-[10px] font-black text-slate-900 font-mono tracking-tight break-all uppercase">
              {bookingId}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-black text-slate-400 uppercase">Items Paid</span>
            <p className="text-[11px] font-bold text-slate-800 leading-relaxed capitalize">
              {getServiceList()}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-0.5">
               <span className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-1">
                 <FaCalendarCheck className="text-orange-500" /> Status
               </span>
               <span className="text-[10px] font-bold text-slate-900 block uppercase italic">Paid & Confirmed</span>
            </div>
            <div className="text-right space-y-0.5">
               <span className="text-[8px] font-black text-slate-400 uppercase block">Total Amount</span>
               <span className="text-lg font-black text-slate-900 italic leading-none">
                 £{Number(data.total || 0).toFixed(2)}
               </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <p className="text-[8px] font-bold text-slate-500 leading-relaxed uppercase text-center">
              Please present this ID or a screenshot for verification at the time of pickup or delivery to: <br/>
              <span className="text-slate-900 font-black">{data.address}</span>
            </p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-slate-50 p-4 flex justify-center border-t border-slate-100 print:hidden">
          <button 
            onClick={() => window.print()} 
            className="flex items-center gap-2 text-[9px] font-black uppercase text-slate-900 hover:text-orange-600 transition-all px-6 py-2 bg-white rounded-lg border border-slate-200 shadow-sm"
          >
            <FaPrint /> Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}