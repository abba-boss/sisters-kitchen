import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search, ChefHat } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';

export default function NotFoundPage() {
  return (
    <MainLayout>
      <div className="page-container py-24 flex flex-col items-center justify-center text-center min-h-[60vh]">
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-6"
        >
          <ChefHat size={44} className="text-primary" />
        </motion.div>
        <h1 className="font-poppins font-bold text-6xl text-brand-dark mb-2">404</h1>
        <p className="text-xl font-semibold text-brand-dark mb-2">Page not found</p>
        <p className="text-brand-muted mb-8 max-w-sm">
          Looks like this dish has sold out. The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/" className="btn-primary flex items-center gap-2">
            <Home size={16} /> Back to Home
          </Link>
          <Link to="/products" className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-orange-100 text-brand-dark font-semibold hover:border-primary/30 hover:text-primary transition-colors">
            <Search size={16} /> Browse Food
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
