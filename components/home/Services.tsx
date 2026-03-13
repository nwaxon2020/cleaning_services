"use client";
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { FaSprayCan, FaTruckLoading, FaPaintRoller, FaHeartbeat } from 'react-icons/fa';
import { HiArrowRight } from 'react-icons/hi';

const services = [
  {
    icon: FaSprayCan,
    title: 'Cleaning Services',
    category: 'cleaning',
    description: 'Professional home and office cleaning tailored to your schedule.',
    price: '£35',
    unit: '/hr',
    color: 'bg-green-500',
    image: '/cleaning.jpg',
  },
  {
    icon: FaTruckLoading,
    title: 'Rental Services',
    category: 'rentals',
    description: 'Premium material hire for your projects and events.',
    price: 'Daily',
    unit: 'Rates',
    color: 'bg-blue-500',
    image: '/rental.png',
  },
  {
    icon: FaPaintRoller,
    title: 'Decoration Services',
    category: 'decoration',
    description: 'Transform your space with our professional decoration expertise.',
    price: 'Expert',
    unit: 'Quotes',
    color: 'bg-purple-500',
    image: '/decoration.jpg',
  },
  {
    icon: FaHeartbeat,
    title: 'Health Services',
    category: 'health',
    description: 'High-quality medical and health concierge services.',
    price: 'Premium',
    unit: 'Care',
    color: 'bg-emerald-600',
    image: '/health.png',
  }
];

const Services = () => {
  const router = useRouter();

  const handleServiceClick = (category: string) => {
    // 1. Set the LocalStorage so the Services page knows which tab to open
    localStorage.setItem('lastVisitedServiceTab', category);
    // 2. Navigate to the services page
    router.push('/services');
  };

  return (
    <section className="py-16 md:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-2 md:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          whileInView={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6 }} 
          viewport={{ once: true }} 
          className="text-center mb-8 md:mb-16"
        >
          <span className="text-orange-600 font-bold tracking-widest uppercase text-sm mb-3 block">Our Expertise</span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">Our <span className="text-orange-500">Services</span></h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
          {services.map((service, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5, delay: index * 0.1 }} 
              viewport={{ once: true }} 
              className="group bg-white mb-6 md:mb-0 md:rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer"
              onClick={() => handleServiceClick(service.category)}
            >
              <div className="relative h-48 overflow-hidden">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 z-10 transition-colors duration-500" />
                <motion.img 
                  whileHover={{ scale: 1.1 }} 
                  src={service.image} 
                  alt={service.title} 
                  className="w-full h-full object-cover" 
                />
                <div className={`absolute bottom-4 left-4 z-10 w-8 h-8 md:w-12 md:h-12 rounded-lg ${service.color} text-white flex items-center justify-center shadow-lg`}>
                  <service.icon size={20} />
                </div>
              </div>

              <div className="p-3 md:p-8">
                <h3 className="text-xs md:text-xl font-black text-slate-900 mb-2 group-hover:text-orange-600 transition-colors uppercase italic tracking-tighter">
                  {service.title}
                </h3>
                <p className="text-slate-500 text-[10px] md:text-sm mb-2 md:mb-6 line-clamp-2">
                  {service.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl md:text-2xl font-black text-slate-900">{service.price}</span>
                    <span className="text-slate-400 text-[9px] font-bold uppercase">{service.unit}</span>
                  </div>

                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                    <HiArrowRight />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;