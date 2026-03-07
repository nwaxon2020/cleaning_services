"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, where } from "firebase/firestore";
import { FaCalendarCheck, FaClock, FaExclamationCircle, FaLock } from "react-icons/fa";

interface AvailabilityProps {
  selectedDate: string;
  onSelect: (slot: string) => void;
  currentSelectedSlot?: string;
}

export const AvailabilityChecker = ({ selectedDate, onSelect, currentSelectedSlot }: AvailabilityProps) => {
  const [busySlots, setBusySlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTooLate, setIsTooLate] = useState(false);
  const TIME_SLOTS = ["6-8", "9-12", "1-4", "5-6", "7-9"];

  useEffect(() => {
    if (!selectedDate) return;

    const checkDeadline = () => {
      const now = new Date();
      const targetDate = new Date(selectedDate);
      const diffInHours = (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      // If the selected date is less than 48 hours from now
      setIsTooLate(diffInHours < 48);
    };

    const fetchAvailability = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "bookings"),
          where("bookingDate", "==", selectedDate)
        );
        const snap = await getDocs(q);
        // This is where we get the "Live" data from the backend
        const booked = snap.docs.map(doc => doc.data().bookingTime);
        setBusySlots(booked);
      } catch (e) {
        console.error("Availability error", e);
      } finally {
        setLoading(false);
      }
    };

    checkDeadline();
    fetchAvailability();
  }, [selectedDate]);

  // If user tries to reschedule within 48 hours
  if (isTooLate) {
    return (
      <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
        <FaExclamationCircle className="text-red-500 shrink-0" />
        <p className="text-[10px] text-red-200 font-bold uppercase tracking-tight">
          Rescheduling/Booking is locked for this date. (48h Notice Required)
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          <FaCalendarCheck className="text-orange-500" /> Live Availability
        </label>
        {busySlots.length === TIME_SLOTS.length && (
          <span className="text-red-500 text-[8px] font-black uppercase animate-pulse">Fully Booked</span>
        )}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {TIME_SLOTS.map((slot) => {
          const isBooked = busySlots.includes(slot);
          const isSelected = currentSelectedSlot === slot;
          
          return (
            <button
              key={slot}
              type="button"
              disabled={isBooked || loading}
              onClick={() => onSelect(slot)}
              className={`py-3 rounded-xl text-[10px] font-black transition-all border flex flex-col items-center justify-center gap-1 ${
                isBooked 
                  ? "bg-red-500/10 border-red-500/20 text-red-500/40 cursor-not-allowed" 
                  : isSelected
                  ? "bg-orange-500 border-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                  : "bg-white/5 border-white/10 text-white hover:border-orange-500"
              }`}
            >
              {isBooked ? <FaLock size={8} /> : <FaClock size={8} className={isSelected ? "text-white" : "text-orange-500"} />}
              {slot}
            </button>
          );
        })}
      </div>
      
      <p className="text-slate-400 text-[8px] font-bold uppercase italic">
        {loading ? "Syncing with server..." : `Select a slot for ${selectedDate}`}
      </p>
    </div>
  );
};