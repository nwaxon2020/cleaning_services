"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '@/lib/firebase';
import { 
  collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, 
  updateDoc, doc, setDoc, getDocs, writeBatch, 
} from 'firebase/firestore';
import { FaPaperPlane, FaTrash, FaUserCircle, FaHeadset, FaChevronLeft, FaExclamationTriangle, FaGoogle, FaEnvelope, FaTimes, FaLock } from 'react-icons/fa';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ChatUi() {
  const [user, setUser] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]); 
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"clear" | "contact">("clear");
  const [targetContactId, setTargetContactId] = useState<string | null>(null);
  const [adminPin, setAdminPin] = useState(""); 
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const ADMIN_ID = process.env.NEXT_PUBLIC_ADMIN_ID || '0dHC0QPxyTRuMiCVhiktIOlg2603';
  const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN; 
  
  // Guarded isAdmin check
  const isAdmin = user?.uid === ADMIN_ID;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      // FIX: Only authorize the user if they have an email address
      // This ignores the temporary phone-only session from the booking modal
      if (u && u.email) {
        setUser(u);
        if (u.uid !== ADMIN_ID) {
          setActiveRoomId(u.uid);
          setMobileView('chat');
        }
      } else {
        // Treat phone-only guests or logged-out states as "null"
        setUser(null);
        setActiveRoomId(null);
        setMessages([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [ADMIN_ID]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    const q = query(collection(db, "chats"), orderBy("lastTimestamp", "desc"));
    return onSnapshot(q, (snap) => {
      setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user, isAdmin]);

  useEffect(() => {
    if (!activeRoomId || !user) return;
    const roomRef = doc(db, "chats", activeRoomId);
    updateDoc(roomRef, { [isAdmin ? "unreadCountAdmin" : "unreadCountUser"]: 0 }).catch(() => {});
    const q = query(collection(db, "chats", activeRoomId, "messages"), orderBy("timestamp", "asc"));
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100);
    });
  }, [activeRoomId, user, isAdmin]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || !activeRoomId) return;
    const msgText = input;
    setInput("");
    const roomRef = doc(db, "chats", activeRoomId);
    const currentRoom = rooms.find(r => r.id === activeRoomId);
    const roomUpdate = {
      lastMessage: msgText,
      lastTimestamp: serverTimestamp(),
      userName: isAdmin ? (currentRoom?.userName || "Customer") : user.displayName,
      userPhoto: isAdmin ? (currentRoom?.userPhoto || "") : user.photoURL,
      [isAdmin ? "unreadCountUser" : "unreadCountAdmin"]: (currentRoom?.[isAdmin ? "unreadCountUser" : "unreadCountAdmin"] || 0) + 1
    };
    await setDoc(roomRef, roomUpdate, { merge: true });
    await addDoc(collection(db, "chats", activeRoomId, "messages"), {
      text: msgText,
      senderId: user.uid,
      timestamp: serverTimestamp()
    });
  };

  const handleDeleteAction = async () => {
    const targetId = deleteMode === "contact" ? targetContactId : activeRoomId;
    if (!targetId || !user) return;

    if (isAdmin) {
      if (adminPin !== ADMIN_PIN) {
        toast.error("Invalid Admin PIN");
        return;
      }
    }

    setShowDeleteConfirm(false);
    setAdminPin(""); 
    const load = toast.loading(deleteMode === "contact" ? "Deleting contact..." : "Clearing chat...");
    
    try {
      const msgSnap = await getDocs(collection(db, "chats", targetId, "messages"));
      const batch = writeBatch(db);
      msgSnap.docs.forEach(d => batch.delete(d.ref));
      
      if (deleteMode === "contact") {
        batch.delete(doc(db, "chats", targetId));
      } else {
        batch.update(doc(db, "chats", targetId), {
          lastMessage: "Conversation cleared",
          unreadCountAdmin: 0,
          unreadCountUser: 0
        });
      }

      await batch.commit();
      if (activeRoomId === targetId) {
        if (deleteMode === "contact") setActiveRoomId(null);
        setMessages([]);
      }
      toast.success(deleteMode === "contact" ? "Contact removed" : "Chat cleared", { id: load });
    } catch (e) { toast.error("Action failed", { id: load }); }
  };

  if (loading) return <div className="fixed inset-0 z-50 bg-black flex items-center justify-center text-orange-500 font-bold uppercase tracking-widest">Loading...</div>;

  return (
    <div className="fixed inset-0 bg-black md:bg-black/80 md:backdrop-blur-md pt-16 md:pt-24 pb-0 md:pb-6 md:px-4 z-[25] overflow-hidden font-sans">
      <div className="max-w-4xl mx-auto h-full md:h-[calc(100vh-120px)] flex flex-col md:flex-row rounded-none md:rounded-2xl overflow-hidden bg-[#0b141a] shadow-2xl relative border-none md:border md:border-white/10">
        
        <AnimatePresence>
          {!user && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[110] bg-black/95 flex items-center justify-center p-6 text-center"
            >
              <div className="max-w-xs w-full">
                <FaHeadset className="text-orange-500 text-5xl mx-auto mb-6" />
                <h3 className="text-white font-black uppercase text-xl mb-8">Support Center</h3>
                <button onClick={() => signInWithPopup(auth, new GoogleAuthProvider())} className="w-full flex items-center justify-center gap-3 py-4 bg-white text-black text-xs font-black uppercase rounded-xl hover:bg-gray-200 transition-all">
                  <FaGoogle /> Google Login
                </button>
                <Link href="/login" className="my-4 w-full flex items-center justify-center gap-3 py-4 bg-blue-800 text-white text-xs font-black uppercase rounded-xl hover:bg-blue-900 transition-all">
                  <FaEnvelope /> Email & Password
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`${isAdmin && mobileView === 'chat' ? 'hidden md:flex' : !isAdmin ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-white/5 bg-[#111b21] flex-col`}>
          <div className="p-4 border-b border-white/5 bg-[#202c33] flex justify-between items-center">
            <h2 className="text-white font-black uppercase text-sm italic">Boston<span className="text-orange-500">Chat</span></h2>
            <button onClick={() => router.back()} className="md:hidden text-zinc-500"><FaTimes /></button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isAdmin ? (
              rooms.length > 0 ? rooms.map(room => (
                <div key={room.id} onClick={() => { setActiveRoomId(room.id); setMobileView('chat'); }} className={`p-4 flex items-center gap-3 cursor-pointer border-b border-white/[0.02] transition-all group ${activeRoomId === room.id ? 'bg-[#202c33]' : 'hover:bg-[#202c33]/50'}`}>
                  <div className="relative">
                    <img src={room.userPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(room.userName)}`} className="w-12 h-12 rounded-full object-cover" alt="" />
                    {room.unreadCountAdmin > 0 && <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-[#111b21]">{room.unreadCountAdmin}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold truncate">{room.userName || "Customer"}</p>
                    <p className="text-zinc-500 text-xs truncate">{room.lastMessage}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteMode("contact"); setTargetContactId(room.id); setShowDeleteConfirm(true); }} className="opacity-100 md:opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-red-500 transition-all">
                    <FaTrash size={12} />
                  </button>
                </div>
              )) : (
                <div className="p-10 text-center text-zinc-600 text-[10px] font-bold uppercase tracking-widest">No active chats</div>
              )
            ) : (
              <div className="p-4 flex items-center gap-3 bg-[#202c33] text-white">
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center"><FaHeadset /></div>
                <div><p className="font-bold text-sm">Support Admin</p><p className="text-green-500 text-xs">● Online</p></div>
              </div>
            )}
          </div>
        </div>

        <div className={`${isAdmin && mobileView === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-[#0b141a]`}>
          {activeRoomId ? (
            <>
              <div className="p-3 border-b border-white/5 flex justify-between items-center bg-[#202c33] z-10">
                <div className="flex items-center gap-2">
                  {isAdmin && <button onClick={() => setMobileView('list')} className="md:hidden text-white p-2"><FaChevronLeft /></button>}
                  <span className="text-white font-black text-xs uppercase tracking-widest">{isAdmin ? rooms.find(r => r.id === activeRoomId)?.userName : 'Support Team'}</span>
                </div>
                <button onClick={() => { setDeleteMode("clear"); setShowDeleteConfirm(true); }} className="p-2 text-zinc-500 hover:text-red-500 transition-colors">
                  <FaTrash size={14} />
                </button>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                {messages.map((m) => (
                  /* Applied optional chaining here: user?.uid */
                  <div key={m.id} className={`flex ${m.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-[13px] ${m.senderId === user?.uid ? 'bg-[#005c4b] text-white rounded-tr-none' : 'bg-[#202c33] text-zinc-200 rounded-tl-none'}`}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={sendMessage} className="p-4 bg-[#202c33] flex gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-[#2a3942] border-none rounded-full px-6 py-3 text-white text-sm focus:outline-none" />
                <button type="submit" className="bg-orange-500 text-white w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition-all"><FaPaperPlane size={14}/></button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-700">
              <FaUserCircle size={80} className="mb-4 opacity-10" />
              <p className="uppercase tracking-[0.3em] text-[10px] font-black">Select a conversation</p>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[120] bg-black/90 flex items-center justify-center p-6 backdrop-blur-sm">
              <div className="max-w-xs w-full bg-[#202c33] border border-white/10 p-8 rounded-3xl text-center shadow-2xl">
                <FaExclamationTriangle className="text-orange-500 text-4xl mx-auto mb-4" />
                <h3 className="text-white font-black text-sm mb-2 uppercase">{deleteMode === "contact" ? "Delete Contact?" : "Wipe History?"}</h3>
                <p className="text-zinc-400 text-xs mb-4">{deleteMode === "contact" ? "This removes the contact and all their messages." : "This will delete all messages permanently."}</p>
                
                {isAdmin && (
                  <div className="relative mb-6">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xs" />
                    <input 
                      type="password" 
                      placeholder="Enter Admin PIN" 
                      value={adminPin}
                      onChange={(e) => setAdminPin(e.target.value)}
                      className="w-full bg-[#2a3942] border-none rounded-xl pl-10 pr-4 py-3 text-white text-xs outline-none ring-1 ring-white/10 focus:ring-orange-500/50"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <button onClick={handleDeleteAction} className="py-4 bg-red-600 text-white text-xs font-black uppercase rounded-xl">Confirm Action</button>
                  <button onClick={() => { setShowDeleteConfirm(false); setAdminPin(""); }} className="py-4 bg-zinc-800 text-zinc-400 text-xs font-black uppercase rounded-xl">Cancel</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}