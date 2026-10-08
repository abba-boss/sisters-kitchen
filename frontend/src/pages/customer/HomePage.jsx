import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import StoriesCarousel from '../../components/social/StoriesCarousel';
import WhatsCooking from '../../components/customer/WhatsKooking';
import HomeTrending from '../../components/customer/HomeTrending';
import SEOHead from '../../components/common/SEOHead';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <AppLayout hideFooter>
      <SEOHead 
        title="Sisters Kitchen - Fresh Homemade Food from Local Women Vendors"
        description="Order delicious homemade food from amazing local women chefs. Support female entrepreneurs while enjoying authentic, fresh meals delivered to your door."
      />
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden mb-6 h-[240px] bg-gradient-to-br from-primary via-orange-500 to-orange-600"
      >
        <img
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400&h=400&fit=crop"
          alt="Delicious meals"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30"
        />
        <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-10">
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full mb-2 w-fit border border-white/30"
          >
            🔥 CELEBRATING WITH FLAVOR
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="font-poppins font-bold text-white text-2xl md:text-3xl lg:text-4xl mb-2 leading-tight max-w-lg"
          >
            Delicious meals, made by amazing women
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="text-white/90 text-sm mb-4 max-w-md"
          >
            Support local, eat fresh, feel happy.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex gap-3"
          >
            <button
              onClick={() => navigate('/products')}
              className="bg-white text-primary font-semibold px-5 py-2.5 rounded-xl hover:bg-orange-50 transition-all shadow-lg text-sm flex items-center gap-2"
            >
              Order Now <ChevronRight size={16} />
            </button>
            <button
              onClick={() => navigate('/vendors')}
              className="bg-white/20 backdrop-blur-sm text-white font-semibold px-5 py-2.5 rounded-xl border border-white/30 hover:bg-white/30 transition-all text-sm"
            >
              Explore Vendors
            </button>
          </motion.div>
        </div>
      </motion.div>

      {/* Stories */}
      <div className="mb-6">
        <h2 className="font-poppins font-semibold text-base text-brand-dark mb-3">Stories</h2>
        <StoriesCarousel />
      </div>

      {/* What's Cooking Today */}
      <WhatsCooking />

      {/* Recommended for you */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-poppins font-semibold text-lg text-brand-dark">Recommended for you</h2>
          <button
            onClick={() => navigate('/products')}
            className="text-sm text-primary font-semibold hover:underline"
          >
            View all
          </button>
        </div>
        <HomeTrending />
      </div>
    </AppLayout>
  );
}
