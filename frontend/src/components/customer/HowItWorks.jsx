import { motion } from 'framer-motion';
import { Search, ShoppingCart, Clock, Smile } from 'lucide-react';

const steps = [
  { icon: Search, title: 'Browse & Discover', desc: 'Explore hundreds of homemade dishes from verified female vendors near you.', color: 'bg-primary/10', iconColor: 'text-primary' },
  { icon: ShoppingCart, title: 'Add to Cart', desc: 'Select your favourite meals, customise quantities, and add them to your cart.', color: 'bg-accent/10', iconColor: 'text-accent' },
  { icon: Clock, title: 'Vendor Prepares', desc: 'Your chosen vendor receives the order and freshly prepares it just for you.', color: 'bg-yellow-100', iconColor: 'text-yellow-600' },
  { icon: Smile, title: 'Enjoy your Meal', desc: 'Get your food delivered or pick it up. Eat, rate, and share the love!', color: 'bg-pink-100', iconColor: 'text-pink-500' },
];

export default function HowItWorks() {
  return (
    <section className="bg-white py-16">
      <div className="page-container">
        <div className="text-center mb-12">
          <h2 className="section-title mb-2">How It Works</h2>
          <p className="text-brand-muted max-w-md mx-auto">Ordering homemade food has never been this easy</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map(({ icon: Icon, title, desc, color, iconColor }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative text-center"
            >
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[60%] w-full h-0.5 border-t-2 border-dashed border-orange-100" />
              )}
              <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center mx-auto mb-4 relative`}>
                <Icon size={28} className={iconColor} />
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-poppins font-semibold text-brand-dark mb-2">{title}</h3>
              <p className="text-sm text-brand-muted leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
