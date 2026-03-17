"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineArrowRight, HiNewspaper } from "react-icons/hi";

const categories = ["all", "transportation", "sports", "government", "cleaning"];

interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  image: string;
}

const NewsUpdates = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchNews = async (cat: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/news?category=${cat}`);
      const data = await res.json();
      setNews(data);
    } catch (e) {
      console.error("News fetch failed");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNews(activeTab);
  }, [activeTab]);

  return (
    <section className="w-full bg-white py-16 px-4 md:px-8 border-t border-gray-100">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-zinc-900 uppercase tracking-tight mb-2">
              Local <span className="text-orange-500 underline decoration-zinc-100 underline-offset-4">Updates</span>
            </h2>
            <p className="text-zinc-500 text-sm font-medium italic">Latest headlines from Bristol & UK</p>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === cat
                    ? "bg-zinc-900 text-white shadow-xl shadow-zinc-200"
                    : "bg-zinc-50 text-zinc-400 hover:bg-zinc-100 border border-zinc-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Responsive Grid: Desktop 4 cols (2 rows), Mobile 1 col */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence mode="wait">
            {loading ? (
              // Skeleton Loading State
              [...Array(8)].map((_, i) => (
                <div key={i} className="h-72 bg-zinc-50 rounded-xl animate-pulse" />
              ))
            ) : (
              news.map((item, index) => (
                <motion.a
                  key={item.url}
                  href={item.url}
                  target="_blank"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-white border border-zinc-100 rounded-xl overflow-hidden hover:shadow-2xl hover:shadow-zinc-200 transition-all duration-300 flex flex-col"
                >
                  {/* Image Holder */}
                  <div className="relative h-44 w-full overflow-hidden bg-zinc-100">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-500"
                    />
                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-[9px] font-black text-zinc-900 uppercase tracking-tighter">
                      {item.source}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-zinc-900 font-bold text-sm leading-snug line-clamp-2 mb-3 group-hover:text-orange-500 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-zinc-500 text-[11px] leading-relaxed line-clamp-3 mb-4">
                      {item.description}
                    </p>
                    <div className="mt-auto pt-4 border-t border-zinc-50 flex items-center justify-between">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                        <HiNewspaper className="text-orange-500" /> Source Info
                      </span>
                      <HiOutlineArrowRight className="text-zinc-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </motion.a>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Footer Info */}
        {!loading && (
          <div className="mt-12 text-center">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.4em]">
              Stay informed • BristolClean Community News
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default NewsUpdates;