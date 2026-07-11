import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChefHat, ArrowLeft, Apple, Chrome } from 'lucide-react';

const FOOD_IMAGES = {
  login: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
  register: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  forgot: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
  otp: 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&w=1200&q=80',
};

const FOOD_COPY = {
  login: {
    eyebrow: 'Fresh, fast, trusted',
    title: 'Discover homemade food worth coming back for.',
    body: 'Sign in to track orders, save favorites, and keep your premium food marketplace experience in sync.',
    highlights: ['Track deliveries in real time', 'Save wishlist and rewards', 'Checkout faster across devices'],
  },
  register: {
    eyebrow: 'Join the marketplace',
    title: 'Create your account and start ordering beautifully.',
    body: 'Set up your Sisters Kitchen account to shop curated meals, follow favorite kitchens, and unlock rewards.',
    highlights: ['Customer and vendor signup', 'Premium social-commerce experience', 'Rewards, stories, and saved favorites'],
  },
  forgot: {
    eyebrow: 'Account recovery',
    title: 'Get back into your account without the stress.',
    body: 'Request a secure verification code and continue your food journey with confidence.',
    highlights: ['Fast recovery flow', 'Secure verification step', 'No changes to your account until confirmed'],
  },
  otp: {
    eyebrow: 'Secure verification',
    title: 'Enter your verification code to continue.',
    body: 'We use a short code step to keep your account secure before continuing the recovery flow.',
    highlights: ['Short, focused verification', 'Smooth mobile-friendly code entry', 'Helpful resend and edit actions'],
  },
};

export default function AuthSplitLayout({
  variant = 'login',
  title,
  subtitle,
  children,
  footer,
  backTo = '/',
  backLabel = 'Back to home',
}) {
  const visual = FOOD_COPY[variant] || FOOD_COPY.login;
  const image = FOOD_IMAGES[variant] || FOOD_IMAGES.login;

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="grid min-h-screen xl:grid-cols-[1.05fr_0.95fr]">
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative hidden xl:flex overflow-hidden"
        >
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-dark/80 via-brand-dark/55 to-primary/35" />
          <div className="relative z-10 flex h-full flex-col justify-between p-10 text-white">
            <div className="flex items-center justify-between gap-4">
              <Link to="/" className="inline-flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
                  <ChefHat size={24} />
                </div>
                <div>
                  <p className="font-poppins text-xl font-bold">Sisters Kitchen</p>
                  <p className="text-sm text-white/75">Premium food marketplace</p>
                </div>
              </Link>
              <Link
                to={backTo}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-md transition hover:bg-white/15"
              >
                <ArrowLeft size={15} />
                {backLabel}
              </Link>
            </div>

            <div className="max-w-xl">
              <div className="mb-5 inline-flex items-center rounded-full bg-white/12 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-md">
                {visual.eyebrow}
              </div>
              <h1 className="font-poppins text-4xl font-bold leading-tight">{visual.title}</h1>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-white/80">{visual.body}</p>
              <div className="mt-8 grid gap-3">
                {visual.highlights.map((item) => (
                  <div
                    key={item}
                    className="inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm backdrop-blur-md"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                ['4.9/5', 'Customer satisfaction'],
                ['24/7', 'Food discovery'],
                ['120+', 'Trusted kitchens'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                  <p className="font-poppins text-2xl font-bold">{value}</p>
                  <p className="mt-1 text-sm text-white/75">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.aside>

        <section className="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xl"
          >
            <div className="mb-6 xl:hidden">
              <Link to="/" className="inline-flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-soft">
                  <ChefHat size={22} />
                </div>
                <div>
                  <p className="font-poppins text-xl font-bold text-brand-dark">Sisters Kitchen</p>
                  <p className="text-sm text-brand-muted">Premium food marketplace</p>
                </div>
              </Link>
            </div>

            <div className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-card sm:p-8">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Account Access</p>
                <h2 className="mt-2 font-poppins text-3xl font-bold text-brand-dark">{title}</h2>
                {subtitle && <p className="mt-2 text-sm leading-relaxed text-brand-muted">{subtitle}</p>}
              </div>

              {children}

              <div className="mt-6">
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-orange-100" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-xs font-medium uppercase tracking-[0.16em] text-brand-muted">
                      or continue with
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-orange-100 px-4 py-3 text-sm font-medium text-brand-dark transition hover:border-primary/30 hover:text-primary"
                  >
                    <Chrome size={16} />
                    Google
                    <span className="text-xs text-brand-muted">(Soon)</span>
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-orange-100 px-4 py-3 text-sm font-medium text-brand-dark transition hover:border-primary/30 hover:text-primary"
                  >
                    <Apple size={16} />
                    Apple
                    <span className="text-xs text-brand-muted">(Soon)</span>
                  </button>
                </div>
              </div>

              {footer && <div className="mt-6">{footer}</div>}
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
