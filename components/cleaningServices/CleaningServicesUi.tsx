"use client";

import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { 
  FaTimes, FaPlus, FaMinus, FaDog, FaKey, FaLock,
  FaCalendarAlt, FaClock, FaArrowRight, FaGoogle, FaHistory, FaEnvelope, FaWhatsapp, FaPhone, FaTrash, FaCheckCircle, FaTimesCircle, FaEyeSlash, FaDollarSign, FaUserTimes,
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
//import Link from 'next/link';

// --- Interfaces ---
interface Service {
  id: string;
  name: string;
  description: string;
  tasks: Array<{ name: string; areaIds: string[] }>;
  image: string;
}

interface Area {
  id: string;
  label: string;
}

interface SelectedTask {
  name: string;
  areaIds: string[];
}

interface SelectedTaskAreas {
  [taskName: string]: {
    [areaId: string]: number; // Simple count per area
  };
}

interface FormData {
  fullName: string;
  phone: string;
  email: string;
  contactPreference: 'WhatsApp' | 'Phone Call' | 'Email';
  address: string;
  additionalNotes: string;
  pets: boolean;
  securityKeys: boolean;
  fence: boolean;
  date: string;
  timeSlot: string;
}

interface QuotationRequest {
  id?: string;
  serviceName: string;
  serviceId: string;
  tasks: SelectedTaskAreas;
  areas: Record<string, Record<string, number>>;
  areasList: Array<{
    areaName: string;
    quantity: number;
  }>;
  totalAreas: number;
  customerInfo: {
    fullName: string;
    phone: string;
    email: string;
    contactPreference: string;
    address: string;
    additionalNotes: string;
    pets: boolean;
    securityKeys: boolean;
    fence: boolean;
  };
  selectedDate: string;
  selectedTime: string;
  status: 'pending' | 'approved' | 'cancelled';
  createdAt: any;
  userId?: string;
  userEmail?: string;
  userName?: string;
  sentViaWhatsApp: boolean;
  cancelReason?: string;
  cancelledBy?: string;
  approvedTotal?: number;
  approvedPrices?: Record<string, number>;
}

const CARD_THEMES = [
  { border: 'hover:border-blue-500', bg: 'bg-blue-50', text: 'text-blue-600', btn: 'bg-blue-600', shadow: 'shadow-blue-200' },
  { border: 'hover:border-purple-500', bg: 'bg-purple-50', text: 'text-purple-600', btn: 'bg-purple-600', shadow: 'shadow-purple-200' },
  { border: 'hover:border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600', btn: 'bg-emerald-600', shadow: 'shadow-emerald-200' },
  { border: 'hover:border-orange-500', bg: 'bg-orange-50', text: 'text-orange-600', btn: 'bg-orange-600', shadow: 'shadow-orange-200' },
  { border: 'hover:border-rose-500', bg: 'bg-rose-50', text: 'text-rose-600', btn: 'bg-rose-600', shadow: 'shadow-rose-200' },
];

const timeSlots = ['6-8 AM', '9-11 AM', '12-2 PM', '3-5 PM', '6-8 PM'];

const contactPreferences = [
  { value: 'WhatsApp', label: 'WhatsApp', icon: FaWhatsapp, color: 'text-green-600' },
  { value: 'Phone Call', label: 'Phone Call', icon: FaPhone, color: 'text-blue-600' },
  { value: 'Email', label: 'Email', icon: FaEnvelope, color: 'text-purple-600' },
];

export default function CustomerServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [userQuotations, setUserQuotations] = useState<QuotationRequest[]>([]);
  const [pendingApprovedCount, setPendingApprovedCount] = useState(0);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedTask, setSelectedTask] = useState<SelectedTask | null>(null);
  const [selectedTaskAreas, setSelectedTaskAreas] = useState<SelectedTaskAreas>({});
  const [bookingStep, setBookingStep] = useState<'service' | 'tasks' | 'details'>('service');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showMyQuotations, setShowMyQuotations] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>(timeSlots);
  const [whatsappNumber, setWhatsappNumber] = useState("+2347034632037"); 
  const [generalEmail, setGeneralEmail] = useState("info@cleanbristol.com");
  const [hiddenOrderIds, setHiddenOrderIds] = useState<string[]>([]);
  const [quotationToDecline, setQuotationToDecline] = useState<QuotationRequest | null>(null);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const [formData, setFormData] = useState<FormData>({
    fullName: '', phone: '', email: '', contactPreference: 'WhatsApp',
    address: '', additionalNotes: '', pets: false,
    securityKeys: false, fence: false, date: '', timeSlot: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load hidden orders from localStorage when user is authenticated
  useEffect(() => {
    if (user) {
      const savedHidden = localStorage.getItem(`hidden-orders-${user.uid}`);
      if (savedHidden) {
        setHiddenOrderIds(JSON.parse(savedHidden));
      }
    } else {
      setHiddenOrderIds([]);
    }
  }, [user]);

  // Save hidden orders to localStorage whenever they change
  useEffect(() => {
    if (user && hiddenOrderIds.length > 0) {
      localStorage.setItem(`hidden-orders-${user.uid}`, JSON.stringify(hiddenOrderIds));
    }
    if (user && hiddenOrderIds.length === 0) {
      localStorage.removeItem(`hidden-orders-${user.uid}`);
    }
  }, [hiddenOrderIds, user]);

  // Handle hiding quotation from user view
  const handleHideQuotation = (quotationId: string) => {
    setHiddenOrderIds(prev => [...prev, quotationId]);
    toast.success('Quotation removed from your view');
  };

  // Handle declining an approved quotation
  const handleDeclineQuotation = async () => {
    if (!quotationToDecline) return;
    
    if (!declineReason.trim()) {
      toast.error("Please provide a reason for declining");
      return;
    }

    try {
      await updateDoc(doc(db, "cleaning_orders", quotationToDecline.id!), {
        status: 'cancelled',
        cancelReason: declineReason,
        cancelledAt: new Date(),
        cancelledBy: 'customer'
      });
      
      toast.success('Quotation declined');
      setShowDeclineModal(false);
      setQuotationToDecline(null);
      setDeclineReason("");
    } catch (error) {
      toast.error('Failed to decline quotation');
    }
  };

  // Optional: Restore all hidden orders
  const restoreHiddenOrders = () => {
    if (user) {
      setHiddenOrderIds([]);
      localStorage.removeItem(`hidden-orders-${user.uid}`);
      toast.success('All hidden quotations restored');
    }
  };

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const contactRef = doc(db, "settings", "contact_info");
        const contactSnap = await getDoc(contactRef);
        
        if (contactSnap.exists()) {
          const data = contactSnap.data();
          // Get the general phone number and format it for WhatsApp
          const phone = data.generalPhone || "";
          const email = data.generalEmail || "info@cleanbristol.com";
          
          // Remove any spaces, dashes, or plus signs and ensure it's just numbers
          const formattedPhone = phone.replace(/\s+/g, '').replace(/[^0-9]/g, '');
          if (formattedPhone) {
            setWhatsappNumber(formattedPhone);
          }
          if (email) {
            setGeneralEmail(email);
          }
          console.log("Contact info loaded:", { phone: formattedPhone, email });
        }
      } catch (error) {
        console.error("Error fetching contact info:", error);
        // Keep using the default
      }
    };

    fetchContactInfo();
  }, []);

  // WhatsApp configuration
  const WHATSAPP_CONFIG = {
    phoneNumber: whatsappNumber,
  };

  useEffect(() => {
    const unsubServices = onSnapshot(query(collection(db, "services"), orderBy("updatedAt", "desc")), (snapshot) => {
      setServices(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Service)));
    });
    const unsubAreas = onSnapshot(query(collection(db, "areas"), orderBy("createdAt", "desc")), (snapshot) => {
      setAreas(snapshot.docs.map(d => ({ id: d.id, label: d.data().label || '' } as Area)));
    });
    return () => { unsubServices(); unsubAreas(); };
  }, []);

  // Auth and Quotations Listener with notification count
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        setFormData(p => ({ 
            ...p, 
            fullName: u.displayName || p.fullName, 
            email: u.email || p.email 
        }));
        
        // Listen to user's quotations
        const q = query(
          collection(db, "cleaning_orders"), 
          where("userId", "==", u.uid),
          orderBy("createdAt", "desc")
        );
        
        const unsubHistory = onSnapshot(q, (snapshot) => {
          const quotations = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as QuotationRequest));
          setUserQuotations(quotations);
          
          // Count pending and approved orders that are "new" (created after last view)
          const lastViewed = localStorage.getItem('cleaning-quotations-last-viewed');
          const now = Date.now();
          
          if (showMyQuotations) {
            // If modal is open, reset count and update last viewed
            setPendingApprovedCount(0);
            localStorage.setItem('cleaning-quotations-last-viewed', now.toString());
          } else {
            // Count pending and approved orders created after last viewed time
            const newCount = quotations.filter(quotation => {
              const createdAt = quotation.createdAt?.toDate?.() || new Date(0);
              const isRelevant = quotation.status === 'pending' || quotation.status === 'approved';
              return isRelevant && (!lastViewed || createdAt.getTime() > parseInt(lastViewed));
            }).length;
            setPendingApprovedCount(newCount);
          }
        });
        
        return () => unsubHistory();
      } else {
        setUserQuotations([]);
        setPendingApprovedCount(0);
      }
    });
    return () => unsubscribe();
  }, [user, showMyQuotations]);

  // Update available time slots when date changes
  useEffect(() => {
    if (formData.date) {
      // Simple validation - you can add more complex logic later
      setAvailableTimeSlots(timeSlots);
    } else {
      setAvailableTimeSlots(timeSlots);
    }
  }, [formData.date]);

  const updateAreaCount = (taskName: string, areaId: string, increment: boolean): void => {
    setSelectedTaskAreas(prev => {
      const taskAreas = prev[taskName] || {};
      const currentCount = taskAreas[areaId] || 0;
      const newCount = increment ? currentCount + 1 : Math.max(0, currentCount - 1);
      
      if (newCount === 0) {
        const { [areaId]: _, ...rest } = taskAreas;
        if (Object.keys(rest).length === 0) {
          const { [taskName]: _, ...remainingTasks } = prev;
          return remainingTasks;
        }
        return { ...prev, [taskName]: rest };
      }
      
      return { 
        ...prev, 
        [taskName]: { 
          ...taskAreas, 
          [areaId]: newCount
        } 
      };
    });
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setShowAuthModal(false);
      toast.success('Signed in successfully!');
    } catch (error) {
      toast.error('Failed to sign in');
    }
  };

  const getTotalAreasSelected = (): number => {
    let total = 0;
    Object.values(selectedTaskAreas).forEach(taskAreas => {
      Object.values(taskAreas).forEach(count => total += count);
    });
    return total;
  };

  const hasSelectedAreas = (): boolean => getTotalAreasSelected() > 0;

  const handleQuotationSuccess = (): void => {
    toast.success('Quotation request sent successfully!');
    setBookingStep('service');
    setSelectedService(null);
    setSelectedTask(null);
    setSelectedTaskAreas({});
    setFormData({
      fullName: user?.displayName || '', phone: '', email: user?.email || '', contactPreference: 'WhatsApp',
      address: '', additionalNotes: '', pets: false, securityKeys: false, fence: false, date: '', timeSlot: ''
    });
  };

  const prepareAreasList = () => {
    const areasList: Array<{
      areaName: string;
      quantity: number;
    }> = [];

    Object.entries(selectedTaskAreas).forEach(([taskName, areaSelections]) => {
      Object.entries(areaSelections).forEach(([areaId, count]) => {
        if (count > 0) {
          const area = areas.find(a => a.id === areaId);
          if (area) {
            areasList.push({
              areaName: area.label,
              quantity: count
            });
          }
        }
      });
    });

    return areasList;
  };

  const prepareQuotationData = (): Omit<QuotationRequest, 'id'> => {
    const selectedAreasWithLabels: Record<string, Record<string, number>> = {};
    Object.entries(selectedTaskAreas).forEach(([taskName, areaSelections]) => {
      selectedAreasWithLabels[taskName] = {};
      Object.entries(areaSelections).forEach(([areaId, count]) => {
        const area = areas.find(a => a.id === areaId);
        if (area) selectedAreasWithLabels[taskName][area.label] = count;
      });
    });
    
    return {
      serviceName: selectedService?.name || '',
      serviceId: selectedService?.id || '',
      tasks: selectedTaskAreas,
      areas: selectedAreasWithLabels,
      areasList: prepareAreasList(),
      totalAreas: getTotalAreasSelected(),
      customerInfo: {
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        contactPreference: formData.contactPreference,
        address: formData.address,
        additionalNotes: formData.additionalNotes,
        pets: formData.pets,
        securityKeys: formData.securityKeys,
        fence: formData.fence
      },
      selectedDate: formData.date,
      selectedTime: formData.timeSlot,
      status: 'pending',
      createdAt: serverTimestamp(),
      userId: user?.uid,
      userEmail: user?.email,
      userName: user?.displayName || formData.fullName,
      sentViaWhatsApp: false
    };
  };

  const submitQuotationToBackend = async () => {
    if (!user) {
      toast.error('Please sign in to submit a quotation');
      setShowAuthModal(true);
      return false;
    }

    try {
      const quotationData = {
        ...prepareQuotationData(),
        userId: user.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
      };
      
      await addDoc(collection(db, "cleaning_orders"), quotationData);
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  const handleGetQuotation = async () => {
    setIsSubmitting(true);
    const success = await submitQuotationToBackend();
    if (success) {
      handleQuotationSuccess();
    }
    setIsSubmitting(false);
  };

  const handleSendViaWhatsApp = async () => {
    setIsSubmitting(true);
    
    const success = await submitQuotationToBackend();
    
    if (success) {
      try {
        const areasBreakdown = prepareAreasList().map(item => 
          `  • ${item.areaName}: ${item.quantity} ${item.quantity > 1 ? 'areas' : 'area'}`
        ).join('\n');

        const contactMethodIcon = formData.contactPreference === 'WhatsApp' ? '📱' : 
                                 formData.contactPreference === 'Phone Call' ? '📞' : '📧';

        const whatsappMessage = `*🔔 NEW QUOTATION REQUEST*\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `*🏠 SERVICE DETAILS*\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `*Service:* ${selectedService?.name}\n` +
          `*Date:* ${formData.date}\n` +
          `*Time:* ${formData.timeSlot}\n\n` +
          
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `*📋 AREAS TO BE CLEANED*\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `${areasBreakdown}\n\n` +
          `*Total Areas:* ${getTotalAreasSelected()}\n\n` +
          
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `*👤 CUSTOMER INFORMATION*\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `*Name:* ${formData.fullName}\n` +
          `*Phone:* ${formData.phone}\n` +
          `*Email:* ${formData.email}\n` +
          `*Preferred Contact:* ${contactMethodIcon} ${formData.contactPreference}\n` +
          `*Address:* ${formData.address}\n\n` +
          
          `*Pets Onsite:* ${formData.pets ? 'Yes' : 'No'}\n` +
          `*Key Access:* ${formData.securityKeys ? 'Yes' : 'No'}\n` +
          `*Secure Fence:* ${formData.fence ? 'Yes' : 'No'}\n\n` +
          
          `*Additional Notes:* ${formData.additionalNotes || 'None'}\n\n` +
          
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `⚡ *Please contact customer within 24 hours* ⚡\n` +
          `━━━━━━━━━━━━━━━━━━━━━`;

        const encodedMessage = encodeURIComponent(whatsappMessage);

        window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
        
        toast.success('Quotation sent to backend and WhatsApp!');
        handleQuotationSuccess();
      } catch (error) {
        console.error('Error sending WhatsApp:', error);
        toast.error('Quotation saved but WhatsApp failed to open');
      }
    }
    
    setIsSubmitting(false);
  };

  if (bookingStep === 'service') {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-slate-50 py-6 px-4 md:px-14 md:pb-20">
        <div className="max-w-8xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
            <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-1 tracking-tight">
                    Choose Your <span className="text-orange-600">Cleaning Service</span>
                </h1>
                <p className="text-slate-500 text-lg">Request a quotation for your cleaning needs</p>
            </div>
            
            {/* My Quotations Button with Red Bubble */}
            <div className="relative">
              <button 
                onClick={() => {
                  if (!user) {
                    setShowAuthModal(true); // Show auth overlay for unauthenticated users
                  } else {
                    setShowMyQuotations(true);
                  }
                }}
                className="bg-black text-white px-6 py-3 rounded-full font-black text-sm uppercase flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
              >
                <FaHistory /> My Quotations
              </button>
              {pendingApprovedCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center animate-pulse border-2 border-white">
                  {pendingApprovedCount}
                </span>
              )}
            </div>
          </div>

          {/* Service Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-24">
            {services.map((service, index) => {
              const theme = CARD_THEMES[index % CARD_THEMES.length];
              
              // Create WhatsApp message with service name in bold (**)
              const whatsappMessage = `Hello! I'm interested in your *${service.name}* service. Could you provide more details?`;
              const encodedMessage = encodeURIComponent(whatsappMessage);
              const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
              
              return (
                <motion.div
                  key={service.id}
                  whileHover={{ y: -12, scale: 1.02, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20, mass: 1 }}
                  className={`group mb-12 h-[28rem] bg-white rounded-md md:rounded-xl shadow-xl shadow-slate-200/50 overflow-hidden border-2 border-transparent transition-colors duration-500 flex flex-col ${theme.border} cursor-pointer`}
                >
                  <div className="relative aspect-video overflow-hidden" onClick={() => setSelectedService(service)}>
                    <motion.img 
                      src={service.image} 
                      className="w-full h-full object-cover" 
                      alt={service.name} 
                      whileHover={{ scale: 1.1 }} 
                      transition={{ duration: 0.6, ease: [0.33, 1, 0.68, 1] }} 
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
                    
                    {/* WhatsApp Button Overlay */}
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-3 right-3 p-2 bg-green-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-green-600 shadow-lg z-10"
                    >
                      <FaWhatsapp size={20} />
                    </a>
                  </div>
                  
                  <div className="p-3 flex flex-col flex-grow">
                    <div className="flex justify-between items-start">
                      <h3 className="font-black text-slate-900 mb-3 transition-colors duration-300 group-hover:text-orange-600">
                        {service.name}
                      </h3>
                      {/* Optional: Add a small WhatsApp button for mobile/always visible */}
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="md:hidden p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-all shadow-lg"
                      >
                        <FaWhatsapp size={16} />
                      </a>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {service.tasks?.slice(0, 4).map((task, tIdx) => (
                        <span key={tIdx} className={`px-2 py-0.5 rounded-md text-[8.5px] font-bold uppercase tracking-wider border ${theme.bg} ${theme.text} border-current/10`}>
                          {task.name}
                        </span>
                      ))}
                    </div>
                    
                    <p className="text-slate-500 text-xs mb-3 line-clamp-2 italic leading-relaxed">
                      "{service.description}"
                    </p>
                    
                    <div className="mt-auto flex gap-2">
                      <motion.button 
                        whileTap={{ scale: 0.95 }} 
                        onClick={() => setSelectedService(service)}
                        className={`flex-1 py-3 ${theme.btn} text-white rounded-xl text-sm font-black shadow-md ${theme.shadow} flex items-center justify-center gap-2 transition-all`}
                      >
                        Request Quotation <FaArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                      </motion.button>
                      
                      {/* WhatsApp button next to Request Quotation - visible on desktop */}
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={`hidden md:flex p-3 ${theme.btn} text-white rounded-xl shadow-md ${theme.shadow} hover:scale-110 transition-transform items-center justify-center`}
                        title={`Inquire about ${service.name} on WhatsApp`}
                      >
                        <FaWhatsapp size={18} />
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>

        {/* Auth Modal - For unauthenticated users (like decoration) */}
        <AnimatePresence>
          {showAuthModal && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
              onClick={() => setShowAuthModal(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }} 
                animate={{ scale: 1, y: 0 }} 
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-md p-8 rounded-[2.5rem] text-center relative shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-black transition-all">
                  <FaTimes size={20}/>
                </button>
                <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FaLock size={32}/>
                </div>
                <h2 className="text-3xl font-black mb-2">Account <span className="text-orange-600">Required</span></h2>
                <p className="text-slate-500 mb-8">Sign in to save your quotations and track their status.</p>
                
                <div className="space-y-4">
                  <button 
                    onClick={handleGoogleSignIn} 
                    className="w-full py-4 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-3 hover:border-slate-300 transition-all shadow-sm"
                  >
                    <FaGoogle className="text-red-500" /> Continue with Google
                  </button>
                  
                  <button 
                    onClick={() => router.push('/login')} 
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl"
                  >
                    <FaEnvelope /> Email & Password
                  </button>
                </div>

                <p className="mt-6 text-slate-400 text-xs font-bold uppercase tracking-widest">Your data is secure</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* My Quotations Modal - With hidden orders filtered out */}
        <AnimatePresence>
          {showMyQuotations && user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center md:p-4"
              onClick={() => setShowMyQuotations(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-4xl h-[95vh] md:rounded-xl shadow-2xl overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-4 md:p-6 text-white flex justify-between items-center sticky top-0 z-10">
                  <h2 className="text-xl font-black uppercase">My <span className="text-white">Quotations</span></h2>
                  <div className="flex items-center gap-3">
                    {/* Restore hidden orders button */}
                    {hiddenOrderIds.length > 0 && (
                      <button
                        onClick={restoreHiddenOrders}
                        className="text-xs bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-all"
                      >
                        Restore all
                      </button>
                    )}
                    <button onClick={() => setShowMyQuotations(false)} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-all">
                      <FaTimes />
                    </button>
                  </div>
                </div>

                <div className="py-10 px-4 md:px-6">
                  {/* Filter out hidden orders */}
                  {userQuotations.filter(q => !hiddenOrderIds.includes(q.id!)).length > 0 ? (
                    <div className="space-y-4">
                      {userQuotations
                        .filter(q => !hiddenOrderIds.includes(q.id!))
                        .map((quotation) => {
                        const isPending = quotation.status === 'pending';
                        const isApproved = quotation.status === 'approved';
                        const isCancelled = quotation.status === 'cancelled';
                        const cancelledByUser = quotation.cancelledBy === 'customer';
                        
                        return (
                          <div key={quotation.id} className={`p-6 rounded-xl border ${
                            isPending ? 'bg-orange-50 border-orange-200' :
                            isApproved ? 'bg-green-50 border-green-200' :
                            cancelledByUser ? 'bg-purple-50 border-purple-300' : // User cancelled - purple
                            'bg-red-50 border-red-200' // Admin cancelled - red
                          }`}>
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-bold text-slate-900">{quotation.serviceName}</h3>
                                <p className="text-xs text-slate-500">
                                  {quotation.selectedDate} • {quotation.selectedTime}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                                  isPending ? 'bg-orange-200 text-orange-700' :
                                  isApproved ? 'bg-green-200 text-green-700' :
                                  cancelledByUser ? 'bg-purple-200 text-purple-700' :
                                  'bg-red-200 text-red-700'
                                }`}>
                                  {isCancelled && cancelledByUser ? 'You cancelled' : quotation.status}
                                </span>
                                {quotation.sentViaWhatsApp && (
                                  <span className="text-green-600" title="Sent via WhatsApp">
                                    <FaWhatsapp size={14} />
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Show approved amount if order is approved */}
                            {isApproved && quotation.approvedTotal && (
                              <div className="mb-4 p-4 bg-emerald-100 rounded-lg border border-emerald-300">
                                <div className="flex items-center gap-2 text-emerald-800">
                                  <FaDollarSign size={16} />
                                  <span className="text-xs font-black uppercase">Approved Amount:</span>
                                </div>
                                <p className="text-2xl font-black text-emerald-700 mt-1">
                                  £{quotation.approvedTotal.toFixed(2)}
                                </p>
                              </div>
                            )}

                            <div className="mb-3 text-xs">
                              <div className="font-bold mb-1">Areas:</div>
                              <div className="space-y-1">
                                {quotation.areasList.map((area, idx) => (
                                  <div key={idx} className="flex justify-between text-slate-600">
                                    <span>{area.areaName}</span>
                                    <span>x{area.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                              <div>
                                <span className="text-slate-400">Total Areas:</span>
                                <p className="font-bold">{quotation.totalAreas}</p>
                              </div>
                              <div>
                                <span className="text-slate-400">Contact:</span>
                                <p className="font-bold">{quotation.customerInfo.contactPreference}</p>
                              </div>
                            </div>

                            {/* Show cancellation reason if order is cancelled */}
                            {isCancelled && quotation.cancelReason && (
                              <div className={`mt-2 p-3 rounded-lg border ${
                                cancelledByUser 
                                  ? 'bg-purple-50 border-purple-200' 
                                  : 'bg-red-50 border-red-200'
                              }`}>
                                <div className="flex items-center gap-2 mb-1">
                                  {cancelledByUser ? (
                                    <>
                                      <FaUserTimes className="text-purple-600" size={14} />
                                      <p className="text-[10px] font-black text-purple-700 uppercase tracking-wider">
                                        You cancelled this offer:
                                      </p>
                                    </>
                                  ) : (
                                    <>
                                      <FaTimesCircle className="text-red-600" size={14} />
                                      <p className="text-[10px] font-black text-red-700 uppercase tracking-wider">
                                        Admin Cancellation Reason:
                                      </p>
                                    </>
                                  )}
                                </div>
                                <p className={`text-xs ${
                                  cancelledByUser ? 'text-purple-600' : 'text-red-600'
                                } mt-1 italic`}>
                                  "{quotation.cancelReason}"
                                </p>
                              </div>
                            )}

                            {/* Action Buttons - Different for approved vs pending */}
                            <div className="flex gap-2 mt-3">
                              {isApproved ? (
                                <>
                                  {/* Contact buttons for approved quotations */}
                                  <a
                                      href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                                        `Hi, I got a quotation amount of *£${quotation.approvedTotal?.toFixed(2)}* for ${quotation.serviceName}. *Areas Included:*\n${quotation.areasList.map(area => `• ${area.areaName} (x${area.quantity})`).join('\n')}. \nHow can I pay?`)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                                  >
                                      <FaWhatsapp size={12} /> WhatsApp
                                  </a>

                                  <a
                                    href={`tel:${whatsappNumber}`}
                                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                                  >
                                    <FaPhone size={12} /> Call
                                  </a>
                                  <a
                                    href={`mailto:${generalEmail}?subject=Quotation Inquiry: ${quotation.serviceName}&body=Hi, I'm interested in the cleaning quotation for ${quotation.serviceName} scheduled on ${quotation.selectedDate}`}
                                    className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-1"
                                  >
                                    <FaEnvelope size={12} /> Email
                                  </a>
                                  <button
                                    onClick={() => {
                                      setQuotationToDecline(quotation);
                                      setShowDeclineModal(true);
                                    }}
                                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                    title="Decline quotation"
                                  >
                                    <FaTimesCircle size={16} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  {/* Hide button for non-approved quotations */}
                                  <button
                                    onClick={() => handleHideQuotation(quotation.id!)}
                                    className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                                  >
                                    <FaEyeSlash size={12} /> Hide from view
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4 opacity-20">🧹</div>
                      <p className="text-slate-400 font-bold">No quotations found</p>
                      {hiddenOrderIds.length > 0 && (
                        <button
                          onClick={restoreHiddenOrders}
                          className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700 transition-all"
                        >
                          Restore hidden quotations
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Decline Reason Modal */}
        <AnimatePresence>
          {showDeclineModal && quotationToDecline && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => {
                setShowDeclineModal(false);
                setQuotationToDecline(null);
                setDeclineReason("");
              }}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white max-w-sm w-full p-6 rounded-2xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                    <FaUserTimes size={20} />
                  </div>
                  <h3 className="font-bold text-lg">Decline Quotation?</h3>
                </div>
                
                <p className="text-sm text-slate-500 mb-4">
                  Please provide a reason for declining this quotation:
                </p>

                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Reason for declining..."
                  rows={3}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-purple-500 transition-all mb-6"
                  autoFocus
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeclineModal(false);
                      setQuotationToDecline(null);
                      setDeclineReason("");
                    }}
                    className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeclineQuotation}
                    className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Service Detail Overlay */}
        <AnimatePresence>
          {selectedService && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-hidden" onClick={() => setSelectedService(null)}>
                <div className="min-h-screen flex items-center justify-center md:p-2" onClick={e => e.stopPropagation()}>
                <div className="bg-white md:rounded-lg max-w-4xl w-full h-[98vh] md:max-h-[96vh] overflow-y-auto">
                    <div className="relative h-64 md:h-80">
                    <img src={selectedService.image} className="w-full h-full object-cover" alt={selectedService.name}/>
                    <button onClick={() => setSelectedService(null)} className="absolute top-6 right-6 p-3 bg-white/90 backdrop-blur rounded-full shadow-lg"><FaTimes /></button>
                    </div>
                    <div className="p-4 pb-10 md:p-8 md:pt-4">
                    <h2 className="text-lg md:text-2xl font-black text-slate-900">{selectedService.name}</h2>
                    <p className="text-slate-600 mb-4 text-xs md:text-sm">{selectedService.description}</p>
                    <h3 className="font-black mb-2 text-sm text-orange-500 underline uppercase tracking-widest">Select Your Task</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedService.tasks?.map((task, idx) => {
                        const theme = CARD_THEMES[idx % CARD_THEMES.length];
                        return(
                            <div key={idx} className={`${theme.bg} p-4 md:rounded-xl border-2 border-transparent hover:border-orange-500 cursor-pointer transition-all`} onClick={() => {
                                window.scrollTo({top:0, behavior: "smooth"})
                                setSelectedTask({ name: task.name, areaIds: task.areaIds });
                                setBookingStep('tasks');
                            }}>
                                <h4 className={`${theme.text} font-bold`}>{task.name}</h4>
                                <p className="text-sm text-slate-500">{task.areaIds.length} areas included</p>
                            </div>
                        )})}
                    </div>
                    </div>
                </div>
                </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  if (bookingStep === 'tasks' && selectedTask) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-slate-50 py-10 md:px-2">
        <div className="mx-auto max-w-5xl">
          <button onClick={() => { setBookingStep('service'); setSelectedTask(null); }} className="mx-4 mb-6 flex items-center gap-2 text-slate-600 font-bold hover:text-orange-600 transition-colors uppercase text-sm">← Back to Services</button>
          <div className="bg-white md:rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-5 text-white">
              <h2 className="text-lg md:text-2xl font-black">{selectedTask.name}</h2>
              <p className="opacity-90 text-sm">Select the areas you need cleaned</p>
            </div>
            <div className="p-4 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="md:col-span-2 space-y-1">
                <h3 className="text-sm text-green-500 font-black uppercase">Select Quantities</h3>
                <div className="space-y-3">
                  {selectedTask.areaIds.map((areaId) => {
                    const area = areas.find(a => a.id === areaId);
                    if (!area) return null;
                    const count = selectedTaskAreas[selectedTask.name]?.[areaId] || 0;
                    
                    return (
                      <div key={areaId} className="flex items-center justify-between p-3 bg-slate-50 md:rounded-lg border border-slate-100">
                        <span className="text-sm font-bold text-slate-700">{area.label}</span>
                        <div className="flex items-center gap-4">
                          <button onClick={() => updateAreaCount(selectedTask.name, areaId, false)} disabled={count === 0} className="p-3 bg-white rounded-xl border-2 hover:border-orange-500 disabled:opacity-30"><FaMinus size={12}/></button>
                          <span className="w-10 text-center text-xl font-black">{count}</span>
                          <button onClick={() => updateAreaCount(selectedTask.name, areaId, true)} className="p-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors"><FaPlus size={12}/></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <h3 className="text-sm text-green-500 font-black uppercase mt-10">Job Notes</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button onClick={() => setFormData(p => ({...p, pets: !p.pets}))} className={`p-6 rounded-xl border-4 flex flex-col items-center gap-3 transition-all ${formData.pets ? 'border-orange-600 bg-orange-50 text-orange-600' : 'border-slate-100 text-slate-400'}`}>
                    <FaDog size={24}/><span className="font-bold uppercase text-xs">Pets Onsite</span>
                  </button>
                  <button onClick={() => setFormData(p => ({...p, securityKeys: !p.securityKeys}))} className={`p-6 rounded-xl border-4 flex flex-col items-center gap-3 transition-all ${formData.securityKeys ? 'border-orange-600 bg-orange-50 text-orange-600' : 'border-slate-100 text-slate-400'}`}>
                    <FaKey size={24}/><span className="font-bold uppercase text-xs">Key Access</span>
                  </button>
                  <button onClick={() => setFormData(p => ({...p, fence: !p.fence}))} className={`p-6 rounded-xl border-4 flex flex-col items-center gap-3 transition-all ${formData.fence ? 'border-orange-600 bg-orange-50 text-orange-600' : 'border-slate-100 text-slate-400'}`}>
                    <FaLock size={24}/><span className="font-bold uppercase text-xs">Secure Fence</span>
                  </button>
                </div>

                {/* Additional Notes Input */}
                <div className="mt-6">
                  <label className="text-sm text-green-500 font-black uppercase mb-2 block">Additional Notes</label>
                  <textarea
                    value={formData.additionalNotes}
                    onChange={(e) => setFormData(p => ({...p, additionalNotes: e.target.value}))}
                    placeholder="Any special instructions or requirements..."
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-orange-500 outline-none transition-all min-h-[100px]"
                  />
                </div>
              </div>
              
              <div className="lg:col-span-1 space-y-1 mb-5">
                <h3 className="text-sm font-black uppercase text-xs text-green-500 flex items-center gap-2 mb-1"><FaCalendarAlt/> Preferred Date</h3>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <input 
                    type="date" 
                    value={formData.date} 
                    onChange={e => setFormData(p => ({...p, date: e.target.value, timeSlot: ''}))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-4 border rounded-lg font-bold"
                  />
                </div>
                
                <h3 className="text-sm font-black uppercase text-xs text-green-500 flex items-center gap-2 mt-4 mb-1"><FaClock/> Time Slot</h3>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <div className="grid grid-cols-1 gap-2">
                    {availableTimeSlots.length > 0 ? (
                      availableTimeSlots.map(slot => (
                        <button 
                          key={slot} 
                          onClick={() => setFormData(p => ({...p, timeSlot: slot}))} 
                          className={`w-full p-3 rounded-lg border-2 font-bold text-sm transition-all ${formData.timeSlot === slot ? 'bg-orange-600 border-orange-600 text-white shadow-lg' : 'bg-white border-slate-100 hover:border-orange-200'}`}
                        >
                          {slot}
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400 text-center py-2">Select a date first</p>
                    )}
                  </div>
                </div>
                
                <div className="my-4 bg-green-600 p-4 rounded-xl text-white shadow-xl shadow-green-100">
                  <div className="text-xs font-bold uppercase opacity-80">Total Areas</div>
                  <div className="text-3xl font-black">{getTotalAreasSelected()}</div>
                </div>
                
                <button 
                  onClick={() => {setBookingStep('details'); window.scrollTo({top:0, behavior: "smooth"})}} 
                  disabled={!hasSelectedAreas() || !formData.date || !formData.timeSlot} 
                  className="w-full py-4 bg-orange-600 text-white rounded-xl font-black shadow-xl hover:bg-orange-700 disabled:bg-slate-200 transition-all uppercase tracking-widest"
                >
                  Next Step
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (bookingStep === 'details') {
    const isFormComplete = formData.fullName && formData.phone && formData.email && formData.address;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-slate-50 py-8 md:px-2">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => setBookingStep('tasks')} className="mx-4 mb-6 font-bold text-slate-600 uppercase text-sm">← Back</button>
          <div className="bg-white md:rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white">
              <h2 className="text-lg md:text-2xl font-black">Your Details</h2>
              <p className="opacity-90">We'll send your quotation to this information</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name *</label>
                  <input type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full p-3 bg-slate-50 border-2 border-transparent focus:border-purple-600 rounded-md md:rounded-lg outline-none transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number *</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 bg-slate-50 border-2 border-transparent focus:border-purple-600 rounded-md md:rounded-lg outline-none" />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address *</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 bg-slate-50 border-2 border-transparent focus:border-purple-600 rounded-md md:rounded-lg outline-none" />
                </div>
                
                {/* Contact Preference Selection */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preferred Contact Method *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {contactPreferences.map((pref) => {
                      const Icon = pref.icon;
                      const isSelected = formData.contactPreference === pref.value;
                      return (
                        <button
                          key={pref.value}
                          type="button"
                          onClick={() => setFormData({...formData, contactPreference: pref.value as 'WhatsApp' | 'Phone Call' | 'Email'})}
                          className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                            isSelected 
                              ? 'border-purple-600 bg-purple-50' 
                              : 'border-slate-200 hover:border-purple-300'
                          }`}
                        >
                          <Icon className={`text-xl ${isSelected ? pref.color : 'text-slate-400'}`} />
                          <span className={`text-xs font-bold ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>
                            {pref.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Street Address *</label>
                  <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-3 bg-slate-50 border-2 border-transparent focus:border-purple-600 rounded-md md:rounded-lg outline-none" />
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-800 font-bold flex items-center gap-2">
                  <FaWhatsapp className="text-green-600" />
                  By submitting this form, you agree to receive quotation details via your preferred contact method.
                </p>
              </div>

              {!user && (
                <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs text-amber-800 font-bold mb-3">Quick sign-in to save your information</p>
                  <button 
                    onClick={handleGoogleSignIn}
                    className="w-full py-3 bg-white border-2 border-slate-200 text-slate-900 rounded-xl font-bold flex items-center justify-center gap-3 hover:border-amber-300 transition-all"
                  >
                    <FaGoogle className="text-red-500" /> Sign in with Google
                  </button>

                  <a 
                    href={"/login"}
                    className="my-2 w-full py-3 bg-blue-50 border-2 border-blue-200 text-blue-900 rounded-xl font-bold flex items-center justify-center gap-3 hover:border-blue-500 transition-all"
                  >
                    <FaEnvelope className="text-red-500" /> Email & Password
                  </a>
                </div>
              )}

              {/* Two buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button 
                  onClick={handleGetQuotation}
                  disabled={!isFormComplete || isSubmitting || !user} 
                  className="text-xs md:text-sm flex-1 py-4 bg-purple-600 text-white rounded-xl font-black shadow-xl hover:bg-purple-700 disabled:bg-slate-200 transition-all uppercase tracking-widest"
                >
                  {isSubmitting ? 'Sending...' : 'Get Quotation'}
                </button>
                
                <button 
                  onClick={handleSendViaWhatsApp}
                  disabled={!isFormComplete || isSubmitting || !user} 
                  className="text-xs md:text-sm flex-1 py-4 bg-green-600 text-white rounded-xl font-black shadow-xl hover:bg-green-700 disabled:bg-slate-200 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <FaWhatsapp size={18} />
                  {isSubmitting ? 'Sending...' : 'Send Quote Via WhatsApp'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return <div className='min-h-screen h-[100vh] bg-black text-white font-black text-3xl p-5 rounded-md'>No service found</div>;
}
