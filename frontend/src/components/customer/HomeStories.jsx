import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Plus } from 'lucide-react';
import { storyService } from '../../services/storyService';
import StoriesBar from '../social/StoriesBar';
import { useAuthStore } from '../../store/authStore';

export default function HomeStories() {
  return (
    <section className="bg-white py-5 border-b border-orange-50">
      <div className="page-container">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-poppins font-bold text-lg text-brand-dark">Stories</h2>
          <Link to="/feed" className="flex items-center gap-1 text-primary text-sm font-semibold hover:underline">
            See all <ChevronRight size={14} />
          </Link>
        </div>
      </div>
      {/* Reuse the fully-built StoriesBar component */}
      <StoriesBar />
    </section>
  );
}
