"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db, auth } from "@/lib/firebase"; 
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  ConfirmationResult,
  onAuthStateChanged
} from "firebase/auth";
import { 
  HiCalendar, 
  HiCheckCircle, 
  HiShieldCheck, 
  HiCreditCard, 
  HiMail, 
  HiChatAlt2,
  HiLocationMarker
} from "react-icons/hi";

// --- Fix for the window.recaptchaVerifier error ---
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

// --- Interfaces for Type Safety ---
interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  service: string;
}

interface Booking {
  id: string;
  date: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  service: string;
  status: string;
}

const QuickBooking = () => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({ name: "", email: "", phone: "", address: "", service: "" });
  const [verificationPath, setVerificationPath] = useState<"phone" | "email" | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpCode, setOtpCode] = useState<string>("");
  const [existingBooking, setExistingBooking] = useState<Booking | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success">("idle");

  const prices: Record<string, number> = { home: 40, office: 35, deep: 50 };

  // --- Initialize Recaptcha and Auth Listener ---
  useEffect(() => {
    if (typeof window !== "undefined" && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setFormData(prev => ({ ...prev, email: user.email!, name: user.displayName || "" }));
      }
    });

    return () => unsubscribe();
  }, []);

  // --- Handle Email Magic Link ---
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Please provide your email for confirmation');
      }
      if (email) {
        setLoading(true);
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            window.localStorage.removeItem('emailForSignIn');
            setStep(existingBooking ? 5 : 4);
          })
          .catch(() => alert("Verification link expired."))
          .finally(() => setLoading(false));
      }
    }
  }, [existingBooking]);

  const fetchAvailableDates = async () => {
    setLoading(true);
    const nextTwoWeeks = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i + 1);
      return d.toISOString().split("T")[0];
    });
    
    try {
      const q = collection(db, "bookings");
      const querySnapshot = await getDocs(q);
      const booked = querySnapshot.docs.map(doc => doc.data().date);
      setAvailableDates(nextTwoWeeks.filter(date => !booked.includes(date)));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleInitialCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const q = query(
        collection(db, "bookings"), 
        where("phone", "==", formData.phone), 
        where("email", "==", formData.email)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setExistingBooking({ id: snapshot.docs[0].id, ...data } as Booking);
      }
      setStep(2);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const sendVerification = async (path: "phone" | "email") => {
    setLoading(true);
    setVerificationPath(path);
    try {
      if (path === "phone") {
        const result = await signInWithPhoneNumber(auth, formData.phone, window.recaptchaVerifier);
        setConfirmationResult(result);
        setStep(3);
      } else {
        const actionCodeSettings = { url: window.location.origin, handleCodeInApp: true };
        await sendSignInLinkToEmail(auth, formData.email, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', formData.email);
        setStep(3);
      }
    } catch (err) {
      alert("Verification failed. Use international format (+44...)");
    }
    setLoading(false);
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      if (confirmationResult) {
        await confirmationResult.confirm(otpCode);
        existingBooking ? setStep(5) : setStep(4);
      }
    } catch {
      alert("Invalid Code");
    }
    setLoading(false);
  };

  const handleFinalAction = async (selectedDate: string) => {
    setLoading(true);
    try {
      if (existingBooking) {
        const bookingRef = doc(db, "bookings", existingBooking.id);
        await updateDoc(bookingRef, { date: selectedDate, updatedAt: serverTimestamp() });
        alert("Rescheduled Successfully!");
      } else {
        const bookingRef = doc(collection(db, "bookings"));
        await setDoc(bookingRef, { 
          ...formData, 
          date: selectedDate, 
          status: "paid", 
          createdAt: serverTimestamp() 
        });
        alert("Booking Successful!");
      }
      setStep(1);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="-mt-10 bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20">
      <div id="recaptcha-container"></div>
      
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h3 className="text-2xl font-bold text-white mb-6 tracking-tight">Quick Booking</h3>
            <form onSubmit={handleInitialCheck} className="space-y-4 text-left">
              <input required type="text" placeholder="Name" value={formData.name} className="booking-input" onChange={e => setFormData({...formData, name: e.target.value})} />
              <input required type="email" placeholder="Email" value={formData.email} className="booking-input" onChange={e => setFormData({...formData, email: e.target.value})} />
              <input required type="tel" placeholder="Phone (+44...)" className="booking-input" onChange={e => setFormData({...formData, phone: e.target.value})} />
              <input required type="text" placeholder="Full Address" className="booking-input" onChange={e => setFormData({...formData, address: e.target.value})} />
              <select required className="w-full p-[0.59rem] bg-[rgba(37, 6, 6, 0.05)] border-1 border-solid-[rgba(255,255,255,0.1)] rounded-lg text-white outline-none transition" onChange={e => setFormData({...formData, service: e.target.value})}>
                <option className="bg-black text-white" value="">Select Service</option>
                <option className="bg-black text-white" value="home">Home Cleaning</option>
                <option className="bg-black text-white" value="office">Office Cleaning</option>
                <option className="bg-black text-white" value="deep">Deep Cleaning</option>
              </select>
              <button disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95">
                {loading ? "Checking..." : "Continue"}
              </button>
            </form>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white text-center">
            <HiShieldCheck className="text-6xl mx-auto text-orange-500 mb-4" />
            <h3 className="text-xl font-bold">Verify Identity</h3>
            <p className="text-gray-400 text-sm mb-6">Choose how to receive your verification</p>
            <div className="grid gap-4">
              <button onClick={() => sendVerification("phone")} className="verify-path-btn">
                <HiChatAlt2 className="text-xl" /> SMS OTP
              </button>
              <button onClick={() => sendVerification("email")} className="verify-path-btn">
                <HiMail className="text-xl" /> Email Link
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white text-center">
            {verificationPath === "phone" ? (
              <>
                <p className="mb-4 text-gray-400">Enter code sent to {formData.phone}</p>
                <input type="text" maxLength={6} className="booking-input text-center text-2xl tracking-[0.5em]" onChange={e => setOtpCode(e.target.value)} />
                <button onClick={verifyOtp} className="w-full mt-6 bg-green-500 py-4 rounded-xl font-bold">Verify OTP</button>
              </>
            ) : (
              <div className="py-6">
                <HiMail className="text-6xl mx-auto text-orange-500 mb-4 animate-pulse" />
                <p className="text-gray-300">Magic link sent to <b>{formData.email}</b>. Click the link in your email to proceed.</p>
              </div>
            )}
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white">
            <h3 className="text-xl font-bold mb-6 text-center">Secure Payment</h3>
            <div className="bg-white/5 p-6 rounded-2xl mb-8 border border-white/10">
              <div className="flex justify-between mb-2"><span className="text-gray-400">Cleaning Type:</span><span className="capitalize font-bold">{formData.service}</span></div>
              <div className="flex justify-between text-3xl font-black mt-4 border-t border-white/10 pt-4"><span>Total:</span><span className="text-orange-500">£{prices[formData.service]}</span></div>
            </div>
            <button onClick={() => { fetchAvailableDates(); setStep(5); }} className="w-full bg-orange-500 py-4 rounded-2xl font-black shadow-xl hover:bg-orange-600 transition-all flex items-center justify-center gap-3">
              <HiCreditCard className="text-xl" /> 
              {paymentStatus === "processing" ? "Processing..." : "Pay Securely"}
            </button>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div key="s5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white">
             {existingBooking ? (
               <div className="text-center py-6">
                  <HiCheckCircle className="text-7xl text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold">Active Appointment</h3>
                  <div className="bg-orange-500/10 p-6 rounded-2xl my-6 border border-orange-500/20">
                    <p className="text-orange-500 text-3xl font-black tracking-tight">{existingBooking.date}</p>
                  </div>
                  <button onClick={() => { setExistingBooking(null); fetchAvailableDates(); }} className="text-sm text-gray-400 underline hover:text-white transition-colors">Reschedule This Cleaning</button>
               </div>
             ) : (
               <div className="space-y-4">
                <h3 className="font-bold text-center mb-6">Select Available Date</h3>
                <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {availableDates.map(date => (
                    <button key={date} onClick={() => handleFinalAction(date)} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-orange-500 transition-all font-bold text-sm">
                      {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </button>
                  ))}
                </div>
               </div>
             )}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .booking-input { width: 100%; padding: 0.5rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 0.5rem; color: white; outline: none; transition: border 0.3s; }
        .booking-input:focus { border-color: #f97316; }
        .verify-path-btn { width: 100%; padding: 1.25rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 0.75rem; font-weight: 600; color: white; transition: all 0.2s; }
        .verify-path-btn:hover { border-color: #f97316; background: rgba(255,255,255,0.1); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default QuickBooking;