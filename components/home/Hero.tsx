"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { FaMagic, FaShieldAlt, FaClock, FaHeadset } from 'react-icons/fa';
import QuickBooking from "../booking/QuickBooking";

// Edit this list to add or change images
const HERO_IMAGES = [
  "https://maidinparadiseflorida.com/wp-content/uploads/2024/02/cheerful-black-lady-holding-bucket-of-cleaning-sup-2023-11-27-05-24-08-utc1.png",
  "https://img.freepik.com/free-photo/professional-cleaning-service-person-using-vacuum-cleaner-office_23-2150520631.jpg",
  "https://static.vecteezy.com/system/resources/thumbnails/069/923/000/small/professional-african-american-man-cleaning-office-desk-with-cloth-and-cleaning-supplies-photo.jpeg",
  "https://thecleaningladies.ca/media/images/action-shot3.jpg?width=768&height=550&loading=eager",
];

const Hero = () => {
  const [currentImage, setCurrentImage] = useState(0);

  // Interval logic to change images
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 10000); // 10000ms = 10 seconds
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with image rotation */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
            style={{
              backgroundImage: `url("${HERO_IMAGES[currentImage]}")`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent"></div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-25 md:py-33">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link href="tel:+447565123627" className="md:hidden mb-2 w-full bg-black/50 rounded-lg text-xs flex justify-center items-center gap-2 p-2 underline font-bold text-gray-50 hover:bg-gray-900">
              <FaHeadset size={15} className="text-white font-black" /> 
              <span>+44 7565 12 3627</span>
            </Link>

            <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold text-white mb-4 md:mb-6">
              Professional Cleaning Services in{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-orange-500">
                Bristol, UK
              </span>
            </h1>
            
            <p className="text-lg text-gray-300 mb-8 max-w-lg">
              Experience the sparkle of a professionally cleaned home or office. 
              We bring eco-friendly excellence to every corner of Bristol and surrounding areas.
            </p>

            <div className="flex flex-col md:flex-row gap-4">
              <Link
                href="/services"
                className="text-center w-full bg-gradient-to-r from-green-500 to-orange-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-green-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg"
              >
                Book Now
              </Link>
              <Link
                href="/about"
                className="text-center w-full bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/20 transition-all border border-white/20"
              >
                Learn More
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-10">
              {[
                { icon: FaMagic , value: '500+', label: 'Happy Clients' },
                { icon: FaShieldAlt, value: '100%', label: 'Eco-Friendly' },
                { icon: FaClock, value: '24/7', label: 'Availability' },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="text-center"
                >
                  <stat.icon className="text-3xl text-orange-500 mx-auto mb-2" />
                  <div className="text-xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Column - Booking Form Preview */}
          <QuickBooking/>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent"></div>
    </div>
  );
};

export default Hero;
