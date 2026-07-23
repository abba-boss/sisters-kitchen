import { motion } from "framer-motion";
import Navbar from "./Navbar";
import MobileBottomNav from "./MobileBottomNav";

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-brand-bg">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navbar />
      <motion.main
        id="main-content"
        className="flex-1 pb-16 md:pb-0" /* pb for mobile bottom nav */
        variants={PAGE_VARIANTS}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        {children}
      </motion.main>
      <MobileBottomNav />
    </div>
  );
}
