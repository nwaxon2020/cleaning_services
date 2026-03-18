"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"; 
import { db,} from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { 
  FaSpinner, FaArrowLeft, FaPaw, FaLock, FaExclamationTriangle, FaWhatsapp,
  FaTrash, FaHome, FaChair, FaBox, FaHeartbeat, FaChevronDown, FaChevronUp, FaMinusCircle, FaPlusCircle } from "react-icons/fa";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

// --- SUB-COMPONENT: AvailabilityGrid ---
const AvailabilityGrid = ({ selectedDate, onSelect, currentSlot }: any) => {
  const [busySlots, setBusySlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const TIME_SLOTS = ["6-8 AM", "9-11 AM", "12-2 PM", "3-5 PM", "6-8 PM"];

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


//////////////////////////////////////////////////////////////////////////////////////////////////////
// --- SERVICE CONFIGURATIONS ---
const SERVICES = [
  { 
    id: 'cleaning', 
    name: 'Cleaning Services', 
    icon: FaHome,
    color: 'orange',
    basePrice: 40,
    roomTypes: [
      { id: 'bedroom', label: 'Bedrooms', price: 35 },
      { id: 'bathroom', label: 'Bathroom', price: 25 },
      { id: 'kitchen', label: 'Kitchen', price: 45 },
      { id: 'dining', label: 'Dining', price: 45 },
      { id: 'living', label: 'Living Room', price: 30 },
      { id: 'office', label: 'Office Room', price: 25 },
      { id: 'windows', label: 'Windows', price: 12 },
      { id: 'driveway', label: 'Driveway', price: 60 },
      { id: 'rubish', label: 'Rubish Removal', price: 60 },
      { id: 'oven', label: 'Oven Scrub', price: 35 },
      { id: 'laundry', label: 'Laundry Service', price: 25 },
    ]
  },
  { 
    id: 'rental', 
    name: 'Rental Services', 
    icon: FaBox,
    color: 'blue',
    basePrice: 0,
    roomTypes: [] // Will be populated from Firebase
  },
  { 
    id: 'decoration', 
    name: 'Decoration Services', 
    icon: FaChair,
    color: 'purple',
    basePrice: 0,
    roomTypes: [] // Will be populated from Firebase
  },
  { 
    id: 'health', 
    name: 'Health Services', 
    icon: FaHeartbeat,
    color: 'green',
    basePrice: 0,
    roomTypes: []
  },
];


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// --- SUB-COMPONENT: Delete Confirmation Modal ---
const DeleteConfirmation = ({ isOpen, onClose, onConfirm, booking }: any) => {
  if (!isOpen) return null;
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white max-w-sm w-full p-6 rounded-2xl shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaExclamationTriangle size={24} />
        </div>
        <h2 className="text-xl font-black uppercase italic mb-2">Delete <span className="text-red-600">Booking</span></h2>
        <p className="text-xs text-slate-500 mb-6">
          Are you sure you want to delete this {booking?.serviceName} booking? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 rounded-xl font-black text-xs uppercase hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black text-xs uppercase hover:bg-red-700 transition-all"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// --- SUB-COMPONENT: Rental Item with Quantity Input Box ---
const RentalItem = ({ item, counts, onUpdateQuantity, serviceId }: any) => {
  const [showDescription, setShowDescription] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const quantity = counts[item.id] || 0;
  const itemTotal = (item.price || 0) * quantity;
  
  const handleSelect = () => {
    if (isSelected) {
      // Deselect - remove item
      onUpdateQuantity(item.id, 0);
      setIsSelected(false);
    } else {
      // Select - set default quantity to 1
      onUpdateQuantity(item.id, 1);
      setIsSelected(true);
    }
  };
  
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < 0) {
      onUpdateQuantity(item.id, 0);
      if (value < 0 || value === 0) {
        setIsSelected(false);
      }
    } else {
      onUpdateQuantity(item.id, value);
      if (value > 0 && !isSelected) {
        setIsSelected(true);
      }
    }
  };
  
  return (
    <div className={`bg-black/20 p-3 rounded-md border ${isSelected? "border-2 border-orange-400/90":"border-white/5"}`}>
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <div className="flex items-start gap-2">
            <div className="flex flex-col">
              <span className="text-white text-xs font-bold uppercase">{item.name || item.categoryName}</span>
              {item.categoryName && (
                <span className="text-[10px] font-semibold text-slate-400 mt-0.5">{item.categoryName}</span>
              )}
            </div>
            <span className="text-xs font-black text-green-400">£{item.price} each</span>
            {item.description && (
              <button 
                onClick={() => setShowDescription(!showDescription)}
                className="text-orange-400 hover:text-orange-300 transition-colors"
              >
                {showDescription ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
              </button>
            )}
          </div>
        </div>
        
        <button
          onClick={handleSelect}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase ${
            isSelected ? 'bg-orange-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {isSelected ? 'Selected' : 'Select'}
        </button>
      </div>
      
      {/* Description Dropdown */}
      {showDescription && item.description && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-2 pt-2 border-t border-white/10"
        >
          <p className="text-xs font-semibold bg-black rounded p-1.5 text-slate-300 italic">{item.description}</p>
        </motion.div>
      )}
      
      {/* Quantity Input - Only shows when item is selected */}
      {isSelected && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 pt-2 border-t border-white/10"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-xs text-white font-bold">Quantity:</span>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={handleQuantityChange}
                className="w-24 px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white text-xs font-bold focus:border-orange-500 outline-none"
                placeholder="Enter quantity"
              />
            </div>
            {quantity > 0 && (
              <span className="text-sm bg-black/50 py-2 px-3 rounded-lg font-black text-green-400">£{itemTotal.toFixed(2)}</span>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// --- SUB-COMPONENT: Decoration Item ---
const DecorationItem = ({ item, counts, onToggle,}: any) => {
  const [showDescription, setShowDescription] = useState(false);
  
  return (
    <div className={`"bg-black/20 p-3 rounded-xl border border-white/5"`}>
      <div className="flex justify-between items-center">
        <div className="flex-1 mr-12">
          <div className="flex justify-between items-start gap-2">
            <div className="flex flex-col">
              <span className="text-white text-xs font-bold uppercase">{item.name || item.categoryName}</span>
              {item.categoryName && (
                <span className="text-[8px] font-semibold text-slate-400 mt-0.5">{item.categoryName}</span>
              )}
            </div>
            {item.description && (
              <button 
                onClick={() => setShowDescription(!showDescription)}
                className="text-orange-400 hover:text-orange-300 transition-colors"
              >
                {showDescription ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
              </button>
            )}
          </div>
          {item.pricePer && item.priceRange && (
            <p className="text-xs font-black text-orange-400 mt-1">
              {item.priceRange} {item.pricePer}
            </p>
          )}
        </div>
        <button
          onClick={() => onToggle(item.id)}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase ${
            counts[item.id] ? 'bg-orange-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {counts[item.id] ? 'Selected' : 'Select'}
        </button>
      </div>
      
      {/* Description Dropdown */}
      {showDescription && item.description && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-2 pt-2 border-t border-white/10"
        >
          <p className="text-xs font-semibold bg-black rounded p-1.5 text-slate-300 italic">{item.description}</p>
        </motion.div>
      )}
    </div>
  );
};


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Quick Booking Page Model
const QuickBooking = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("+2347034632037");
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [currentBooking, setCurrentBooking] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<any>(null);
  
  // State for dynamic items from Firebase
  const [rentalItems, setRentalItems] = useState<any[]>([]);
  const [decorationItems, setDecorationItems] = useState<any[]>([]);
  
  // Form data that persists through all steps
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

  // Fetch rental items from Firebase
  useEffect(() => {
    const q = query(collection(db, "renting_items"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || 'Rental Item',
        categoryName: doc.data().categoryName || '',
        description: doc.data().description || '',
        price: doc.data().price || 0,
        ...doc.data()
      }));
      setRentalItems(items);
    });
    
    return () => unsubscribe();
  }, []);

  // Fetch decoration items from Firebase
  useEffect(() => {
    const q = query(collection(db, "decoration_items"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || 'Decoration Item',
        categoryName: doc.data().categoryName || '',
        description: doc.data().description || '',
        pricePer: doc.data().pricePer || '',
        priceRange: doc.data().priceRange || '',
        ...doc.data()
      }));
      setDecorationItems(items);
    });
    
    return () => unsubscribe();
  }, []);

  // Load saved bookings from localStorage
  useEffect(() => {
    const savedBookings = localStorage.getItem('quickBookings');
    if (savedBookings) {
      try {
        setUserBookings(JSON.parse(savedBookings));
      } catch (e) {
        console.error("Error parsing saved bookings:", e);
      }
    }
  }, []);

  // Save bookings to localStorage whenever they change
  useEffect(() => {
    if (userBookings.length > 0) {
      localStorage.setItem('quickBookings', JSON.stringify(userBookings));
    } else {
      localStorage.removeItem('quickBookings');
    }
  }, [userBookings]);

  // Fetch WhatsApp number from admin settings
  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const contactRef = doc(db, "settings", "contact_info");
        const contactSnap = await getDoc(contactRef);
        
        if (contactSnap.exists()) {
          const data = contactSnap.data();
          const phone = data.generalPhone || "";
          const formattedPhone = phone.replace(/\s+/g, '').replace(/[^0-9]/g, '');
          if (formattedPhone) {
            setWhatsappNumber(formattedPhone);
          }
        }
      } catch (error) {
        console.error("Error fetching contact info:", error);
      }
    };
    fetchContactInfo();
  }, []);

  // Check if user already has a booking for a service
  const hasExistingBooking = (serviceId: string) => {
    return userBookings.some(b => b.service === serviceId);
  };

  // Get existing booking for a service
  const getExistingBooking = (serviceId: string) => {
    return userBookings.find(b => b.service === serviceId);
  };

  const selectedService = SERVICES.find(s => s.id === formData.service);
  
  // Get room types based on selected service
  const getRoomTypes = () => {
    if (formData.service === 'cleaning') {
      return selectedService?.roomTypes || [];
    } else if (formData.service === 'rental') {
      return rentalItems;
    } else if (formData.service === 'decoration') {
      return decorationItems;
    }
    return [];
  };

  const filteredRooms = getRoomTypes();

  // Calculate rental total
  const calculateRentalTotal = () => {
    if (formData.service !== 'rental') return 0;
    return rentalItems.reduce((total, item) => {
      return total + ((item.price || 0) * (counts[item.id] || 0));
    }, 0);
  };

  const rentalTotal = calculateRentalTotal();

  // Check if rental items have quantities
  const hasRentalQuantities = () => {
    if (formData.service !== 'rental') return true;
    return Object.values(counts).every(qty => qty > 0);
  };

  const checkAvailability = async (date: string, time: string) => {
    const q = query(collection(db, "bookings"), where("bookingDate", "==", date), where("bookingTime", "==", time));
    const snapshot = await getDocs(q);
    return snapshot.empty;
  };

  // Step 1: Save contact info and go to service selection
  const handleContactSubmit = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      return toast.error("Please fill in all contact fields");
    }
    setStep(2);
  };

  // Step 2: Handle service selection
  const handleServiceSelect = (serviceId: string) => {
    const service = SERVICES.find(s => s.id === serviceId);
    
    // Handle Health Service - redirect to services page with health tab
    if (service?.id === 'health') {
      localStorage.setItem('lastVisitedServiceTab', 'health');
      router.push('/services');
      return;
    }
    
    // Check if user already has a booking for this service
    const existing = getExistingBooking(serviceId);
    if (existing) {
      setCurrentBooking(existing);
      setStep(5); // Show existing booking view
      return;
    }

    // Save service and go to service-specific form (step 3)
    setFormData({...formData, service: serviceId});
    setCounts({}); // Reset counts when changing services
    setStep(3);
  };

  // Step 3: Handle service form submission
  const handleServiceFormSubmit = () => {
    // Validate based on service type
    if (Object.keys(counts).length === 0) {
      return toast.error("Please select at least one item");
    }
    
    // For rentals, ensure all selected items have quantities > 0
    if (formData.service === 'rental') {
      const invalidItems = Object.entries(counts).filter(([_, qty]) => qty <= 0);
      if (invalidItems.length > 0) {
        return toast.error("Please enter valid quantities for all selected items");
      }
    }
    
    setStep(4);
  };

  // Handle quantity update for rental items
  const handleQuantityUpdate = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      const { [itemId]: _, ...rest } = counts;
      setCounts(rest);
    } else {
      setCounts({...counts, [itemId]: newQuantity});
    }
  };

  // Handle toggle for decoration items
  const handleItemToggle = (itemId: string) => {
    if (counts[itemId]) {
      const { [itemId]: _, ...rest } = counts;
      setCounts(rest);
    } else {
      setCounts({...counts, [itemId]: 1});
    }
  };

  // Step 4: Handle final submission with date/time and WhatsApp
  const handleFinalSubmit = async () => {
    if (!formData.date) return toast.error("Please select a date");
    if (!formData.time) return toast.error("Please select a time slot");
    
    setLoading(true);
    
    // Check availability for cleaning services only
    if (formData.service === 'cleaning') {
      const isAvailable = await checkAvailability(formData.date, formData.time);
      if (!isAvailable) {
        setLoading(false);
        return toast.error("This time slot is taken. Please choose another.");
      }
    }

    try {
      // Prepare booking data
      const bookingData = {
        id: Date.now().toString(),
        service: formData.service,
        serviceName: selectedService?.name,
        customerInfo: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
        },
        bookingDate: formData.date,
        bookingTime: formData.time,
        hasPets: formData.hasPets,
        notes: formData.notes,
        roomCounts: counts,
        rentalTotal: formData.service === 'rental' ? rentalTotal : 0,
        createdAt: new Date().toISOString(),
      };

      //WHATSAPP MESSAGE CONFIG BASED ON SERVICE SELECTED //////////////////////////////////////////////////////////////////
      // Prepare WhatsApp message based on service type
      let itemsBreakdown = "";
      const selectedItems = filteredRooms.filter(room => (counts[room.id] || 0) > 0);
      
      if (formData.service === 'cleaning') {
        itemsBreakdown = selectedItems
          .map(room => `  • *${room.label}*: ${counts[room.id]}x`)
          .join('\n');
      } else if (formData.service === 'rental') {
        itemsBreakdown = selectedItems
          .map(item => {
            const quantity = counts[item.id] || 0;
            const itemTotal = (item.price || 0) * quantity;
            const desc = item.description ? ` - ${item.description.substring(0, 50)}${item.description.length > 50 ? '...' : ''}` : '';
            const categoryInfo = item.categoryName ? ` (${item.categoryName})` : '';
            return `  • *${item.name}*${categoryInfo}: \n- QTY: *${quantity}*\n- @ £${item.price} = *£${itemTotal.toFixed(2)}*\n${desc}`;
          })
          .join('\n');
      } else if (formData.service === 'decoration') {
        itemsBreakdown = selectedItems
          .map(item => {
            const priceInfo = item.priceRange && item.pricePer ? ` (${item.priceRange} ${item.pricePer})` : '';
            const desc = item.description ? ` - ${item.description.substring(0, 50)}${item.description.length > 50 ? '...' : ''}` : '';
            const categoryInfo = item.categoryName ? ` (${item.categoryName})` : '';
            return `  • *${item.name}*${categoryInfo}${priceInfo}${desc}`;
          })
          .join('\n');
      }

      //WHATSAPP DIAPLAY MESSAGE CONFIG /////////////////////////////////////////////////////////////////////////////////////////////////
      // Get item count for summary
      const itemCount = Object.keys(counts).length;
      const itemWord = itemCount === 1 ? 'item' : 'items';

      let messageFooter = `━━━━━━━━━━━━━━━━━━━━━\n⚡ *Please provide quote and respond within 24 hours* ⚡\n━━━━━━━━━━━━━━━━━━━━━`;
      
      if (formData.service === 'rental') {
        messageFooter = `━━━━━━━━━━━━━━━━━━━━━\n*💰 TOTAL: £${rentalTotal.toFixed(2)}*\n━━━━━━━━━━━━━━━━━━━━━\n\n⚡ *Please confirm and respond within 24 hours* ⚡\n━━━━━━━━━━━━━━━━━━━━━`;
      }

      const whatsappMessage = `*🔔 NEW BOOKING REQUEST*\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `*🏠 SERVICE DETAILS*\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `*Service:* ${selectedService?.name}\n` +
        `*Date:* ${formData.date}\n` +
        `*Time:* ${formData.time}\n\n` +
        
        (itemsBreakdown ? `━━━━━━━━━━━━━━━━━━━━━\n*📋 ITEMS SELECTED (${itemCount} ${itemWord})*\n━━━━━━━━━━━━━━━━━━━━━\n${itemsBreakdown}\n\n` : '') +
        
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `*👤 CUSTOMER INFORMATION*\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `*Name:* ${formData.name}\n` +
        `*Phone:* ${formData.phone}\n` +
        `*Email:* ${formData.email}\n` +
        `*Address:* ${formData.address}\n\n` +
        
        `*Pets Onsite:* ${formData.hasPets ? 'Yes' : 'No'}\n` +
        `*Additional Notes:* ${formData.notes || 'None'}\n\n` +
        
        messageFooter;

      const encodedMessage = encodeURIComponent(whatsappMessage);
      
      // Save to localStorage
      const updatedBookings = [...userBookings, bookingData];
      setUserBookings(updatedBookings);
      
      // Open WhatsApp
      window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
      
      toast.success("Booking request sent via WhatsApp!");
      
      // Reset form to step 1
      setStep(1);
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
      setCounts({});
      
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Failed to submit booking");
    }
    
    setLoading(false);
  };

  const handleDeleteBooking = () => {
    if (!bookingToDelete) return;
    
    const updatedBookings = userBookings.filter(b => b.id !== bookingToDelete.id);
    setUserBookings(updatedBookings);
    setShowDeleteModal(false);
    setBookingToDelete(null);
    setCurrentBooking(null);
    // After successful deletion, go back to step 1
    setStep(1);
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
    setCounts({});
    toast.success("Booking deleted successfully");
  };

  const getServiceIcon = (serviceId: string) => {
    const service = SERVICES.find(s => s.id === serviceId);
    const Icon = service?.icon || FaHome;
    return <Icon className="text-xl" />;
  };

  return (
    <div className="bg-black/20 backdrop-blur-lg rounded-xl p-4 md:p-6 border border-white/20 w-full min-h-[400px] flex flex-col justify-between overflow-hidden">
      <AnimatePresence mode="wait">

        {/* STEP 1: Contact Information */}
        {step === 1 && (
          <motion.div key="step1" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="space-y-4">
            <h3 className="text-xl font-black text-white uppercase italic mb-4">Your Contact Info</h3>
            <input 
              required 
              type="text" 
              placeholder="Full Name" 
              className="booking-input" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
            />
            <input 
              required 
              type="email" 
              placeholder="Email Address" 
              className="booking-input" 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
            />
            <input 
              required 
              type="tel" 
              placeholder="Phone Number (+44)" 
              className="booking-input" 
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
            />
            <input 
              required 
              type="text" 
              placeholder="Full Address" 
              className="booking-input" 
              value={formData.address} 
              onChange={e => setFormData({...formData, address: e.target.value})} 
            />
            <button 
              onClick={handleContactSubmit} 
              className="w-full bg-orange-500 py-4 rounded-xl font-black text-white uppercase tracking-widest text-xs hover:bg-orange-600 transition-all"
            >
              Continue to Services
            </button>
          </motion.div>
        )}

        {/* STEP 2: Service Selection */}
        {step === 2 && (
          <motion.div key="step2" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => setStep(1)} className="text-white hover:text-orange-500 transition-colors">
                <FaArrowLeft />
              </button>
              <h3 className="text-lg font-black text-white uppercase italic">Select Service</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {SERVICES.map(service => {
                const Icon = service.icon;
                const hasBooking = hasExistingBooking(service.id);
                const existing = getExistingBooking(service.id);
                const colorClasses = {
                  orange: 'hover:border-orange-500 text-orange-500',
                  blue: 'hover:border-blue-500 text-blue-500',
                  purple: 'hover:border-purple-500 text-purple-500',
                  green: 'hover:border-green-500 text-green-500',
                }[service.color] || 'hover:border-orange-500 text-orange-500';

                return (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service.id)}
                    className={`h-40 p-4 bg-black/20 border-2 ${hasBooking ? 'border-green-500' : 'border-white/10'} rounded-xl hover:bg-white/10 transition-all relative group`}
                  >
                    {hasBooking && (
                      <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[8px] font-black px-2 py-1 rounded-full">
                        BOOKED
                      </span>
                    )}
                    <Icon className={`text-2xl mx-auto mb-2 ${colorClasses}`} />
                    <p className="text-white text-[11px] font-black uppercase">{service.name}</p>
                    {hasBooking && existing && (
                      <p className="text-xs text-green-400 mt-1">{existing.bookingDate}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* STEP 3: Service-specific Form (Cleaning, Rental, Decoration) */}
        {step === 3 && selectedService && selectedService.id !== 'health' && (
          <motion.div key="step3" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => setStep(2)} className="text-white hover:text-orange-500 transition-colors">
                <FaArrowLeft />
              </button>
              <h3 className="text-lg font-black text-white uppercase italic">Select {selectedService.name} Items</h3>
            </div>

            {/* Room/Item Selection */}
            {filteredRooms.length > 0 ? (
              <div className="max-h-[250px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                {selectedService.id === 'cleaning' ? (
                  // Cleaning items with quantity selectors
                  filteredRooms.map(room => (
                    <div key={room.id} className="flex justify-between items-center bg-black/20 p-3 rounded-md border border-white/5">
                      <span className="text-white text-xs font-bold uppercase">{room.label}</span>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setCounts({...counts, [room.id]: Math.max(0, (counts[room.id] || 0) - 1)})} 
                          className="text-orange-500"
                        >
                          <FaMinusCircle size={20}/>
                        </button>
                        <span className="text-white font-bold w-8 text-center">{counts[room.id] || 0}</span>
                        <button 
                          onClick={() => setCounts({...counts, [room.id]: (counts[room.id] || 0) + 1})} 
                          className="text-orange-500"
                        >
                          <FaPlusCircle size={20}/>
                        </button>
                      </div>
                    </div>
                  ))
                ) : selectedService.id === 'rental' ? (
                  // Rental items with quantity input box
                  filteredRooms.map(item => (
                    <RentalItem 
                      key={item.id}
                      item={item}
                      counts={counts}
                      onUpdateQuantity={handleQuantityUpdate}
                      serviceId={selectedService.id}
                    />
                  ))
                ) : selectedService.id === 'decoration' ? (
                  // Decoration items with description dropdown and price info
                  filteredRooms.map(item => (
                    <DecorationItem 
                      key={item.id}
                      item={item}
                      counts={counts}
                      onToggle={handleItemToggle}
                    />
                  ))
                ) : null}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                Loading items...
              </div>
            )}

            {/* Rental Total Display */}
            {selectedService.id === 'rental' && rentalTotal > 0 && (
              <div className="bg-white p-2 rounded-lg border-t border-white/10">
                <div className="flex justify-between text-gray-600 text-sm font-black">
                  <span>Total Amount:</span>
                  <span className="text-red-500">£{rentalTotal.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Pets & Notes (for all services) */}
            <div className="grid grid-cols-4 gap-2">
              <button 
                onClick={() => setFormData({...formData, hasPets: !formData.hasPets})} 
                className={`col-span-1 rounded-xl flex flex-col items-center justify-center border transition-all ${
                  formData.hasPets ? 'bg-orange-500 border-orange-500 text-white' : 'bg-black/50 border-white/10 text-zinc-400'
                }`}
              >
                <FaPaw size={14} />
                <span className="text-[10px] font-black uppercase mt-1">Pets</span>
              </button>
              <textarea 
                placeholder="Special notes (key code, instructions etc)..." 
                className="col-span-3 bg-black/50 border border-white/10 rounded-xl p-2 text-white text-xs outline-none h-[45px] resize-none" 
                value={formData.notes} 
                onChange={e => setFormData({...formData, notes: e.target.value})} 
              />
            </div>

            <button 
              onClick={handleServiceFormSubmit}
              className="w-full bg-orange-500 py-4 rounded-xl font-black text-white uppercase tracking-widest text-xs hover:bg-orange-600 transition-all"
            >
              Continue to Schedule
            </button>
          </motion.div>
        )}

        {/* STEP 4: Date, Time & Final Submission */}
        {step === 4 && selectedService && (
          <motion.div key="step4" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => setStep(3)} className="text-white hover:text-orange-500 transition-colors">
                <FaArrowLeft />
              </button>
              <h3 className="text-lg font-black text-white uppercase italic">Schedule & Confirm</h3>
            </div>

            {/* Summary Card */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
              <p className="text-white text-xs font-bold">
                <span className="text-orange-400">Service:</span> {selectedService.name}
              </p>
              <p className="text-white text-xs font-bold">
                <span className="text-orange-400">Name:</span> {formData.name}
              </p>
              <p className="text-white text-xs font-bold">
                <span className="text-orange-400">Contact:</span> {formData.phone}
              </p>
              {Object.keys(counts).length > 0 && (
                <p className="text-white text-xs font-bold">
                  <span className="text-orange-400">Items Selected:</span> {Object.keys(counts).length}
                </p>
              )}
              {selectedService.id === 'rental' && rentalTotal > 0 && (
                <p className="text-white text-sm font-black pt-2 border-t border-white/10">
                  <span className="text-orange-400">Total:</span> <span className="bg-black/50 py-1 px-3 rounded text-green-400">£{rentalTotal.toFixed(2)}</span>
                </p>
              )}
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <label className="text-white text-[10px] font-black uppercase">Select Date</label>
              <input 
                type="date" 
                className="booking-input" 
                min={new Date().toISOString().split("T")[0]} 
                value={formData.date} 
                onChange={e => setFormData({...formData, date: e.target.value, time: ""})} 
                required 
              />
            </div>

            {/* Time Selection */}
            {formData.date && (
              <div className="space-y-2">
                <label className="text-white text-[10px] font-black uppercase">Select Time</label>
                <AvailabilityGrid 
                  selectedDate={formData.date} 
                  currentSlot={formData.time} 
                  onSelect={(s: any) => setFormData({...formData, time: s})} 
                />
              </div>
            )}

            <button 
              onClick={handleFinalSubmit} 
              disabled={loading || !formData.time || (formData.service === 'rental' && !hasRentalQuantities())} 
              className={`w-full py-4 rounded-xl font-black text-white uppercase tracking-widest text-xs flex justify-center items-center gap-2 transition-all ${
                !formData.time || (formData.service === 'rental' && !hasRentalQuantities()) ? 'bg-gray-700 opacity-50 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading ? <FaSpinner className="animate-spin" /> : (
                <>
                  <FaWhatsapp size={16} />
                  Send via WhatsApp
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* STEP 5: Existing Booking View */}
        {currentBooking && step === 5 && (
          <motion.div key="existing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center space-y-6">
            <div className="text-center relative">
              <div className="w-16 h-16 bg-orange-500/70 rounded-full flex items-center justify-center mx-auto mb-4">
                {getServiceIcon(currentBooking.service)}
              </div>
              <h3 className="text-white font-black uppercase italic text-xl leading-tight">
                {currentBooking.serviceName}
              </h3>
              <p className="text-orange-400 text-sm font-black mt-1">
                {currentBooking.bookingDate} • {currentBooking.bookingTime}
              </p>
            </div>

            <div className="w-full space-y-3 bg-black/40 p-4 rounded-md">
              <p className="text-white text-xs font-bold">
                <span className="text-slate-300">Name:</span> {currentBooking.customerInfo.name}
              </p>
              <p className="text-white text-xs font-bold">
                <span className="text-slate-300">Phone:</span> {currentBooking.customerInfo.phone}
              </p>
              <p className="text-white text-xs font-bold">
                <span className="text-slate-300">Address:</span> {currentBooking.customerInfo.address}
              </p>
              {currentBooking.notes && (
                <p className="text-white text-xs font-bold">
                  <span className="text-slate-300">Notes:</span> {currentBooking.notes}
                </p>
              )}
            </div>

            <div className="flex flex-col w-full gap-3">
              <button 
                onClick={() => {
                  const message = encodeURIComponent(
                    `Hi, I'm following up on my ${currentBooking.serviceName} booking for ${currentBooking.bookingDate} at ${currentBooking.bookingTime}.`
                  );
                  window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
                }}
                className="flex items-center justify-center gap-2 w-full bg-green-600 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-green-700 transition-all"
              >
                <FaWhatsapp /> Contact on WhatsApp
              </button>
              
              <button 
                onClick={() => {
                  setStep(1);
                  setCurrentBooking(null);
                }}
                className="flex items-center justify-center gap-2 w-full bg-white/10 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white/20 transition-all"
              >
                Book Another Service
              </button>

              <button 
                onClick={() => {
                  setBookingToDelete(currentBooking);
                  setShowDeleteModal(true);
                }}
                className="flex items-center justify-center gap-2 w-full bg-red-600/20 text-red-400 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600/30 transition-all"
              >
                <FaTrash /> Delete Booking
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation 
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setBookingToDelete(null);
        }}
        onConfirm={handleDeleteBooking}
        booking={bookingToDelete}
      />

      <style jsx>{`
        .booking-input { 
          width: 100%; 
          padding: 0.8rem; 
          background: rgba(255,255,255,0.05); 
          border: 1px solid rgba(255,255,255,0.1); 
          border-radius: 0.75rem; 
          color: white; 
          font-weight: 700; 
          font-size: 12px; 
          outline: none; 
        }
        .booking-input:focus { 
          border-color: #f97316; 
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default QuickBooking;