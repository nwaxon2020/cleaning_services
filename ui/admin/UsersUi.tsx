"use client";

import { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/layout';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { FaEnvelope, FaCalendarAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export default function AdminUsersUi() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Note: You'll need to store user data in Firestore when they register
      // This is a simplified version - you might want to use Firebase Auth Admin SDK
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as User[];
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Users</h1>

        <div className="grid gap-4">
          {users.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-effect rounded-lg p-6"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-green-500 to-orange-500 flex-shrink-0">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold">
                      {user.displayName?.[0] || user.email?.[0] || 'U'}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">
                    {user.displayName || 'No name'}
                  </h3>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                    <div className="flex items-center space-x-1">
                      <FaEnvelope />
                      <span>{user.email}</span>
                    </div>
                    {user.createdAt && (
                      <div className="flex items-center space-x-1">
                        <FaCalendarAlt />
                        <span>Joined {user.createdAt.toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}