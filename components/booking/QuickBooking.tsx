"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"; 
import { db, auth } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { FaSpinner, FaPlusCircle, FaMinusCircle, FaArrowLeft, FaCheckCircle, FaReceipt, FaCalendarAlt, FaPaw, FaUndo, FaLock, FaExclamationTriangle } from "react-icons/fa";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

// --- SUB-COMPONENT: AvailabilityGrid ---
const AvailabilityGrid = ({ selectedDate, onSelect, currentSlot }: any) => {
  const [busySlots, setBusySlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const TIME_SLOTS = ["6 - 8", "9 - 12", "1 - 4", "5 - 6", "7 - 9"];

  useEffect(() => {
    if (!selectedDate) return;
    
    const fetchBusySlots = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "bookings"), where("bookingDate", "==", selectedDate));
        const snap = await getDocs(q);
        setBusySlots(snap.docs.map(d => d.data().bookingTime));
      } catch (e) {
        console.error("Availability sync error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchBusySlots();
  }, [selectedDate]);

  if (loading) return <div className="py-4 flex justify-center"><FaSpinner className="animate-spin text-orange-500" /></div>;

  return (
    <div className="grid grid-cols-5 gap-1.5 mt-2">
      {TIME_SLOTS.map(slot => {
        const isTaken = busySlots.includes(slot);
        const isSelected = currentSlot === slot;
        return (
          <button
            key={slot}
            type="button"
            disabled={isTaken}
            onClick={() => onSelect(slot)}
            className={`py-4 rounded-lg text-xs font-black transition-all border flex flex-col items-center justify-center gap-1 ${
              isTaken ? 'bg-red-500/30 border-red-500/20 text-red-500 cursor-not-allowed' :
              isSelected ? 'bg-orange-500 border-orange-500 text-white shadow-lg' : 'bg-white/5 border-white/10 text-white hover:border-orange-500'
            }`}
          >
            {isTaken && <FaLock size={8} />}
            {slot}
          </button>
        );
      })}
    </div>
  );
};

const ROOM_TYPES = [
  { id: 'bedroom', label: 'Bedrooms', price: 35, category: ['home', 'deep', 'end-of-tenancy', 'office'] },
  { id: 'bathroom', label: 'Bathroom', price: 25, category: ['home', 'deep', 'end-of-tenancy'] },
  { id: 'kitchen', label: 'Kitchen', price: 45, category: ['home', 'deep', 'end-of-tenancy', 'office'] },
  { id: 'living', label: 'Living Room', price: 30, category: ['home', 'deep', 'end-of-tenancy', 'office'] },
  { id: 'office', label: 'Office Room', price: 25, category: ['office', 'deep', 'end-of-tenancy'] },
  { id: 'window_int', label: 'Int. Windows', price: 12, category: ['windows', 'home', 'office', 'deep'] },
  { id: 'driveway', label: 'Driveway', price: 60, category: ['compound'] },
  { id: 'oven', label: 'Oven Scrub', price: 35, category: ['oven', 'deep'] },
];

const SERVICES_LIST = [
  { id: 'home', name: 'Home Cleaning', basePrice: 40 },
  { id: 'office', name: 'Office Cleaning', basePrice: 35 },
  { id: 'deep', name: 'Deep Cleaning', basePrice: 60 },
  { id: 'compound', name: 'Compound Cleaning', basePrice: 50 },
  { id: 'oven', name: 'Oven Scrub', basePrice: 55 },
];

const TIME_SLOTS = ["6 - 8", "9 - 12", "1 - 4", "5 - 6", "7 - 9"];

const QuickBooking = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    service: "",
    date: "",
    time: "",
    hasPets: false,
    notes: ""
  });
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [existingBooking, setExistingBooking] = useState<any>(null);
  const [tempHiddenBooking, setTempHiddenBooking] = useState<any>(null);
  const [otherBookingsCount, setOtherBookingsCount] = useState(0);

  // LOGIC: Sync User Auth and Fetch/Sort existing bookings 
  // BUG FIX: Added explicit logout handling and check for user existence before query
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is logged in
        setFormData((prev: any) => ({ 
            ...prev, 
            email: user.email || "", 
            name: user.displayName || prev.name 
        }));

        try {
          const q = query(collection(db, "bookings"), where("userEmail", "==", user.email));
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
            const allBookings = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            const todayStr = new Date().toISOString().split('T')[0];
            
            const futureBookings = allBookings
              .filter((b: any) => b.bookingDate >= todayStr)
              .sort((a: any, b: any) => {
                const dateCompare = a.bookingDate.localeCompare(b.bookingDate);
                if (dateCompare !== 0) return dateCompare;
                const timeA = TIME_SLOTS.indexOf(a.bookingTime);
                const timeB = TIME_SLOTS.indexOf(b.bookingTime);
                return timeA - timeB;
              });

            if (futureBookings.length > 0) {
              setExistingBooking(futureBookings[0]);
              setOtherBookingsCount(futureBookings.length - 1);
            } else {
              setExistingBooking(null);
              setOtherBookingsCount(0);
            }
          }
        } catch (error) {
          console.error("Firestore Permission Error handled:", error);
        }
      } else {
        // LOGIC: User logged out - RESET all personal data to prevent cross-account viewing
        setExistingBooking(null);
        setOtherBookingsCount(0);
        setTempHiddenBooking(null);
        setFormData({
          name: "",
          email: "",
          phone: "",
          address: "",
          service: "",
          date: "",
          time: "",
          hasPets: false,
          notes: ""
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const selectedServiceData = SERVICES_LIST.find(s => s.id === formData.service);
  const filteredRooms = ROOM_TYPES.filter(r => r.category.includes(formData.service));
  const subtotal = filteredRooms.reduce((acc, r) => acc + (counts[r.id] || 0) * r.price, 0) + (selectedServiceData?.basePrice || 0);
  const vatAmount = subtotal * 0.2;
  const total = subtotal + vatAmount;

  const isRescheduleLocked = () => {
    if (!formData.date) return false;
    const diff = (new Date(formData.date).getTime() - new Date().getTime()) / (1000 * 60 * 60);
    return diff < 48;
  };

  const checkAvailability = async (date: string, time: string) => {
    const q = query(collection(db, "bookings"), where("bookingDate", "==", date), where("bookingTime", "==", time));
    const snapshot = await getDocs(q);
    return snapshot.empty;
  };

  const handleNextStep = async () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.service || !formData.phone || !formData.address) return toast.error("Fill all fields");
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleFinalBooking = async () => {
    if (!formData.date) return toast.error("Please select a date");
    if (!formData.time) return toast.error("Please select a time slot");
    if (step === 5 && isRescheduleLocked()) return toast.error("Notice too short (48h required)");
    
    setLoading(true);
    const isAvailable = await checkAvailability(formData.date, formData.time);
    if (!isAvailable) {
      setLoading(false);
      return toast.error("Slot taken. Pick another.");
    }

    try {
      if (existingBooking && step === 5) {
        await updateDoc(doc(db, "bookings", existingBooking.id), { 
            bookingDate: formData.date,
            bookingTime: formData.time 
        });
        toast.success("Rescheduled Successfully");
        router.push(`/receipts/${existingBooking.id}`);
      } else {
        const quickBookingData = {
          fullName: formData.name,
          userEmail: formData.email,
          phoneNumber: formData.phone,
          address: formData.address,
          serviceCategory: formData.service,
          bookingDate: formData.date,
          bookingTime: formData.time,
          hasPets: formData.hasPets,
          jobNotes: formData.notes,
          roomCounts: counts,
        };
        localStorage.setItem('quickBookingData', JSON.stringify(quickBookingData));
        toast.success("Details saved! Finalize your payment.");
        router.push('/services'); 
      }
    } catch (e) {
      toast.error("Error processing booking");
    }
    setLoading(false);
  };

  return (
    <div className="-mt-2 md:-mt-10 bg-black/20 backdrop-blur-lg rounded-2xl p-4 md:p-6 border border-white/20 w-full min-h-[400px] flex flex-col justify-between overflow-hidden">
      <AnimatePresence mode="wait">

        {/* STEP 1: Booking Details */}
        {step === 1 && !existingBooking && (
          <motion.div key="step1" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-white uppercase italic">Quick Booking</h3>
                {tempHiddenBooking && (
                    <button onClick={() => { setExistingBooking(tempHiddenBooking); setTempHiddenBooking(null); }} className="text-[9px] font-black text-orange-500 uppercase flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md hover:bg-white/10"><FaUndo /> Cancel</button>
                )}
            </div>
            <input required type="text" placeholder="Full Name" className="booking-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <input required type="email" placeholder="Email" className="booking-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} readOnly={!!auth.currentUser} />
            <input required type="tel" placeholder="Phone (+44)" className="booking-input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            <input required type="text" placeholder="Address" className="booking-input" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            <select required className="booking-input bg-slate-900" value={formData.service} onChange={e => setFormData({...formData, service: e.target.value})}>
              <option value="" className="bg-gray-500 text-gray-100 font-semibold">Select Service</option>
              {SERVICES_LIST.map(s => <option key={s.id} value={s.id} className="bg-gray-900 text-gray-300">{s.name}</option>)}
            </select>
            <button onClick={handleNextStep} className="w-full bg-orange-500 py-4 rounded-xl font-black text-white uppercase tracking-widest text-xs hover:bg-orange-600 transition-all">Select Areas</button>
          </motion.div>
        )}

        {/* SPECIFY AREAS PART */}
        {step === 2 && (
          <motion.div key="step2" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setStep(1)} className="text-white"><FaArrowLeft /></button>
              <h3 className="text-lg font-black text-white uppercase italic">Specify Areas</h3>
            </div>
            <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
              {filteredRooms.map(room => (
                <div key={room.id} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="text-white text-[10px] font-bold uppercase">{room.label}</span>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setCounts({...counts, [room.id]: Math.max(0, (counts[room.id] || 0) - 1)})} className="text-orange-500"><FaMinusCircle size={20}/></button>
                    <span className="text-white font-bold">{counts[room.id] || 0}</span>
                    <button onClick={() => setCounts({...counts, [room.id]: (counts[room.id] || 0) + 1})} className="text-orange-500"><FaPlusCircle size={20}/></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-white/10">
              <div className="flex flex-row justify-between mb-1 opacity-70">
                <span className="text-white text-[10px] font-bold uppercase">Fee: £{selectedServiceData?.basePrice || 0}</span>
                <span className="text-white text-[10px] font-bold uppercase">VAT: £{vatAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white text-xs font-bold uppercase"><span>Total:</span><span className="text-white font-black">£{total.toFixed(2)}</span></div>
            </div>
            <button onClick={handleNextStep} className="w-full bg-orange-500 py-4 rounded-xl font-black text-white uppercase tracking-widest text-xs">Review Booking</button>
          </motion.div>
        )}


        {/* FINALIZE PART */}
        {step === 3 && (
          <motion.div key="step3" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => setStep(2)} className="text-white hover:text-orange-500 transition-colors"><FaArrowLeft /></button>
              <h3 className="text-lg font-black text-white uppercase italic">Finalize</h3>
            </div>
            <div className="grid grid-cols-4 gap-2">
                <button onClick={() => setFormData({...formData, hasPets: !formData.hasPets})} className={`col-span-1 rounded-xl flex flex-col items-center justify-center border transition-all ${formData.hasPets ? 'bg-orange-500 border-orange-500 text-white' : 'bg-black/50 border-white/10 text-zinc-400'}`}>
                  <FaPaw size={14} /><span className="text-[10px] font-black uppercase mt-1">I have Pets</span>
                </button>
                <textarea placeholder="Note (e.g., Key safe code)..." className="col-span-3 bg-black/50 border border-black/10 rounded-xl p-2 text-white text-xs outline-none h-[45px] resize-none" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
            </div>
            <div className="bg-black p-4 rounded-xl border border-white/10 text-white space-y-3 font-bold">
              <div className="flex justify-between text-[10px] uppercase"><span className="text-slate-300">Service:</span><span className="text-green-300">{selectedServiceData?.name}</span></div>
              <div className="flex flex-row flex-wrap gap-2 py-2 border-y border-white/5">
                {filteredRooms.filter(room => (counts[room.id] || 0) > 0).map(room => (
                  <div key={room.id} className="bg-white/10 px-2 py-1 rounded-md border border-white/10 flex items-center gap-2">
                    <span className="text-orange-400 text-[9px]">{counts[room.id]}x</span><span className="text-white text-[10px] uppercase">{room.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-1"><span className="text-[10px] uppercase text-slate-300">Total (Inc. VAT):</span><span className="text-xl font-black italic">£{total.toFixed(2)}</span></div>
            </div>
            <div className="space-y-2">
                <label className="text-white text-[10px] font-black uppercase">Live Availability</label>
                <input type="date" className="booking-input" min={new Date().toISOString().split("T")[0]} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value, time: ""})} required />
                {formData.date && <AvailabilityGrid selectedDate={formData.date} currentSlot={formData.time} onSelect={(s: any) => setFormData({...formData, time: s})} />}
            </div>
            <button onClick={handleFinalBooking} disabled={loading || !formData.time} className={`w-full py-4 rounded-xl font-black text-white uppercase tracking-widest text-xs flex justify-center items-center gap-2 transition-all ${!formData.time ? 'bg-gray-700 opacity-50 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}>
              {loading ? <FaSpinner className="animate-spin" /> : "Proceed to Payment"}
            </button>
          </motion.div>
        )}

        {/* EXISTING BOOKING PART */}
        {existingBooking && step === 1 && (
          <motion.div key="existing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center space-y-6">
            <div className="text-center relative">
              <FaCheckCircle className="text-orange-500 text-5xl mx-auto mb-4" />
              {otherBookingsCount > 0 && (
                <div className="absolute -top-2 -right-12 bg-orange-600 text-white text-[8px] font-black px-2 py-1 rounded-full border-2 border-slate-900 animate-bounce">
                  + {otherBookingsCount} OTHER SCHEDULES
                </div>
              )}
              <h3 className="text-white font-black uppercase italic text-xl leading-tight">Next Service: <br/><span className="text-orange-400">{existingBooking.service}</span></h3>
              <p className="text-slate-200 text-[10px] mt-2 font-bold uppercase tracking-widest">{existingBooking.bookingDate} ({existingBooking.bookingTime})</p>
            </div>
            <div className="flex flex-col w-full gap-3">
              <button onClick={() => router.push(`/receipts/${existingBooking.id}`)} className="flex items-center justify-center gap-2 w-full bg-white text-slate-900 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"><FaReceipt /> View Current Receipt</button>
              <button onClick={() => { setStep(5); setFormData({...formData, service: existingBooking.serviceCategory}) }} className="flex items-center justify-center gap-2 w-full bg-black text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-900 transition-all"><FaCalendarAlt /> Reschedule Appointment</button>
              <button onClick={() => { setTempHiddenBooking(existingBooking); setExistingBooking(null); setStep(1); }} className="inline rounded-xl p-4 bg-gray-900 text-zinc-200 text-[10px] font-black uppercase underline decoration-orange-500 underline-offset-4 hover:text-white transition-colors">Book Another Service</button>
            </div>
          </motion.div>
        )}

        {/* RESCHEDULE DATE PART */}
        {step === 5 && (
            <motion.div key="reschedule" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-6">
               <div className="flex items-center gap-3">
                 <button onClick={() => setStep(1)} className="text-white"><FaArrowLeft /></button>
                 <h3 className="text-lg font-black text-white uppercase italic">Reschedule</h3>
               </div>
               <div className="space-y-4 bg-black/50 p-4 rounded-xl border border-white/10">
                 <label className="text-white text-[10px] font-black uppercase tracking-widest">New Date & Time</label>
                 <input type="date" className="booking-input" min={new Date().toISOString().split("T")[0]} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value, time: ""})} required />
                 {isRescheduleLocked() ? (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                        <FaExclamationTriangle className="text-red-500 shrink-0" />
                        <p className="text-[10px] text-red-200 font-bold uppercase leading-tight">Notice too short. 48 hours required to reschedule.</p>
                    </div>
                 ) : (
                    // LOGIC: Show availability grid only if selected date is valid and not locked for rescheduling
                    formData.date && <div>
                      <small className="text-orange-400 text-xs font-bold">Available dates</small>
                      <AvailabilityGrid selectedDate={formData.date} currentSlot={formData.time} onSelect={(s: any) => setFormData({...formData, time: s})} />
                    </div>
                 )}
               </div>
               <button onClick={handleFinalBooking} disabled={loading || !formData.time || isRescheduleLocked()} className={`w-full py-4 rounded-xl font-black text-white uppercase tracking-widest text-xs flex justify-center items-center ${(!formData.time || isRescheduleLocked()) ? 'bg-gray-700 opacity-50 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}>
                  {loading ? <FaSpinner className="animate-spin" /> : "Confirm New Schedule"}
               </button>
            </motion.div>
        )}
      </AnimatePresence>
      <style jsx>{`.booking-input { width: 100%; padding: 0.8rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 0.75rem; color: white; font-weight: 700; font-size: 12px; outline: none; }.booking-input:focus { border-color: #f97316; }`}</style>
    </div>
  );
};

export default QuickBooking;