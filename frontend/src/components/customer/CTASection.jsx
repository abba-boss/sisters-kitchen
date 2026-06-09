import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChefHat, ArrowRight } from 'lucide-react';

export default function CTASection() {
  const navigate = useNavigate();
  return (
    <section className="bg-brand-dark py-16 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent rounded-full blur-3xl" />
      </div>
      <div className="page-container relative text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-5">
            <ChefHat size={28} className="text-white" />
          </div>
          <h2 className="font-poppins font-bold text-3xl md:text-4xl text-white mb-4">
            Are You a Food Vendor?
          </h2>
          <p className="text-white/60 max-w-lg mx-auto mb-8 leading-relaxed">
            Turn your passion for cooking into a thriving business. Join hundreds of female vendors 
            already earning on Sisters Kitchen.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
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
      </div>
    </section>
  );
}
