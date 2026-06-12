import MainLayout from '../../components/layout/MainLayout';
import HeroSection from '../../components/customer/HeroSection';
import FeaturedVendors from '../../components/customer/FeaturedVendors';
import FeaturedProducts from '../../components/customer/FeaturedProducts';
import HowItWorks from '../../components/customer/HowItWorks';
// import Testimonials from '../../components/customer/Testimonials';
import CTASection from '../../components/customer/CTASection';

export default function HomePage() {
  return (
    <MainLayout>
      <HeroSection />
      <FeaturedVendors />
      <FeaturedProducts />
      <HowItWorks />
      {/* <Testimonials /> */}
      <CTASection />
    </MainLayout>
  );
}
