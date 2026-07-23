import { Link } from "react-router-dom";
import { Search, Store } from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import HomeTrending from "../../components/customer/HomeTrending";
import HomeFreshToday from "../../components/customer/HomeFreshToday";
import HomeCategories from "../../components/customer/HomeCategories";
import HomeTopVendors from "../../components/customer/HomeTopVendors";
import HomeClosingSoon from "../../components/customer/HomeClosingSoon";
import HomeRewardBanner from "../../components/customer/HomeRewardBanner";
import HomeNewsletter from "../../components/customer/HomeNewsletter";

/**
 * Shop — dedicated marketplace (search, categories, products, deals, vendors).
 * No hero banner; Feed owns the social/stories experience.
 */
export default function ShopPage() {
  return (
    <MainLayout>
      <div className="page-container page-shell pb-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-2">
          <div>
            <p className="eyebrow mb-3">Marketplace</p>
            <h1 className="heading-page">Shop</h1>
            <p className="section-subtitle max-w-xl">
              Search dishes, browse categories, catch today&apos;s deals, and
              find kitchens to order from.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/products"
              className="btn-primary btn-sm inline-flex items-center gap-2"
            >
              <Search size={15} aria-hidden="true" />
              Browse all food
            </Link>
            <Link
              to="/vendors"
              className="btn-secondary btn-sm inline-flex items-center gap-2"
            >
              <Store size={15} aria-hidden="true" />
              Vendor directory
            </Link>
          </div>
        </div>
      </div>

      <HomeCategories />
      <HomeFreshToday />
      <HomeTrending />
      <HomeClosingSoon />
      <HomeTopVendors />
      <HomeRewardBanner />
      <HomeNewsletter />
    </MainLayout>
  );
}
