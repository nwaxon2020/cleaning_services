"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaHome, FaBuilding, FaCouch, FaWindowMaximize, FaWrench, FaLeaf } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import toast from 'react-hot-toast';

const services = [
  {
    id: 1,
    name: 'Home Cleaning',
    icon: FaHome,
    description: 'Regular home cleaning tailored to your schedule',
    price: '£40/hr',
    features: ['Living areas', 'Kitchens', 'Bathrooms', 'Bedrooms'],
  },
  {
    id: 2,
    name: 'Office Cleaning',
    icon: FaBuilding,
    description: 'Professional cleaning for your workspace',
    price: '£35/hr',
    features: ['Workstations', 'Common areas', 'Kitchens', 'Meeting rooms'],
  },
  {
    id: 3,
    name: 'Deep Cleaning',
    icon: FaCouch,
    description: 'Thorough deep cleaning of your entire space',
    price: '£50/hr',
    features: ['Baseboards', 'Inside cabinets', 'Behind appliances', 'Window tracks'],
  },
  {
    id: 4,
    name: 'Window Cleaning',
    icon: FaWindowMaximize,
    description: 'Streak-free window cleaning inside and out',
    price: '£30/hr',
    features: ['Interior windows', 'Exterior windows', 'Window sills', 'Screens'],
  },
  {
    id: 5,
    name: 'Handyman Services',
    icon: FaWrench,
    description: 'Minor repairs and maintenance',
    price: '£45/hr',
    features: ['Furniture assembly', 'Painting touch-ups', 'Fixture installation', 'General repairs'],
  },
  {
    id: 6,
    name: 'Eco-Friendly Cleaning',
    icon: FaLeaf,
    description: 'Green cleaning with environmentally safe products',
    price: '£42/hr',
    features: ['Non-toxic products', 'Sustainable practices', 'Hypoallergenic', 'Pet-safe'],
  },
];

export default function ServicesUi() {
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [duration, setDuration] = useState(2);
  const router = useRouter();

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
      toast.error('Please sign in to book a service');
      router.push('/login');
      return;
    }

    if (!selectedService || !bookingDate || !bookingTime) {
      toast.error('Please fill in all booking details');
      return;
    }

    const service = services.find(s => s.id === selectedService);
    if (!service) return;

    // Here you would save the booking to Firebase
    toast.success('Booking confirmed! Check your email for details.');
    
    // Reset form
    setSelectedService(null);
    setBookingDate('');
    setBookingTime('');
    setDuration(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-green-900 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
            >
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    Our <span className="text-orange-500">Services</span>
                </h1>
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                    Choose from our range of professional cleaning services tailored to your needs
                </p>
            </motion.div>

            {/* Services Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {services.map((service, index) => (
                    <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedService(service.id)}
                    className={`cursor-pointer group relative bg-white/5 backdrop-blur-sm rounded-xl p-6 border-2 transition-all ${
                        selectedService === service.id
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-transparent hover:border-green-500/50'
                    }`}
                    >
                    <div className="flex items-start justify-between mb-4">
                        <service.icon className="text-4xl text-orange-500 group-hover:scale-110 transition-transform" />
                        <span className="text-2xl font-bold text-white">{service.price}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{service.name}</h3>
                    <p className="text-gray-400 mb-4">{service.description}</p>
                    <ul className="space-y-2">
                        {service.features.map((feature, i) => (
                        <li key={i} className="text-sm text-gray-300 flex items-center">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                            {feature}
                        </li>
                        ))}
                    </ul>
                    </motion.div>
                ))}
            </div>

            {/* Booking Form */}
            {selectedService && (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
            >
                <h2 className="text-2xl font-bold text-white mb-6">Complete Your Booking</h2>
                <form onSubmit={handleBooking} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Selected Service
                    </label>
                    <input
                        type="text"
                        value={services.find(s => s.id === selectedService)?.name}
                        disabled
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white opacity-75"
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Duration (hours)
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="8"
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Date
                    </label>
                    <input
                        type="date"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Time
                    </label>
                    <input
                        type="time"
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    </div>
                </div>

                    <div className="border-t border-white/20 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-300">Service Cost:</span>
                            <span className="text-2xl font-bold text-white">
                            £{(
                                Number(
                                services.find(s => s.id === selectedService)?.price.match(/\d+/)?.[0]
                                ) || 40
                            ) * duration}
                            </span>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-green-500 to-orange-500 text-white px-6 py-4 rounded-lg font-semibold hover:from-green-600 hover:to-orange-600 transition-all transform hover:scale-105"
                        >
                            Confirm Booking
                        </button>
                    </div>
                </form>
            </motion.div>
            )}
        </div>
    </div>
  );
}