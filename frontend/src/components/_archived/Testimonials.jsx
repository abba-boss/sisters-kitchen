import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  { name: 'Amaka O.', location: 'Lagos', avatar: 'A', text: "Sisters Kitchen has changed how I eat. I get fresh jollof rice from Mama Ngozi every week. The taste is exactly like home cooking!", rating: 5 },
  { name: 'Fatima B.', location: 'Abuja', avatar: 'F', text: "As a busy working mom, this platform saves my day. The vendors are so friendly and the food always arrives fresh. Highly recommend!", rating: 5 },
  { name: 'Chisom E.', location: 'Port Harcourt', avatar: 'C', text: "I ordered a custom cake for my daughter's birthday and it was PERFECT. The vendor was so attentive and it tasted amazing!", rating: 5 },
  { name: 'Blessing A.', location: 'Enugu', avatar: 'B', text: "I love that I'm supporting women businesses while eating great food. The shawarma from Sisters Kitchen beats any fast food place!", rating: 5 },
];

export default function Testimonials() {
  return (
    <section className="page-container py-16">
      <div className="text-center mb-12">
        <h2 className="section-title mb-2">What Customers Say</h2>
        <p className="text-brand-muted">Real experiences from our community</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="card p-6 relative"
          >
            <Quote size={24} className="text-primary/20 absolute top-4 right-4" />
            <div className="flex items-center gap-1 mb-3">
              {Array.from({ length: t.rating }).map((_, j) => (
                <Star key={j} size={14} fill="#FF7A59" className="text-primary" />
              ))}
            </div>
            <p className="text-sm text-brand-muted leading-relaxed mb-4 italic">"{t.text}"</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="font-bold text-primary text-sm">{t.avatar}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-dark">{t.name}</p>
                <p className="text-xs text-brand-muted">{t.location}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
