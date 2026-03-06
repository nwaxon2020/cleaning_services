"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHome, FaBuilding, FaCouch, FaWindowMaximize, FaWrench, 
  FaTree, FaCheckCircle, FaPlusCircle, FaMinusCircle, FaTimes, 
  FaCalendarAlt, FaSoap, FaTrashRestore, FaChevronLeft, FaChevronRight,
  FaPaw, FaDoorOpen, FaLock, FaShieldAlt, FaParking, FaArrowLeft,
  FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCreditCard, FaSearch,
  FaChevronUp, FaChevronDown, FaSpinner
} from 'react-icons/fa';
import { useRouter, useSearchParams } from 'next/navigation'; // Added useSearchParams
import { auth } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { CheckBookingModal } from '@/components/booking/CheckBookingModal';

// --- DATA ---
const ROOM_TYPES = [
  { id: 'bedroom', label: 'Bedrooms', price: 35, category: ['home', 'deep', 'end-of-tenancy', 'office'] },
  { id: 'bathroom', label: 'Bathroom or Toilet', price: 25, category: ['home', 'deep', 'end-of-tenancy'] },
  { id: 'kitchen', label: 'Kitchen', price: 45, category: ['home', 'deep', 'end-of-tenancy', 'office'] },
  { id: 'living', label: 'Living / Reception Room', price: 30, category: ['home', 'deep', 'end-of-tenancy', 'office'] },
  { id: 'dining', label: 'Dining Room', price: 20, category: ['home', 'deep', 'end-of-tenancy'] },
  { id: 'office', label: 'Office Room', price: 25, category: ['office', 'deep', 'end-of-tenancy'] },
  { id: 'garage', label: 'Garage', price: 50, category: ['home', 'deep', 'compound'] },
  { id: 'cabinets', label: 'Inside Cabinets (per wall)', price: 15, category: ['deep', 'end-of-tenancy', 'home'] },
  { id: 'window_int', label: 'Interior Windows', price: 12, category: ['windows', 'home', 'office', 'deep', 'end-of-tenancy'] },
  { id: 'window_ext', label: 'Exterior Windows', price: 40, category: ['windows', 'home', 'office', 'deep', 'end-of-tenancy', 'compound'] },
  { id: 'doors_int', label: 'Interior Doors (Wipe)', price: 10, category: ['home', 'deep', 'office', 'end-of-tenancy'] },
  { id: 'doors_ext', label: 'Exterior Doors (Polish)', price: 20, category: ['home', 'deep', 'compound'] },
  { id: 'driveway', label: 'Driveway / Parking Area', price: 60, category: ['compound'] },
  { id: 'perimeter', label: 'Perimeter Walls / Fencing', price: 45, category: ['compound'] },
  { id: 'oven', label: 'Oven / Hob', price: 35, category: ['oven', 'deep', 'end-of-tenancy'] },
  { id: 'extractor', label: 'Extractor Fan', price: 20, category: ['oven', 'deep', 'end-of-tenancy'] },
  { id: 'carpet', label: 'Carpet Areas (per room)', price: 30, category: ['deep', 'end-of-tenancy'] },
  { id: 'rubbish', label: 'Rubbish Removal', price: 25, category: ['after-builders', 'end-of-tenancy'] },
];

const UK_REQUIREMENTS = [
  { id: 'pets', label: 'Do you have pets?', icon: <FaPaw /> },
  { id: 'gate', label: 'Electronic Gate Access?', icon: <FaDoorOpen /> },
  { id: 'security', label: 'Alarm / Security System?', icon: <FaShieldAlt /> },
  { id: 'parking', label: 'On-site Parking?', icon: <FaParking /> },
  { id: 'keys', label: 'Key Safe Access?', icon: <FaLock /> },
];

const getDefaultRoomForCategory = (category: string) => {
  switch(category) {
    case 'home': return 'living';
    case 'office': return 'office';
    case 'deep': return 'living';
    case 'after-builders': return 'rubbish';
    case 'windows': return 'window_int';
    case 'compound': return 'driveway';
    case 'oven': return 'oven';
    case 'end-of-tenancy': return 'living';
    default: return null;
  }
};

const services = [
  { id: 1, name: 'Home Cleaning', icon: FaHome, basePrice: 40, description: 'Regular home cleaning tailored to your schedule', features: ['Living areas', 'Kitchens', 'Bathrooms'], color: 'bg-blue-50/80', hoverColor: 'hover:bg-blue-100', accent: 'text-blue-600', iconBg: 'bg-blue-100/50', border: 'border-blue-100', category: 'home', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800' },
  { id: 2, name: 'Office Cleaning', icon: FaBuilding, basePrice: 35, description: 'Professional cleaning for your workspace', features: ['Workstations', 'Meeting rooms', 'Kitchens'], color: 'bg-purple-50/80', hoverColor: 'hover:bg-purple-100', accent: 'text-purple-600', iconBg: 'bg-purple-100/50', border: 'border-purple-100', category: 'office', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800' },
  { id: 3, name: 'Deep Cleaning', icon: FaCouch, basePrice: 60, description: 'Thorough deep cleaning of your entire space', features: ['Baseboards', 'Inside cabinets', 'Appliances'], color: 'bg-orange-50/80', hoverColor: 'hover:bg-orange-100', accent: 'text-orange-600', iconBg: 'bg-orange-100/50', border: 'border-orange-100', category: 'deep', image: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&q=80&w=800' },
  { id: 4, name: 'After Builders', icon: FaWrench, basePrice: 80, description: 'Post-construction dust and debris removal', features: ['Debris removal', 'Window tracks', 'Full dust'], color: 'bg-red-50/80', hoverColor: 'hover:bg-red-100', accent: 'text-red-600', iconBg: 'bg-red-100/50', border: 'border-red-100', category: 'after-builders', image: 'https://s1.kaercher-media.com/media/image/selection/127074/m2/bauendreinigung-header.webp' },
  { id: 5, name: 'Only Windows', icon: FaWindowMaximize, basePrice: 30, description: 'Professional streak-free window solutions', features: ['Interior/Exterior', 'Sills & Frames', 'Screen Wash'], color: 'bg-cyan-50/80', hoverColor: 'hover:bg-cyan-100', accent: 'text-cyan-600', iconBg: 'bg-cyan-100/50', border: 'border-cyan-100', category: 'windows', image: 'https://t3.ftcdn.net/jpg/02/68/64/24/360_F_268642423_vXTKYzeYXFqkb5L9BMwnoLsczh6imvKY.jpg' },
  { id: 6, name: 'Compound Cleaning', icon: FaTree, basePrice: 50, description: 'Expert exterior and perimeter maintenance', features: ['Driveways', 'Perimeter walls', 'Entrance areas'], color: 'bg-emerald-50/80', hoverColor: 'hover:bg-emerald-100', accent: 'text-emerald-600', iconBg: 'bg-emerald-100/50', border: 'border-emerald-100', category: 'compound', image: 'https://ambitiouscleaning.org/wp-content/uploads/2020/12/landscaping-1024x431.jpg' },
  { id: 7, name: 'Oven Scrub', icon: FaSoap, basePrice: 55, description: 'Specialized degreasing for heavy-use areas', features: ['Deep oven scrub', 'Extractor fans', 'Splashbacks'], color: 'bg-yellow-50/80', hoverColor: 'hover:bg-yellow-100', accent: 'text-yellow-600', iconBg: 'bg-yellow-100/50', border: 'border-yellow-100', category: 'oven', image: 'https://lh7-us.googleusercontent.com/dqwRhvlIh10eg7_4BCFmzOxROj17IvIPM8MqHPZhwVjumvPr03_VtJCf02TPdSDPEXH3whNESLeRWTploP30vifafu2IKt6QJEOpAoXzj-NlGM0XhEp84riXoMw-YRXYnWU1nVvTmT-zv50ZbI78pPg' },
  { id: 8, name: 'End of Tenancy', icon: FaTrashRestore, basePrice: 95, description: 'Guaranteed deposit-back standards', features: ['Inventory ready', 'Full sanitization', 'Certificate'], color: 'bg-slate-50/80', hoverColor: 'hover:bg-slate-100', accent: 'text-slate-600', iconBg: 'bg-slate-100/50', border: 'border-slate-100', category: 'end-of-tenancy', image: 'https://high-classcleaning.co.uk/wp-content/uploads/2021/01/End-ot-tenancy-clean-main-pic-1.jpg' },
];

const formatUKPhoneNumber = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('44')) return `+${cleaned}`;
  else if (cleaned.startsWith('0')) return `+44${cleaned.substring(1)}`;
  else if (cleaned.length === 10) return `+44${cleaned}`;
  return phone;
};

const Counter = ({ label, count, onChange, price }: any) => (
  <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
    <div className="flex flex-col">
      <span className="text-[11px] font-black uppercase tracking-tight text-slate-700">{label}</span>
      <span className="text-[8px] font-bold text-slate-400">£{price} each</span>
    </div>
    <div className="flex items-center gap-4">
      <button onClick={() => onChange(Math.max(0, count - 1))} className="text-slate-300 hover:text-orange-500 transition-colors">
        <FaMinusCircle size={22} />
      </button>
      <span className="w-6 text-center font-black text-slate-900 text-sm">{count}</span>
      <button onClick={() => onChange(count + 1)} className="text-slate-300 hover:text-orange-500 transition-colors">
        <FaPlusCircle size={22} />
      </button>
    </div>
  </div>
);

export default function ServicesUi() {
  const searchParams = useSearchParams(); // Added
  const selectedType = searchParams.get('type'); // Added
  const [activeOverlay, setActiveOverlay] = useState<any>(null);
  const [highlightedId, setHighlightedId] = useState<number | null>(null); // Added
  const [step, setStep] = useState(1);
  const [counts, setCounts] = useState<any>({});
  const [checkedRequirements, setCheckedRequirements] = useState<any>({});
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [jobNotes, setJobNotes] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [fullName, setFullName] = useState('');
  const [showCheckBooking, setShowCheckBooking] = useState(false);
  const [isOrderExpanded, setIsOrderExpanded] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // LOGIC: Handle selection from Home Page
  useEffect(() => {
    if (selectedType) {
      const service = services.find(s => s.category === selectedType);
      if (service) {
        // Scroll to card
        const element = document.getElementById(`service-${service.id}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Pulse Effect
        setHighlightedId(service.id);
        
        // Auto Open
        const timer = setTimeout(() => {
          setActiveOverlay(service);
          setStep(1);
          setHighlightedId(null);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedType]);

  useEffect(() => {
    const savedData = localStorage.getItem('bookingDraft');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setCounts(parsed.counts || {});
        setCheckedRequirements(parsed.checkedRequirements || {});
        setBookingDate(parsed.bookingDate || '');
        setBookingTime(parsed.bookingTime || '');
        setJobNotes(parsed.jobNotes || '');
        setPhoneNumber(parsed.phoneNumber || '');
        setEmail(parsed.email || '');
        setAddress(parsed.address || '');
        setFullName(parsed.fullName || '');
      } catch (e) { console.error('Error loading saved data:', e); }
    }
  }, []);

  useEffect(() => {
    if (activeOverlay) {
      const bookingDraft = { counts, checkedRequirements, bookingDate, bookingTime, jobNotes, phoneNumber, email, address, fullName, service: activeOverlay?.name, timestamp: new Date().toISOString() };
      localStorage.setItem('bookingDraft', JSON.stringify(bookingDraft));
    }
  }, [counts, checkedRequirements, bookingDate, bookingTime, jobNotes, phoneNumber, email, address, fullName, activeOverlay]);

  useEffect(() => { if (auth.currentUser?.email) setEmail(auth.currentUser.email); }, []);

  const getFilteredRoomTypes = () => activeOverlay ? ROOM_TYPES.filter(room => room.category.includes(activeOverlay.category)) : [];
  const filteredRoomTypes = getFilteredRoomTypes();
  const hasSelectedRooms = filteredRoomTypes.some(room => (counts[room.id] || 0) > 0);
  const subtotal = filteredRoomTypes.reduce((acc, room) => acc + (counts[room.id] || 0) * room.price, 0) + (activeOverlay?.basePrice || 0);
  const vat = subtotal * 0.20;
  const total = subtotal + vat;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft } = scrollRef.current;
      scrollRef.current.scrollTo({ left: direction === 'left' ? scrollLeft - 220 : scrollLeft + 220, behavior: 'smooth' });
    }
  };

  const validateBookingDetails = () => {
    if (!fullName.trim()) { toast.error('Please enter your full name'); return false; }
    if (!email.trim() || !email.includes('@')) { toast.error('Please enter a valid email address'); return false; }
    if (!phoneNumber.trim()) { toast.error('Please enter your phone number'); return false; }
    if (!address.trim()) { toast.error('Please enter your address'); return false; }
    if (!bookingDate) { toast.error('Please select a booking date'); return false; }
    if (!bookingTime) { toast.error('Please select a booking time'); return false; }
    return true;
  };

  const handleConfirmBooking = async () => {
    try {
      const formattedPhone = formatUKPhoneNumber(phoneNumber);
      const bookingData = {
        userId: auth.currentUser?.uid || 'guest',
        userEmail: email,
        fullName,
        phoneNumber: formattedPhone,
        contact: email || formattedPhone, 
        address,
        service: activeOverlay.name,
        serviceId: activeOverlay.id,
        serviceCategory: activeOverlay.category,
        basePrice: activeOverlay.basePrice,
        roomCounts: counts,
        roomDetails: filteredRoomTypes.filter(r => counts[r.id] > 0).map(r => ({ roomId: r.id, label: r.label, count: counts[r.id], price: r.price, subtotal: counts[r.id] * r.price })),
        requirements: Object.entries(checkedRequirements).filter(([_, value]) => value).map(([key]) => key),
        jobNotes,
        bookingDate,
        bookingTime,
        subtotal,
        vat,
        total,
        status: 'confirmed',
        paymentStatus: 'paid',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'bookings'), bookingData);
      localStorage.removeItem('bookingDraft');
      setShowPayment(false);
      setActiveOverlay(null);
      router.push(`/receipts/${docRef.id}`);
    } catch (error) { toast.error('Failed to save booking details.'); }
  };

  const handleFakePayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      toast.success('Payment Successful!');
      handleConfirmBooking();
    }, 2000);
  };

  useEffect(() => {
    if (activeOverlay) {
      const defaultRoomId = getDefaultRoomForCategory(activeOverlay.category);
      setCounts(defaultRoomId ? { [defaultRoomId]: 1 } : {});
    }
  }, [activeOverlay]);

  return (
    <div className="min-h-screen bg-white pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex justify-end mb-8">
          <button onClick={() => setShowCheckBooking(true)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white hover:bg-orange-600 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all shadow-xl active:scale-95">
            <FaSearch size={10} /> Check My Booking
          </button>
        </div>

        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 uppercase italic mb-4">
            OUR <span className="text-orange-600">SERVICES</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] max-w-xl mx-auto">
            Select a specialized service to customize your property details
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-6 mb-20">
          {services.map((service, index) => (
            <motion.div 
              key={service.id} 
              id={`service-${service.id}`} // Added for scrolling
              initial={{ opacity: 0, y: 20 }} 
              animate={{ 
                opacity: 1, 
                y: 0,
                // Blinking Hover Logic
                boxShadow: highlightedId === service.id 
                  ? ["0px 0px 0px #f97316", "0px 0px 40px #f97316", "0px 0px 0px #f97316"] 
                  : "0px 0px 0px rgba(0,0,0,0)"
              }} 
              transition={{ 
                delay: index * 0.05,
                boxShadow: highlightedId === service.id ? { repeat: Infinity, duration: 0.7 } : {}
              }}
              onClick={() => { setActiveOverlay(service); setStep(1); }}
              className={`cursor-pointer group relative overflow-hidden md:rounded-2xl border-2 transition-all duration-500 ${highlightedId === service.id ? 'border-orange-500 scale-105 z-10' : 'border-transparent'} ${service.color} ${service.hoverColor} ${service.border} shadow-sm hover:shadow-xl hover:scale-[1.02]`}
            >
              <div className="h-32 w-full relative">
                 <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                 <div className={`absolute -bottom-6 left-6 p-3 rounded-xl ${service.iconBg} shadow-xl border-2 border-white transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1`}>
                    <service.icon className={`text-2xl ${service.accent}`} />
                 </div>
              </div>

              <div className="py-8 px-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">{service.name}</h3>
                  <div className="text-right">
                      <span className={`text-lg font-black ${service.accent} block leading-none`}>£{service.basePrice}</span>
                      <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Starting at</span>
                  </div>
                </div>
                <p className="text-slate-600 text-[10px] leading-relaxed mb-6 font-medium opacity-80">{service.description}</p>
                <div className="space-y-2">
                  {service.features.map((feature, i) => (
                    <div key={i} className="text-[9px] font-black uppercase tracking-tight text-slate-700 flex items-center gap-2"><div className={`w-1 h-1 rounded-full ${service.accent.replace('text', 'bg')}`} />{feature}</div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {activeOverlay && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-2 md:p-6">
              <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 50 }} className="bg-white w-full max-w-6xl h-[98vh] md:h-[95vh] rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
                <div className="flex-1 overflow-y-auto p-6 md:p-10 border-r border-slate-100 custom-scrollbar">
                  <div className="flex items-center justify-between mb-5 sticky top-0 bg-white pb-2 z-20">
                    <button onClick={() => setActiveOverlay(null)} className="p-2.5 bg-slate-100 rounded-full hover:bg-orange-500 hover:text-white transition-all"><FaTimes /></button>
                    <div className="flex gap-2">
                       <div className={`h-1 w-10 md:w-16 rounded-full ${step >= 1 ? 'bg-orange-500' : 'bg-slate-100'}`} />
                       <div className={`h-1 w-10 md:w-16 rounded-full ${step >= 2 ? 'bg-orange-500' : 'bg-slate-100'}`} />
                    </div>
                  </div>

                  {step === 1 ? (
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                      <h2 className="text-xl font-black uppercase italic tracking-tighter mb-2">Manage {activeOverlay.name}</h2>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-8">Select relevant areas for this service</p>
                      <div className="grid gap-0.5 mb-6">
                        {filteredRoomTypes.length > 0 ? (
                          filteredRoomTypes.map(room => (
                            <Counter key={room.id} label={room.label} count={counts[room.id] || 0} price={room.price} onChange={(val: number) => setCounts({...counts, [room.id]: val})} />
                          ))
                        ) : (<div className="text-center py-8 text-slate-400 text-[10px] font-bold uppercase">No additional items needed for this service</div>)}
                      </div>
                      <div className="mb-10 relative">
                        <div className="flex items-center justify-between mb-4">
                           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Essential Site Checklist</h3>
                           <div className="flex gap-2">
                             <button onClick={() => scroll('left')} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><FaChevronLeft size={10} /></button>
                             <button onClick={() => scroll('right')} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><FaChevronRight size={10} /></button>
                           </div>
                        </div>
                        <div ref={scrollRef} className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x">
                           {UK_REQUIREMENTS.map((req) => (
                             <div key={req.id} onClick={() => setCheckedRequirements({...checkedRequirements, [req.id]: !checkedRequirements[req.id]})} className={`flex-shrink-0 w-40 p-5 rounded-2xl border-2 transition-all cursor-pointer snap-start ${checkedRequirements[req.id] ? 'border-orange-500 bg-orange-50' : 'border-slate-100 bg-slate-50'}`}>
                               <div className={`mb-3 text-lg ${checkedRequirements[req.id] ? 'text-orange-600' : 'text-slate-300'}`}>{req.icon}</div>
                               <p className="text-[9px] font-black uppercase tracking-tight leading-tight">{req.label}</p>
                             </div>
                           ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Important Access Notes</label>
                        <textarea value={jobNotes} onChange={(e) => setJobNotes(e.target.value)} placeholder="Provide details about parking, key safe, or pets..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:outline-none focus:border-orange-500 min-h-[90px]" />
                      </div>
                    </motion.div>
                  ) : step === 2 ? (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                      <h2 className="text-xl font-black uppercase italic tracking-tighter mb-6">Schedule & Details</h2>
                      <div className="grid md:grid-cols-2 gap-4 mb-8">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400">Preferred Date *</label>
                          <input type="date" value={bookingDate} onChange={(e)=>setBookingDate(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:border-orange-500 outline-none" required />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400">Preferred Time *</label>
                          <input type="time" value={bookingTime} onChange={(e)=>setBookingTime(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:border-orange-500 outline-none" required />
                        </div>
                      </div>
                      <div className="space-y-4 mb-8">
                        <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-400 mb-4">Your Information</h3>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"><FaUser className="text-orange-500" /> Full Name *</label>
                          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:border-orange-500 outline-none" required />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"><FaEnvelope className="text-orange-500" /> Email Address *</label>
                          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:border-orange-500 outline-none" required readOnly={!!auth.currentUser?.email} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"><FaPhone className="text-orange-500" /> Phone Number (Boston, UK) *</label>
                          <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="01205 123456" className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:border-orange-500 outline-none" required />
                          <p className="text-[8px] text-slate-400 mt-1">Will be formatted to +44 for Boston area</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"><FaMapMarkerAlt className="text-orange-500" /> Full Address *</label>
                          <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter your full street address, city, postcode" className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:border-orange-500 outline-none min-h-[80px]" required />
                        </div>
                      </div>
                      <div className="p-6 bg-slate-900 rounded-2xl text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/20 blur-3xl" />
                        <div className="flex items-center gap-3 mb-2"><FaCalendarAlt className="text-orange-500" /><span className="text-[10px] font-black uppercase tracking-widest">Availability Policy</span></div>
                        <p className="text-[10px] text-slate-400 uppercase leading-relaxed font-bold">Standard bookings require 24h notice. Emergency service in PE21 may incur extra charges.</p>
                      </div>
                    </motion.div>
                  ) : null}
                </div>

                <div className={`w-full md:w-[380px] bg-slate-50 p-6 md:p-10 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-200 transition-all duration-300 ${isOrderExpanded ? 'h-[80vh] md:h-full' : 'h-auto md:h-full'}`}>
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-2"><FaCheckCircle className="text-orange-500" /> Your Order</h3>
                      <button onClick={() => setIsOrderExpanded(!isOrderExpanded)} className="md:hidden p-2 bg-white rounded-full shadow-sm border border-slate-100 text-slate-900">
                        {isOrderExpanded ? <FaChevronDown size={14} /> : <FaChevronUp size={14} />}
                      </button>
                    </div>

                    <div className={`${isOrderExpanded ? 'block' : 'hidden md:block'} space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar text-[10px]`}>
                      <div className="flex justify-between font-black uppercase text-slate-400"><span>Mobilization Fee ({activeOverlay.name})</span><span className="text-slate-900 font-bold italic">£{activeOverlay.basePrice.toFixed(2)}</span></div>
                      <AnimatePresence>
                        {filteredRoomTypes.filter(r => counts[r.id] > 0).map(room => (
                            <motion.div key={room.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex justify-between font-black uppercase text-slate-800"><span>{counts[room.id]}x {room.label}</span><span>£{(counts[room.id] * room.price).toFixed(2)}</span></motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-200 mt-6 space-y-2 pt-4">
                    <div className={`${isOrderExpanded ? 'block' : 'hidden md:block'} space-y-2`}>
                      <div className="flex justify-between text-[10px] font-black uppercase text-slate-400"><span>Subtotal</span><span>£{subtotal.toFixed(2)}</span></div>
                      <div className="flex justify-between text-[10px] font-black uppercase text-slate-400"><span>VAT (20%)</span><span>£{vat.toFixed(2)}</span></div>
                    </div>
                    <div className="flex justify-between items-center py-4"><span className="text-xs font-black uppercase tracking-tighter">Total Price</span><span className="text-3xl font-black text-orange-600 italic tracking-tighter leading-none">£{total.toFixed(2)}</span></div>
                    <div className="flex gap-2">
                        {step > 1 && (<button onClick={() => setStep(step - 1)} className="p-4 bg-white border border-slate-200 rounded-xl text-slate-900 hover:bg-slate-100 transition-colors"><FaArrowLeft /></button>)}
                        <button 
                          onClick={step === 1 ? () => setStep(2) : () => validateBookingDetails() && setShowPayment(true)} 
                          disabled={(step === 1 && !hasSelectedRooms)} 
                          className={`flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all shadow-xl active:scale-95 ${(step === 1 && !hasSelectedRooms) ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-orange-600'}`}
                        >
                          {step === 1 ? 'Schedule & Details' : 'Confirm & Pay'}
                        </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- PAYMENT MODAL --- */}
        <AnimatePresence>
          {showPayment && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <button onClick={() => setShowPayment(false)} className="absolute top-6 right-6 text-slate-300 hover:text-orange-500"><FaTimes /></button>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 italic font-black text-2xl">£</div>
                  <h2 className="text-2xl font-black uppercase italic italic tracking-tighter">Secure Checkout</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Complete your payment for £{total.toFixed(2)}</p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400">Cardholder Name</label>
                    <input type="text" placeholder={fullName} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400">Card Number</label>
                    <div className="relative">
                      <FaCreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input type="text" placeholder="xxxx xxxx xxxx xxxx" className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">Expiry</label>
                      <input type="text" placeholder="MM/YY" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">CVC</label>
                      <input type="text" placeholder="***" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none" />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleFakePayment}
                  disabled={isProcessingPayment}
                  className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-orange-700 transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  {isProcessingPayment ? <FaSpinner className="animate-spin" /> : 'Pay & Confirm Booking'}
                </button>
                <p className="text-center text-[8px] font-bold text-slate-400 uppercase mt-6 flex items-center justify-center gap-2"><FaLock /> Encrypted & Secure SSL Checkout</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showCheckBooking && (<CheckBookingModal onClose={() => setShowCheckBooking(false)} />)}
        </AnimatePresence>
      </div>
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}