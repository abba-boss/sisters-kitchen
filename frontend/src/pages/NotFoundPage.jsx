import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';

export default function NotFoundPage() {
  return (
    <MainLayout>
      <div className="page-container page-shell flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32 }}
          className="state-panel text-center max-w-lg w-full"
        >
          <p className="eyebrow mb-4">Error 404</p>
          <h1 className="heading-page mb-3">Page not found</h1>
          <p className="text-brand-muted mb-8 leading-relaxed text-sm sm:text-base">
            Looks like this dish isn&apos;t on the menu. The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="btn-primary inline-flex items-center justify-center gap-2">
              <Home size={16} aria-hidden="true" /> Back to Home
            </Link>
            <Link to="/products" className="btn-secondary inline-flex items-center justify-center gap-2">
              <Search size={16} aria-hidden="true" /> Browse Food
            </Link>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
