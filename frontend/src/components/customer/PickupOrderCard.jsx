import { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, CheckCircle, Clock, Info, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon issue with Leaflet + Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function PickupOrderCard({ order }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef();

  const { vendor, pickupToken, pickupPin, pickupVerifiedAt, status } = order;
  const lat = Number(vendor?.pickupLatitude);
  const lng = Number(vendor?.pickupLongitude);
  const hasLocation = lat && lng && !isNaN(lat) && !isNaN(lng);

  useEffect(() => {
    if (pickupToken) {
      QRCode.toDataURL(pickupToken, { width: 200, margin: 2 })
        .then(setQrDataUrl)
        .catch(() => {});
    }
  }, [pickupToken]);

  const handleGetDirections = () => {
    if (!hasLocation) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const handleCopyToken = async () => {
    if (!pickupPin) return;
    try {
      await navigator.clipboard.writeText(pickupPin);
      setCopied(true);
      toast.success('PIN copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy PIN');
    }
  };

  const isReady = status === 'ready';
  const isPickedUp = !!pickupVerifiedAt;

  return (
    <div className="card p-5 mb-4 border-l-4 border-primary">
      <h2 className="font-semibold text-brand-dark mb-3 text-sm flex items-center gap-2">
        <MapPin size={16} className="text-primary" />
        Self-Pickup Order
      </h2>

      {/* Pickup Status */}
      {isPickedUp ? (
        <div className="bg-accent/10 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 text-accent font-semibold text-sm mb-1">
            <CheckCircle size={16} /> Order Picked Up!
          </div>
          <p className="text-xs text-brand-muted">
            Verified on {new Date(pickupVerifiedAt).toLocaleString()}
          </p>
        </div>
      ) : isReady ? (
        <div className="bg-primary/10 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-1">
            <Clock size={16} /> Ready for Pickup!
          </div>
          <p className="text-xs text-brand-muted">
            Show the QR code below to the vendor to collect your order
          </p>
        </div>
      ) : (
        <div className="bg-orange-50 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 text-orange-600 font-semibold text-sm mb-1">
            <Info size={16} /> Order Being Prepared
          </div>
          <p className="text-xs text-brand-muted">
            You'll be notified when your order is ready for pickup
          </p>
        </div>
      )}

      {/* Vendor Location */}
      {hasLocation && (
        <div className="space-y-3 mb-4">
          <div>
            <p className="text-xs font-medium text-brand-muted mb-1">Pickup Location</p>
            <p className="text-sm text-brand-dark font-medium">{vendor?.businessName}</p>
            {vendor?.address && (
              <p className="text-xs text-brand-muted flex items-start gap-1.5 mt-0.5">
                <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                {vendor.address}
              </p>
            )}
          </div>

          {/* Map Toggle */}
          <button
            onClick={() => setShowMap(!showMap)}
            className="text-xs text-primary font-semibold hover:underline"
          >
            {showMap ? 'Hide Map' : 'Show Map'}
          </button>

          {showMap && (
            <div className="rounded-xl overflow-hidden border border-orange-100" style={{ height: '250px' }}>
              <MapContainer
                center={[lat, lng]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[lat, lng]}>
                  <Popup>{vendor?.businessName}</Popup>
                </Marker>
              </MapContainer>
            </div>
          )}

          <button
            onClick={handleGetDirections}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm"
          >
            <Navigation size={16} /> Get Directions
          </button>
        </div>
      )}

      {/* Pickup Instructions */}
      {vendor?.pickupInstructions && (
        <div className="bg-brand-bg rounded-xl p-3 mb-4">
          <p className="text-xs font-medium text-brand-dark mb-1">Pickup Instructions</p>
          <p className="text-xs text-brand-muted whitespace-pre-wrap">{vendor.pickupInstructions}</p>
        </div>
      )}

      {/* QR Code */}
      {!isPickedUp && qrDataUrl && (
        <div className="border-t border-orange-100 pt-4">
          <p className="text-xs font-medium text-brand-dark mb-2 text-center">
            Your Pickup QR Code
          </p>
          <div className="flex justify-center">
            <div className="bg-white p-3 rounded-xl shadow-card inline-block">
              <img src={qrDataUrl} alt="Pickup QR Code" className="w-40 h-40" />
            </div>
          </div>
          <p className="text-xs text-brand-muted text-center mt-2">
            Show this code to the vendor when collecting your order
          </p>
          
          {/* Manual Token Display */}
          <div className="mt-4 bg-brand-bg rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-brand-dark">Pickup PIN (Manual Entry)</p>
              <button
                onClick={handleCopyToken}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <Check size={12} /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={12} /> Copy
                  </>
                )}
              </button>
            </div>
            <div className="bg-white rounded-lg p-3 border border-orange-100">
              <p className="text-2xl font-bold text-center text-primary tracking-widest font-mono">
                {pickupPin}
              </p>
            </div>
            <p className="text-[10px] text-brand-muted mt-1.5">
              💡 If vendor can't scan QR code, share this 6-digit PIN
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
