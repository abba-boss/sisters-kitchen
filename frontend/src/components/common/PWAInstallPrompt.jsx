import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      window.navigator.standalone === true;
    setIsStandalone(standalone);

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // Check if user already dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = localStorage.getItem('pwa-install-dismissed-time');
    
    // Don't show if dismissed within last 7 days
    if (dismissed && dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Listen for the beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show prompt after 3 seconds delay for better UX
      setTimeout(() => {
        if (!standalone) {
          setShowPrompt(true);
        }
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, show manual instructions after delay
    if (iOS && !standalone && !dismissed) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response: ${outcome}`);

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);

    // Store that user interacted with prompt
    localStorage.setItem('pwa-install-dismissed', 'true');
    localStorage.setItem('pwa-install-dismissed-time', Date.now().toString());
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
    localStorage.setItem('pwa-install-dismissed-time', Date.now().toString());
  };

  // Don't show if already installed or dismissed
  if (!showPrompt || isStandalone) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 p-4 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <Smartphone className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Install Sisters Kitchen</h3>
                <p className="text-sm text-orange-50">Get the app experience</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {isIOS ? (
            // iOS Instructions
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Install this app on your iPhone:
              </p>
              <ol className="text-sm text-gray-700 space-y-2 list-none">
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-orange-500 min-w-[20px]">1.</span>
                  <span>Tap the Share button 
                    <svg className="inline-block w-4 h-4 mx-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
                    </svg>
                    in Safari
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-orange-500 min-w-[20px]">2.</span>
                  <span>Scroll down and tap "Add to Home Screen"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-orange-500 min-w-[20px]">3.</span>
                  <span>Tap "Add" to install</span>
                </li>
              </ol>
            </div>
          ) : (
            // Android/Desktop
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  ⚡
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Fast & Lightweight</p>
                  <p className="text-xs text-gray-600">Instant access from your home screen</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  📱
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Works Offline</p>
                  <p className="text-xs text-gray-600">Browse even without internet</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  🔔
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Get Notifications</p>
                  <p className="text-xs text-gray-600">Stay updated on your orders</p>
                </div>
              </div>
            </div>
          )}

          {/* Install Button (only for non-iOS) */}
          {!isIOS && deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="w-full mt-4 bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold py-3 px-4 rounded-xl hover:from-orange-600 hover:to-orange-500 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Download className="w-5 h-5" />
              Install App
            </button>
          )}

          {/* Dismiss Button */}
          <button
            onClick={handleDismiss}
            className="w-full mt-2 text-gray-600 font-medium py-2 px-4 rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
