"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { FaCheckCircle } from 'react-icons/fa';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface AboutPreviewData {
  mainHeading: string;
  mainHighlight: string;
  mainDescription: string;
  features: string[];
  aboutImage: string;
  buttonText: string;
  buttonLink: string;
}

interface MissionData {
  clientsCount: string;
  experience: string;
}

const AboutPreview = () => {
  const [data, setData] = useState<AboutPreviewData>({
    mainHeading: 'A Local Team You Can',
    mainHighlight: 'Trust Fully',
    mainDescription: 'We are a locally owned and operated company serving Bristol, Lincolnshire and surrounding areas. From professional cleaning and expert decoration to health services and event rentals, we take pride in delivering exceptional care to homes and businesses across every service we offer.',
    features: [
      'Fully insured and vetted professionals across all services',
      'Eco-friendly cleaning and sustainable practices',
      'Expert decoration, tiling, and flooring specialists',
      'Qualified health and wellness practitioners',
      'Premium event rental equipment and supplies',
      'B&B and hospitality cleaning specialists',
      'Satisfaction guaranteed on every service',
      'Flexible booking across all offerings',
      'No hidden charges—transparent pricing always',
      'Local team serving our community with pride'
    ],
    aboutImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=1170&q=80',
    buttonText: 'Learn More About Us',
    buttonLink: '/about'
  });

  const [mission, setMission] = useState<MissionData>({
    clientsCount: '500+',
    experience: '5+'
  });

  // Fetch about preview data from Firebase
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "about_preview"), (docSnap) => {
      if (docSnap.exists()) {
        const fbData = docSnap.data() as AboutPreviewData;
        setData(prev => ({
          ...prev,
          mainHeading: fbData.mainHeading || prev.mainHeading,
          mainHighlight: fbData.mainHighlight || prev.mainHighlight,
          mainDescription: fbData.mainDescription || prev.mainDescription,
          features: fbData.features || prev.features,
          aboutImage: fbData.aboutImage || prev.aboutImage,
          buttonText: fbData.buttonText || prev.buttonText,
          buttonLink: fbData.buttonLink || prev.buttonLink
        }));
      }
    });

    return () => unsub();
  }, []);

  // Fetch mission data for stats
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "about_mission"), (docSnap) => {
      if (docSnap.exists()) {
        const missionData = docSnap.data() as MissionData;
        setMission({
          clientsCount: missionData.clientsCount || '500+',
          experience: missionData.experience || '5+'
        });
      }
    });

    return () => unsub();
  }, []);

  return (
    <section className="py-16 md:py-24 bg-white overflow-hidden relative">
      {/* Subtle Background Accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-50/50 blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Left Content Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <h2 className="text-2xl md:text-5xl font-black text-zinc-900 mb-6 tracking-tight leading-tight">
              {data.mainHeading} <br />
              <span className="text-orange-500 underline decoration-orange-200 decoration-4 underline-offset-8">
                {data.mainHighlight}
              </span>
            </h2>
            
            <p className="text-base md:text-lg text-zinc-600 mb-8 leading-relaxed">
              {data.mainDescription}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 mb-10">
              {data.features.slice(0, 6).map((item, index) => (
                <div key={index} className="flex items-center space-x-3 group">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                    <FaCheckCircle className="text-orange-500 text-xs transition-transform group-hover:scale-125" />
                  </div>
                  <span className="text-zinc-700 text-sm md:text-base font-semibold">{item}</span>
                </div>
              ))}
            </div>

            <Link 
              href={data.buttonLink} 
              className="inline-flex items-center justify-center px-10 py-4 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-orange-500 transition-all duration-300 active:scale-95 shadow-xl shadow-zinc-200"
            >
              {data.buttonText}
            </Link>
          </motion.div>

          {/* Right Image Column */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative order-1 lg:order-2"
          >
            {/* Main Image Container */}
            <div className="relative h-[300px] md:h-[500px] rounded-xl md:rounded-[3rem] overflow-hidden border-[8px] border-zinc-50 shadow-2xl">
              <Image
                src={data.aboutImage}
                alt="Our professional team"
                fill
                className="object-cover"
                priority
              />
              {/* Soft overlay to make text pop if needed */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Floating Stats - Now coming from about_mission */}
            <div className="absolute -top-4 -right-2 md:-top-8 md:-right-8 z-20 bg-white p-5 md:p-7 rounded-lg md:rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-zinc-100 flex flex-col items-center">
              <div className="text-2xl md:text-4xl font-black text-orange-500 leading-none">{mission.experience}</div>
              <div className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-zinc-400 font-bold mt-1">Years Exp</div>
            </div>

            <div className="absolute -bottom-4 -left-2 md:-bottom-8 md:-left-8 z-20 bg-white p-5 md:p-7 rounded-lg md:rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-zinc-100 flex flex-col items-center">
              <div className="text-2xl md:text-4xl font-black text-zinc-900 leading-none">{mission.clientsCount}</div>
              <div className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-zinc-400 font-bold mt-1">Clients</div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default AboutPreview;