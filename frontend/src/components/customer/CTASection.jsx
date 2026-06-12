import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChefHat, ArrowRight, CheckCircle } from 'lucide-react';

const PERKS = [
  'Free to join — no monthly fees',
  'Keep 90% of every sale',
  'Real-time order notifications',
  'Your own branded store page',
];

export default function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="bg-brand-dark py-16 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20  rounded-full blur-3xl" />
      </div>

      <div className="page-container relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0  }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-5 shadow-soft">
              <ChefHat size={26} className="text-white" />
            </div>

            <h2 className="font-poppins font-bold text-3xl md:text-4xl text-white mb-4 leading-tight">
              Turn Your Kitchen Into<br />
              <span className="text-primary">a Business</span>
            </h2>

            <p className="text-white/60 text-base leading-relaxed mb-7 max-w-md">
              Join hundreds of talented female vendors already earning on Sisters Kitchen.
              Set up your store in minutes and start receiving orders today.
            </p>

            {/* Perks list */}
            <ul className="space-y-2.5 mb-8">
              {PERKS.map((perk) => (
                <li key={perk} className="flex items-center gap-2.5 text-white/80 text-sm">
                  <CheckCircle size={16} className="text-accent flex-shrink-0" />
                  {perk}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/register?role=vendor')}
                className="bg-primary text-white font-semibold px-8 py-3.5 rounded-2xl hover:bg-primary-dark transition-all flex items-center gap-2 shadow-soft"
              >
                Start Selling Today <ArrowRight size={18} />
              </button>
              <button
                onClick={() => navigate('/products')}
                className="bg-white/10 text-white font-semibold px-8 py-3.5 rounded-2xl hover:bg-white/20 transition-all border border-white/20"
              >
                Explore Food
              </button>
            </div>
          </motion.div>

          {/* Right — stats cards */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="grid grid-cols-2 gap-4"
          >
            {[
              { emoji: '🏪', value: '12+',    label: 'Active Vendors',      sub: 'and growing daily'    },
              { emoji: '🍽️', value: '65+',    label: 'Dishes Available',   sub: 'fresh every day'      },
              { emoji: '⭐', value: '4.9/5',  label: 'Customer Rating',     sub: 'across all orders'    },
              { emoji: '📦', value: '35+',    label: 'Orders Completed',    sub: 'since launch'         },
            ].map(({ emoji, value, label, sub }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:bg-white/15 transition-colors"
              >
                <div className="text-3xl mb-2">{emoji}</div>
                <p className="font-poppins font-bold text-2xl text-white">{value}</p>
                <p className="text-sm font-medium text-white/80 mt-0.5">{label}</p>
                <p className="text-xs text-white/40 mt-0.5">{sub}</p>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  );
}
