"use client";

import { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/layout';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { FaTrash, FaStar, FaSearch } from 'react-icons/fa';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface Review {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export default function AdminReviewsUi() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    filterReviews();
  }, [searchTerm, reviews]);

  const fetchReviews = async () => {
    try {
      const reviewsRef = collection(db, 'reviews');
      const q = query(reviewsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const reviewsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Review[];
      setReviews(reviewsData);
      setFilteredReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const filterReviews = () => {
    if (searchTerm) {
      const filtered = reviews.filter(review =>
        review.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.comment?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredReviews(filtered);
    } else {
      setFilteredReviews(reviews);
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
      toast.success('Review deleted');
      fetchReviews();
    } catch (error) {
      toast.error('Failed to delete review');
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
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Manage Reviews</h1>
          <div className="text-right">
            <p className="text-sm text-gray-400">Total Reviews</p>
            <p className="text-2xl font-bold text-white">{reviews.length}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-primary pl-10"
          />
        </div>

        {/* Reviews Grid */}
        <div className="grid gap-4">
          {filteredReviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-effect rounded-lg p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-green-500 to-orange-500 flex-shrink-0">
                    {review.userPhoto ? (
                      <img
                        src={review.userPhoto}
                        alt={review.userName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold">
                        {review.userName[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-white">{review.userName}</h3>
                      <span className="text-sm text-gray-400">
                        {review.createdAt?.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={i < review.rating ? 'star-filled' : 'star-empty'}
                        />
                      ))}
                    </div>
                    <p className="text-gray-300">{review.comment}</p>
                  </div>
                </div>
                <button
                  onClick={() => deleteReview(review.id)}
                  className="p-2 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Delete"
                >
                  <FaTrash />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}