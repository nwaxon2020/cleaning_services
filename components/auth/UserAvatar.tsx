"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSignOutAlt,
  FaCamera,
  FaEnvelope,
  FaUser,
} from "react-icons/fa";
import { auth, storage } from "@/lib/firebase";
import {
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import toast from "react-hot-toast";

const UserAvatar = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hoverImage, setHoverImage] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // 🔹 Listen for auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 🔹 Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔹 Sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully");
      setIsOpen(false);
      router.push("/");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  // 🔹 Upload profile image
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);

    try {
      const storageRef = ref(storage, `profile-images/${user.uid}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      await updateProfile(user, { photoURL });

      setUser({ ...user, photoURL });
      toast.success("Profile image updated!");
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 If not logged in
  if (!user) {
    return (
      <button
        onClick={() => router.push("/login")}
        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105"
      >
        Sign In
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="focus:outline-none"
      >
        <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-orange-500 hover:border-orange-600 transition-all">
          {user.photoURL ? (
            <Image
              src={user.photoURL}
              alt={user.displayName || "User"}
              fill
              sizes="40px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-500 to-orange-500 flex items-center justify-center text-white text-lg font-bold">
              {user.displayName?.[0] ||
                user.email?.[0] ||
                "U"}
            </div>
          )}
        </div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200"
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-green-500 to-orange-500">
              <div className="flex items-center space-x-4">
                <div
                  className="relative w-16 h-16 rounded-full overflow-hidden border-4 border-white"
                  onMouseEnter={() => setHoverImage(true)}
                  onMouseLeave={() => setHoverImage(false)}
                >
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
                      {user.displayName?.[0] ||
                        user.email?.[0] ||
                        "U"}
                    </div>
                  )}

                  {/* Hover upload overlay (desktop) */}
                  <AnimatePresence>
                    {hoverImage && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer md:flex hidden"
                        onClick={() =>
                          fileInputRef.current?.click()
                        }
                      >
                        <FaCamera className="text-white text-xl" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Mobile upload button */}
                  <button
                    className="absolute bottom-0 right-0 bg-orange-500 rounded-full p-1 md:hidden"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                  >
                    <FaCamera className="text-white text-xs" />
                  </button>
                </div>

                <div className="flex-1 text-white">
                  <p className="font-semibold truncate">
                    {user.displayName || "User"}
                  </p>
                  <p className="text-sm opacity-90 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
              <div className="flex items-center space-x-3 text-gray-700">
                <FaEnvelope className="text-green-500" />
                <span className="text-sm truncate">
                  {user.email}
                </span>
              </div>

              {user.displayName && (
                <div className="flex items-center space-x-3 text-gray-700">
                  <FaUser className="text-orange-500" />
                  <span className="text-sm">
                    {user.displayName}
                  </span>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />

              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
              >
                <FaSignOutAlt />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserAvatar;