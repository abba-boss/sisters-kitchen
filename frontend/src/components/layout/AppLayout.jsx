import Navbar from './Navbar';
import Footer from './Footer';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import MobileBottomNav from './MobileBottomNav';

export default function AppLayout({ 
  children, 
  hideFooter = false,
  hideLeftSidebar = false,
  hideRightSidebar = false,
  fullWidth = false
}) {
  return (
    <div className="min-h-screen flex flex-col bg-brand-bg">
      <Navbar />
      
      <div className="flex-1 pb-16 md:pb-0">
        <div className={`${fullWidth ? 'w-full px-0' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'} py-6`}>
          <div className="grid lg:grid-cols-[240px_1fr_320px] gap-6 items-start">
            {/* Left Sidebar */}
            {!hideLeftSidebar && <LeftSidebar />}
            
            {/* Main Content */}
            <main className={`min-w-0 w-full ${hideLeftSidebar && hideRightSidebar ? 'lg:col-span-3' : hideLeftSidebar ? 'lg:col-span-2' : hideRightSidebar ? 'lg:col-span-2' : ''}`}>
              {children}
            </main>
            
            {/* Right Sidebar */}
            {!hideRightSidebar && <RightSidebar />}
          </div>
        </div>
      </div>
      
      {!hideFooter && <Footer />}
      <MobileBottomNav />
    </div>
  );
}
