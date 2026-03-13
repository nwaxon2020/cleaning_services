"use client";

import Link from 'next/link';
import { 
  FaInfoCircle, FaPhone, FaImages } from 'react-icons/fa';
import { motion } from 'framer-motion';

const settingsCards = [
  {
    id: 'contact',
    title: 'Site & Contact Settings',
    description: 'Manage phone/email/office location/CEO contact/Site name/logo/Image sliders e.t.c',
    icon: FaPhone,
    color: 'from-green-500 to-green-600',
    href: '/admin/settings/contact'
  },
  {
    id: 'about',
    title: 'About Page Editor',
    description: 'Edit hero slides, timeline, staff, mission statement and all about page content',
    icon: FaInfoCircle,
    color: 'from-blue-500 to-blue-600',
    href: '/admin/settings/about'
  },
  {
    id: 'slides',
    title: 'FAQ & Policy',
    description: 'Upload and manage slideshow images used across the website',
    icon: FaImages,
    color: 'from-purple-500 to-purple-600',
    href: '/admin/settings/faq&policy'
  },
];

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
            Settings <span className="text-orange-600">Dashboard</span>
          </h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">
            Manage all your website content from one central location
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Link href={card.href} key={card.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                >
                  <div className={`h-2 bg-gradient-to-r ${card.color}`} />
                  <div className="p-6">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{card.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{card.description}</p>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}