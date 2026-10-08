import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { categoryService } from '../../services/categoryService';
import { useNavigate } from 'react-router-dom';

const FOOD_EMOJIS = {
  'Rice': '🍚',
  'Jollof Rice': '🍛',
  'Fried Rice': '🍛',
  'Soup': '🍲',
  'Pepper Soup': '🍲',
  'Snacks': '🍟',
  'Puff Puff': '🍩',
  'Drinks': '🥤',
  'Chapman': '🥤',
  'Desserts': '🍰',
  'Cake': '🎂',
  'Grills': '🍖',
  'Suya': '�串',
  'Chicken': '🍗',
  'Pasta': '🍝',
  'Spaghetti': '🍝',
  'Salads': '🥗',
  'Breakfast': '🍳',
  'Burgers': '🍔',
  'Pizza': '🍕',
  'Shawarma': '🌯',
  'Amala': '🍛',
  'Egusi': '🥘',
  'Beans': '🫘',
  'Moi Moi': '🫔',
  'Akara': '🍩',
  'Plantain': '🍌',
  'Yam': '🍠',
  'Fufu': '🥣',
  'Jollof': '🍛',
};

const FALLBACK_CATEGORIES = [
  { id: 'shawarma', name: 'Shawarma', emoji: '🌯' },
  { id: 'jollof', name: 'Jollof Rice', emoji: '🍛' },
  { id: 'pizza', name: 'Pizza', emoji: '🍕' },
  { id: 'fries', name: 'Fries', emoji: '🍟' },
  { id: 'burgers', name: 'Burgers', emoji: '🍔' },
  { id: 'cakes', name: 'Cakes', emoji: '🎂' },
  { id: 'drinks', name: 'Drinks', emoji: '🥤' },
  { id: 'healthy', name: 'Healthy', emoji: '🥗' },
];

export default function WhatsCooking({ onSelect, selectedId }) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryService.getAll()
      .then(({ data }) => {
        const cats = (data.data || []).map((cat) => ({
          ...cat,
          emoji: FOOD_EMOJIS[cat.name] || cat.icon || '🍽️',
        }));
        setCategories(cats.length > 0 ? cats : FALLBACK_CATEGORIES);
      })
      .catch(() => setCategories(FALLBACK_CATEGORIES))
      .finally(() => setLoading(false));
  }, []);

  const handleClick = (cat) => {
    if (onSelect) {
      onSelect(cat.id);
    } else {
      navigate(`/products?category=${cat.id}`);
    }
  };

  if (loading) {
    return (
      <section className="mb-6">
        <h2 className="font-poppins font-semibold text-base text-brand-dark mb-3">
          What's cooking today?
        </h2>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 text-center w-16">
              <div className="w-16 h-16 rounded-2xl bg-gray-200 animate-pulse" />
              <div className="mt-2 h-3 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6">
      <h2 className="font-poppins font-semibold text-base text-brand-dark mb-3">
        What's cooking today?
      </h2>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {categories.slice(0, 10).map((cat, i) => (
          <motion.button
            key={cat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => handleClick(cat)}
            className={`flex-shrink-0 text-center group ${
              selectedId === cat.id ? 'ring-2 ring-primary ring-offset-2 rounded-2xl' : ''
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-white border border-orange-100 flex items-center justify-center text-3xl group-hover:border-primary/30 group-hover:shadow-card transition-all">
              {cat.emoji}
            </div>
            <p className="text-xs font-medium text-brand-dark mt-2 truncate w-16">
              {cat.name}
            </p>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
