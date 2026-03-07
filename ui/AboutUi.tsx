"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  FaUsers, FaAward, 
  FaRocket, FaStar, FaEnvelope, 
  FaPhoneAlt, FaMapMarkerAlt, FaLinkedin, FaTwitter
} from 'react-icons/fa';

// --- DATA OBJECT WITH IMAGES, TITLES, AND QUOTES ---
const HERO_DATA = [
  {
    url: "https://static.vecteezy.com/system/resources/thumbnails/069/923/000/small/professional-african-american-man-cleaning-office-desk-with-cloth-and-cleaning-supplies-photo.jpeg",
    title: "OUR <span class='text-orange-500 italic'>LEGACY</span>",
    quote: "Precision in every corner, excellence in every touch."
  },
  {
    url: "https://maidinparadiseflorida.com/wp-content/uploads/2024/02/cheerful-black-lady-holding-bucket-of-cleaning-sup-2023-11-27-05-24-08-utc1.png",
    title: "OUR <span class='text-orange-500 italic'>QUALITY</span>",
    quote: "Dedicated to restoring the sparkle in your sanctuary."
  },
  {
    url: "https://img.freepik.com/free-photo/professional-cleaning-service-person-using-vacuum-cleaner-office_23-2150520631.jpg",
    title: "OUR <span class='text-orange-500 italic'>STANDARDS</span>",
    quote: "Hospital-grade sanitization for your peace of mind."
  },
  {
    url: "https://thecleaningladies.ca/media/images/action-shot3.jpg?width=768&height=550&loading=eager",
    title: "OUR <span class='text-orange-500 italic'>PROMISE</span>",
    quote: "More than just a clean space—it's a fresh start."
  }
];

export default function AboutUi() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_DATA.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const timeline = [
    {
      year: '2018',
      title: 'The Spark',
      desc: 'Founded by Sarah Johnson as a one-woman operation in the heart of Bristol, UK.',
      icon: <FaRocket />
    },
    {
      year: '2020',
      title: 'Resilience & Growth',
      desc: 'Expanded our team to 10+ professionals and introduced eco-friendly cleaning standards.',
      icon: <FaUsers />
    },
    {
      year: '2023',
      title: 'Excellence Award',
      desc: 'Voted the #1 Local Cleaning Service for quality and customer satisfaction.',
      icon: <FaAward />
    },
    {
      year: '2026',
      title: 'Modern Innovation',
      desc: 'Launched our digital booking platform to serve our community with 24/7 convenience.',
      icon: <FaStar />
    }
  ];

  const staff = [
    {
      name: 'Sarah Johnson',
      role: 'HR',
      bio: 'With over 10 years of experience, Sarah leads with a passion for excellence.',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ91IiT4f7trpTWOxjgtVsS6pcWtBX3bwiP6g&s'
    },
    {
      name: 'Mike Thompson',
      role: 'Operations Manager',
      bio: 'Mike ensures every cleaning job meets our strict hospital-grade standards.',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80'
    },
    {
      name: 'Emma Wilson',
      role: 'Customer Relations',
      bio: 'Emma is dedicated to providing the best support and service to our clients.',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=500&q=80'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 pt-16 md:pt-20 pb-20 overflow-hidden">
      
      {/* --- SLIDING HERO SECTION --- */}
      <section className="relative h-[40vh] md:h-[70vh] flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 z-0"
          >
            <div className="absolute inset-0 bg-black/60 z-10" />
            <img 
              src={HERO_DATA[currentIndex].url} 
              className="w-full h-full object-cover" 
              alt="Cleaning Excellence" 
            />
          </motion.div>
        </AnimatePresence>

        <div className="relative z-20 text-center px-6">
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-orange-500 font-black uppercase tracking-[0.3em] text-[10px] mb-4 block"
          >
            EST. 2018
          </motion.span>

          {/* --- SLIDING DYNAMIC TITLE --- */}
          <div className="overflow-hidden mb-4">
            <AnimatePresence mode="wait">
              <motion.h1 
                key={currentIndex}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase"
                dangerouslySetInnerHTML={{ __html: HERO_DATA[currentIndex].title }}
              />
            </AnimatePresence>
          </div>
          
          {/* --- SLIDING DYNAMIC QUOTE --- */}
          <div className="h-10">
             <AnimatePresence mode="wait">
                <motion.p 
                  key={currentIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.8 }}
                  className="text-white/90 max-w-xl mx-auto font-medium uppercase tracking-[0.1em] text-[12px] italic"
                >
                  "{HERO_DATA[currentIndex].quote}"
                </motion.p>
             </AnimatePresence>
          </div>

          <p className="text-white/60 max-w-xl mx-auto mt-8 font-medium uppercase tracking-[0.2em] text-[9px]">
            The standard of cleanliness in Bristol, UK
          </p>
        </div>
      </section>

      {/* --- HERO TEXT SECTION --- */}
      <section className="relative px-6 py-8 md:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-7xl font-black tracking-tighter mb-3 text-slate-900"
          >
            RESTORING <span className="text-orange-600 italic">COMFORT</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-slate-600 text-lg md:text-xl leading-relaxed"
          >
            We don't just scrub floors; we restore comfort. BristolClean is built on the belief that a spotless space is the foundation of a healthy life.
          </motion.p>
        </div>
      </section>

      {/* --- TIMELINE SECTION --- */}
      <section className="py-10 md:py-24 px-6 border-b border-slate-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-16 text-center text-slate-900">Our Journey</h2>
          <div className="relative border-l-2 border-slate-100 ml-4 md:ml-0 md:flex md:border-l-0 md:border-t-2 md:justify-between">
            {timeline.map((item, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-8 md:pl-0 md:pt-10 md:w-1/4"
              >
                <div className="absolute -left-[9px] top-0 md:-top-[9px] md:left-0 w-4 h-4 rounded-full bg-orange-600 ring-4 ring-white" />
                <span className="text-orange-600 font-black text-2xl mb-2 block">{item.year}</span>
                <h3 className="text-slate-900 font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed pr-4">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CEO SPOTLIGHT --- */}
      <section className="py-24 px-6 bg-slate-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               className="relative"
            >
              <div className="absolute -inset-4 border-2 border-orange-100 rounded-3xl" />
              <img 
                src="https://www.shutterstock.com/image-photo/portrait-black-woman-entrepreneur-smile-260nw-2729517329.jpg" 
                alt="Sarah Johnson" 
                className="w-full h-[500px] object-cover rounded-2xl shadow-2xl shadow-slate-200"
              />
              <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-6 rounded-xl shadow-xl border border-slate-100">
                 <p className="text-slate-700 italic text-sm mb-4">"Our goal was never to be the biggest, just the most trusted. We treat every home like it's our own."</p>
                 <p className="text-orange-600 font-black text-xs uppercase tracking-widest">Sarah Johnson — Founder</p>
              </div>
            </motion.div>

            <div className="space-y-8">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900">Letter from the <span className="text-orange-600">CEO</span></h2>
              <div className="w-20 h-1.5 bg-orange-600 rounded-full" />
              <p className="text-slate-600 leading-relaxed text-lg">
                When I started BristolClean in 2018, I had one mop, a bucket, and a deep-seated passion for helping my neighbors. I saw how much stress a messy home could add to an already busy life. 
              </p>
              <p className="text-slate-600 leading-relaxed">
                Today, our team has grown, but that core philosophy remains. We've served over 500+ families in Bristol, UK, ensuring that quality and reliability are never compromised. 
              </p>
              
              <div className="grid grid-cols-2 gap-6 pt-6">
                <div className="p-6 bg-white shadow-sm rounded-2xl border border-slate-100">
                  <h4 className="text-orange-600 text-3xl font-black mb-1">500+</h4>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Active Clients</p>
                </div>
                <div className="p-6 bg-white shadow-sm rounded-2xl border border-slate-100">
                  <h4 className="text-orange-600 text-3xl font-black mb-1">100%</h4>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Satisfaction</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- MEET THE STAFF --- */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Our Professional Staff</h2>
            <p className="text-slate-500 mt-2 font-medium">The experts behind the sparkle</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {staff.map((member, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group"
              >
                <div className="relative overflow-hidden rounded-2xl mb-6 shadow-md max-w-[320px] mx-auto">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full h-64 object-cover md:grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-center">
                    <h4 className="text-lg font-bold text-slate-900 mb-1">{member.name}</h4>
                    <p className="text-orange-600 text-[10px] font-black uppercase tracking-widest mb-3">{member.role}</p>
                    <p className="text-slate-500 text-xs leading-relaxed mb-4 px-4">{member.bio}</p>
                    <div className="flex justify-center gap-4 text-slate-400">
                    <FaLinkedin className="hover:text-orange-600 cursor-pointer transition-colors" />
                    <FaTwitter className="hover:text-orange-600 cursor-pointer transition-colors" />
                    </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- MISSION & VISION WRITEUP --- */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-8 text-slate-900">Our Unwavering <span className="text-orange-600 italic">Mission</span></h2>
            <p className="text-lg text-slate-700 leading-relaxed mb-6 font-medium">
              At BristolClean, our mission extends far beyond simply removing dust and grime. We are committed to redefining the standard of domestic and commercial care across Lincolnshire. 
            </p>
            <p className="text-slate-500 leading-relaxed italic border-l-4 border-orange-500 pl-6 text-left max-w-2xl mx-auto">
              "We believe that every environment we touch should be a sanctuary. By combining rigorous hospital-grade sanitization with the warmth of a local, family-owned touch, we ensure that your space isn't just clean—it's BristolClean."
            </p>
          </motion.div>
        </div>
      </section>

      {/* --- CONTACT & INFO --- */}
      <section className="py-20 px-6 bg-slate-900">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            <a href="mailto:hello@Bristolclean.co.uk" className="flex flex-col items-center text-center p-8 bg-white/5 rounded-3xl border border-white/5 hover:border-orange-500/30 transition-all group">
                <div className="w-14 h-14 bg-orange-600 text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FaEnvelope size={24} />
                </div>
                <h4 className="font-bold text-white text-lg mb-2">Email Us</h4>
                <p className="text-slate-400 text-sm italic">hello@Bristolclean.co.uk</p>
            </a>

            <a href="tel:+441234567890" className="flex flex-col items-center text-center p-8 bg-white/5 rounded-3xl border border-white/5 hover:border-orange-500/30 transition-all group">
                <div className="w-14 h-14 bg-orange-600 text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FaPhoneAlt size={24} />
                </div>
                <h4 className="font-bold text-white text-lg mb-2">Call Support</h4>
                <p className="text-slate-400 text-sm italic">+44 1234 567890</p>
            </a>

            <button onClick={() => router.push('/location')} className="flex flex-col items-center text-center p-8 bg-white/5 rounded-3xl border border-white/5 hover:border-orange-500/30 transition-all group">
                <div className="w-14 h-14 bg-orange-600 text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FaMapMarkerAlt size={24} />
                </div>
                <h4 className="font-bold text-white text-lg mb-2">Our Office</h4>
                <p className="text-slate-400 text-sm italic">Market Place, Bristol PE21</p>
            </button>
        </div>
      </section>

      {/* --- RESTORED CTA (ORIGINAL DARK/GLOW STYLE) --- */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto bg-orange-500 rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/20 blur-[120px] -mr-48 -mt-48" />
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-600/10 blur-[100px] -ml-32 -mb-32" />
           
           <h2 className="text-3xl md:text-5xl font-black text-white mb-6 uppercase tracking-tighter relative z-10">
             Ready for a <span className="text-black italic">Fresh</span> Start?
           </h2>
           <p className="text-slate-200 mb-10 font-medium max-w-xl mx-auto relative z-10">
             Join over 500+ satisfied clients in Bristol and experience the difference of professional care.
           </p>
           <button className="px-10 py-4 bg-black text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-900 transition-all shadow-xl shadow-orange-600/40 relative z-10">
             Book Your Clean Now
           </button>
        </div>
      </section>
    </div>
  );
}