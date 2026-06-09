import { Link } from 'react-router-dom';
import { ChefHat, Globe, Mail, Phone, MapPin, Heart, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-white">
      <div className="page-container py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
                <ChefHat size={20} className="text-white" />
              </div>
              <span className="font-poppins font-bold text-lg">
                Sisters <span className="text-primary">Kitchen</span>
              </span>
            </Link>
            <p className="text-sm text-white/60 leading-relaxed mb-5">
              Connecting you with talented female food vendors who cook with love. 
              Support women-owned businesses and enjoy homemade flavors.
            </p>
            <div className="flex gap-3">
              {[Globe, MessageCircle, Mail].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center hover:bg-primary transition-colors">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-poppins font-semibold text-white mb-4">Explore</h4>
            <ul className="space-y-2.5">
              {[['/', 'Home'], ['/products', 'Browse Food'], ['/vendors', 'Our Vendors'], ['/categories', 'Categories'], ['/about', 'About Us']].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-white/60 hover:text-primary transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Vendors */}
          <div>
            <h4 className="font-poppins font-semibold text-white mb-4">For Vendors</h4>
            <ul className="space-y-2.5">
              {[['/register?role=vendor', 'Become a Vendor'], ['/vendor/dashboard', 'Vendor Dashboard'], ['/vendor/products', 'Manage Products'], ['/vendor/orders', 'View Orders'], ['/faq', 'FAQ']].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-white/60 hover:text-primary transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-poppins font-semibold text-white mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-white/60">
                <Mail size={16} className="text-primary flex-shrink-0" />
                hello@sisterskitchen.ng
              </li>
              <li className="flex items-center gap-3 text-sm text-white/60">
                <Phone size={16} className="text-primary flex-shrink-0" />
                +234 800 000 0000
              </li>
              <li className="flex items-start gap-3 text-sm text-white/60">
                <MapPin size={16} className="text-primary flex-shrink-0 mt-0.5" />
                Lagos, Abuja, Port Harcourt, Nigeria
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="page-container py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Sisters Kitchen. All rights reserved.
          </p>
          <p className="text-xs text-white/40 flex items-center gap-1">
            Made with <Heart size={12} className="text-primary" /> for women entrepreneurs
          </p>
          <div className="flex gap-4">
            <Link to="/privacy" className="text-xs text-white/40 hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-xs text-white/40 hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
