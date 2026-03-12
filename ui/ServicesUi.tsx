"use client";

import { useState, useEffect } from 'react';
// Importing individual components
import CleaningService from '@/components/cleaningServices/CleaningServicesUi';
import RentalsService from '@/components/rentalsService/RentalsService';
import DecorationService from '@/components/decorationService/DecorationService';
import HealthService from '@/components/healthService/HealthService';

export default function ServicesPageUi() {
  // Initialize with a default, but we will update it in useEffect
  const [activeTab, setActiveTab] = useState('cleaning');
  const [isHydrated, setIsHydrated] = useState(false);

  // 1. On Mount: Load the saved tab from LocalStorage
  useEffect(() => {
    const savedTab = localStorage.getItem('lastVisitedServiceTab');
    if (savedTab) {
      setActiveTab(savedTab);
    }
    setIsHydrated(true); // Tell React we are ready to show the saved state
  }, []);

  // 2. On Change: Save the new tab to LocalStorage
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    localStorage.setItem('lastVisitedServiceTab', tabId);
  };

  const renderService = () => {
    // Prevent flickering/mismatch during initial load
    if (!isHydrated) return null; 

    switch (activeTab) {
      case 'cleaning': return <CleaningService />;
      case 'rentals': return <RentalsService />;
      case 'decoration': return <DecorationService />;
      case 'health': return <HealthService />;
      default: return <CleaningService />;
    }
  };

  const tabs = [
    { id: 'cleaning', label: 'Cleaning Services' },
    { id: 'rentals', label: 'Rentals Services' },
    { id: 'decoration', label: 'Decoration Services' },
    { id: 'health', label: 'Health Services' },
  ];

  return (
    <div className="pt-25 pb-18 mx-auto">
      {/* Navigation Buttons */}
      <div className="bg-white/90 z-20 sticky top-17 flex flex-wrap gap-4 mb-8 border-b border-orange-200 py-4 justify-center">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)} // Use the new handler
            className={`px-6 py-2 rounded-full font-black uppercase text-[10px] tracking-widest transition-all duration-300 ${
              activeTab === tab.id 
              ? 'bg-gray-900 text-white shadow-lg' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Service Content Area */}
      <div className="-mt-8 animate-in fade-in blur-in duration-500">
        {renderService()}
      </div>
    </div>
  );
}