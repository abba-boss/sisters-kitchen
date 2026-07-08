import MainLayout from '../../components/layout/MainLayout';
import HomeHero from '../../components/customer/HomeHero';
import HomeStories from '../../components/customer/HomeStories';
import HomeTrending from '../../components/customer/HomeTrending';
import HomeFreshToday from '../../components/customer/HomeFreshToday';
import HomeCategories from '../../components/customer/HomeCategories';
import HomeTopVendors from '../../components/customer/HomeTopVendors';
import HomeClosingSoon from '../../components/customer/HomeClosingSoon';
import HomeNearbyVendors from '../../components/customer/HomeNearbyVendors';
import HomeRecommendations from '../../components/customer/HomeRecommendations';
import HomeRewardBanner from '../../components/customer/HomeRewardBanner';
import HomeNewsletter from '../../components/customer/HomeNewsletter';
import CTASection from '../../components/customer/CTASection';

export default function HomePage() {
  return (
    <MainLayout>
      <HomeHero />
      <HomeStories />
      <HomeTrending />
      <HomeFreshToday />
      <HomeClosingSoon />
      <HomeCategories />
      <HomeRecommendations />
      <HomeTopVendors />
      <HomeNearbyVendors />
      <HomeRewardBanner />
      <HomeNewsletter />
      <CTASection />
    </MainLayout>
  );
}
