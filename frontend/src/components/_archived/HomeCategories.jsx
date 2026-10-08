import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { categoryService } from '../../services/categoryService';

const FALLBACK_CATS = [
  { id:'1', name:'Rice & Meals',     icon:'🍛' },
  { id:'2', name:'Soups & Stews',    icon:'🥘' },
  { id:'3', name:'Snacks',           icon:'🍟' },
  { id:'4', name:'Drinks',           icon:'🥤' },
  { id:'5', name:'Cakes & Pastries', icon:'🎂' },
  { id:'6', name:'Fruits',           icon:'🍓' },
  { id:'7', name:'Local Dishes',     icon:'🍲' },
  { id:'8', name:'More',             icon:'➕', isMore: true },
];

export default function HomeCategories() {
  const [categories, setCategories] = useState(FALLBACK_CATS);
  const [selected,   setSelected]   = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    categoryService.getAll()
      .then(({ data }) => {
        const cats = data.data || [];
        if (cats.length) {
          const mapped = cats.slice(0, 7).map((c) => ({
            id: c.id, name: c.name, icon: c.icon || '🍽️',
          }));
          setCategories([...mapped, { id:'more', name:'More', icon:'➕', isMore: true }]);
        }
      })
      .catch(() => {});
  }, []);

  const handleSelect = (cat) => {
    if (cat.isMore) { navigate('/products'); return; }
    setSelected(cat.id === selected ? null : cat.id);
    navigate(`/products?category=${cat.id}`);
  };

  return (
    <section className="py-8 bg-white">
      <div className="page-container">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-poppins font-bold text-xl text-brand-dark">Browse by Category</h2>
          <button onClick={() => navigate('/products')}
            className="flex items-center gap-1 text-primary text-sm font-semibold hover:underline">
            See all <ChevronRight size={14} />
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {categories.map((cat, i) => (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => handleSelect(cat)}
              className={`flex-shrink-0 flex flex-col items-center gap-2 px-4 py-3 rounded-2xl border-2 transition-all min-w-[72px] ${
                selected === cat.id
                  ? 'border-primary bg-primary/5 shadow-soft'
                  : 'border-orange-100 bg-white hover:border-primary/50 hover:bg-primary/5'
              }`}
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className={`text-xs font-semibold text-center leading-tight ${
                selected === cat.id ? 'text-primary' : 'text-brand-dark'
              }`}>{cat.name}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
