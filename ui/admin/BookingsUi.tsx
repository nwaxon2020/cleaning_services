"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { FaTrash, FaCheck, FaTimes, FaSearch, FaFilter } from 'react-icons/fa';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function AdminBookingsUi() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchBookings();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, 'bookings', id), { status });
    toast.success(`Booking ${status}`);
    setBookings(bookings.map(b => b.id === id ? {...b, status} : b));
  };

  if (loading) return <div className="text-white">Loading Bookings...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Bookings</h1>
      <div className="grid gap-4">
        {bookings.filter(b => b.userName?.toLowerCase().includes(searchTerm.toLowerCase())).map((b) => (
          <div key={b.id} className="bg-zinc-900 border border-white/5 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-white font-bold">{b.userName}</p>
              <p className="text-zinc-500 text-xs uppercase tracking-widest">{b.service} — {b.date}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${b.status === 'confirmed' ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500'}`}>
                {b.status}
              </span>
              <button onClick={() => updateStatus(b.id, 'confirmed')} className="p-2 bg-green-500/10 text-green-500 rounded-lg"><FaCheck/></button>
              <button onClick={() => updateStatus(b.id, 'cancelled')} className="p-2 bg-red-500/10 text-red-500 rounded-lg"><FaTimes/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}