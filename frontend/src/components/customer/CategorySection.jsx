import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { categoryService } from '../../services/categoryService';

const FALLBACK_CATEGORIES = [
  { id: '1', name: 'Rice & Stew', icon: '🍛', color: '#FFF0EB' },
  { id: '2', name: 'Shawarma', icon: '🌯', color: '#FFF0EB' },
  { id: '3', name: 'Pizza', icon: '🍕', color: '#F0FFF4' },
  { id: '4', name: 'Burgers', icon: '🍔', color: '#FFF0EB' },
  { id: '5', name: 'Cakes', icon: '🎂', color: '#F0F4FF' },
  { id: '6', name: 'Smoothies', icon: '🥤', color: '#F0FFF4' },
  { id: '7', name: 'Snacks', icon: '🍟', color: '#FFFBF0' },
  { id: '8', name: 'Fruits', icon: '🍓', color: '#FFF0F0' },
];

export default function CategorySection() {
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const navigate = useNavigate();

  useEffect(() => {
    categoryService.getAll().then(({ data }) => {
      if (data.data?.length) setCategories(data.data);
    }).catch(() => {});
  }, []);

  return (
    <section className="page-container py-14">
      <div className="text-center mb-10">
        <h2 className="section-title mb-2">Browse by Category</h2>
        <p className="text-brand-muted">Find exactly what you're craving today</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        {categories.map((cat, i) => (
          <motion.button
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4, scale: 1.02 }}
            onClick={() => navigate(`/products?category=${cat.id}`)}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all group"
          >
            <div className="text-3xl mb-1">{cat.icon || '🍽️'}</div>
            <span className="text-xs font-semibold text-brand-dark text-center leading-tight group-hover:text-primary transition-colors">
              {cat.name}
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
