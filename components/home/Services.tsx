"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FaHome, FaBuilding, FaCouch, FaLeaf } from 'react-icons/fa';
import { HiArrowRight } from 'react-icons/hi';

const services = [
  {
    icon: FaHome,
    title: 'Home Cleaning',
    description: 'Regular home cleaning tailored to your schedule and lifestyle.',
    price: '£40',
    unit: '/hr',
    color: 'bg-green-500',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRfn9hZlr4bE0U7WBnhldu64gTfL8Z0dNuKSA&s', // Replace with your image paths
  },
  {
    icon: FaBuilding,
    title: 'Office Cleaning',
    description: 'Professional cleaning for a healthier, more productive workspace.',
    price: '£35',
    unit: '/hr',
    color: 'bg-orange-500',
    image: 'https://thecleanstart.com/wp-content/uploads/2021/05/commercial-office-cleaning.jpg',
  },
  {
    icon: FaCouch,
    title: 'Deep Cleaning',
    description: 'A thorough top-to-bottom refresh of your entire property.',
    price: '£50',
    unit: '/hr',
    color: 'bg-blue-500',
    image: 'https://img.freepik.com/free-photo/professional-cleaning-service-person-using-steam-cleaner-office_23-2150520644.jpg?semt=ais_rp_progressive&w=740&q=80',
  },
  {
    icon: FaLeaf,
    title: 'Eco-Friendly',
    description: 'Safe for kids, pets, and the planet using green products.',
    price: '£42',
    unit: '/hr',
    color: 'bg-emerald-600',
    image: 'https://i.guim.co.uk/img/media/b6bb78245a61c61fd659e4a06b34f32eab94241a/0_0_4129_2771/master/4129.jpg?width=465&dpr=1&s=none&crop=none',
  }
];

const Services = () => {
  return (
    <section className="py-16 md:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-2 md:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-8 md:mb-16"
        >
          <span className="text-orange-600 font-bold tracking-widest uppercase text-sm mb-3 block">
            Our Expertise
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">
            Our <span className="text-orange-500">Services</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Experience premium cleaning solutions with a personal touch. 
            We make your space shine so you can focus on what matters.
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group bg-white mb-6 md:mb-0 md:rounded-xl overflow-hidden shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] transition-all duration-500"
            >
              {/* Image Container */}
              <div className="relative h-48 overflow-hidden">
                <div className={`absolute inset-0 bg-black/20 group-hover:bg-black/10 z-10 transition-colors duration-500`} />
                <motion.div
                   whileHover={{ scale: 1.1 }}
                   transition={{ duration: 0.6 }}
                   className="h-full w-full"
                >
                  <img 
                    src={service.image} 
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
                
                {/* Floating Icon */}
                <div className={`absolute bottom-4 left-4 z-10 w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl ${service.color} text-white flex items-center justify-center shadow-lg`}>
                   <service.icon size={20} />
                </div>
              </div>

              {/* Content */}
              <div className="p-3 md:p-8">
                <h3 className="md:text-xl font-black text-slate-900 mb-2 md:mb-3 group-hover:text-orange-600 transition-colors">
                  {service.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-2 md:mb-6 line-clamp-2">
                  {service.description}
                </p>
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl md:text-2xl font-black text-slate-900">{service.price}</span>
                    <span className="text-slate-400 text-xs font-bold uppercase">{service.unit}</span>
                  </div>
                  
                  <Link 
                    href="/services"
                    className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300"
                  >
                    <HiArrowRight />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-center mt-6 md:mt-16"
        >
          <Link 
            href="/services"
            className="inline-flex items-center gap-2 font-bold text-slate-900 hover:text-orange-600 transition-colors border-b-2 border-orange-500/20 hover:border-orange-500 pb-1"
          >
            See all special offers <HiArrowRight />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default Services;