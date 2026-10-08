import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HomeNewsletter() {
  const [email, setEmail] = useState('');

  const onSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success('Thanks! You are on the list.');
    setEmail('');
  };

  return (
    <section className="py-10 bg-[#FFF6EE]">
      <div className="page-container">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl bg-white border border-orange-100 shadow-card p-6 sm:p-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold bg-orange-100 text-orange-600 rounded-full px-3 py-1 mb-3">
                <Mail size={12} />
                Weekly Food Drops
              </div>
              <h3 className="font-poppins font-bold text-2xl text-brand-dark">Get fresh menus and exclusive deals first</h3>
              <p className="text-sm text-brand-muted mt-2 max-w-xl">
                Every week we share top homemade dishes, new vendors, and reward offers across Nigeria.
              </p>
            </div>

            <form onSubmit={onSubmit} className="w-full lg:w-[440px]">
              <div className="flex items-center gap-2 bg-brand-bg border border-orange-100 rounded-2xl p-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 bg-transparent px-3 py-2 text-sm text-brand-dark placeholder-brand-muted focus:outline-none"
                />
                <button type="submit" className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors inline-flex items-center gap-1.5">
                  Subscribe <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
