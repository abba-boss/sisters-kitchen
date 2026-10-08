import { useState, useEffect, useRef } from 'react';
import { X, QrCode, CheckCircle, XCircle, Camera, Keyboard } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { orderService } from '../../services/orderService';
import toast from 'react-hot-toast';

export default function PickupVerificationModal({ order, onClose, onSuccess }) {
  const [scanning, setScanning] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    if (scanning && !html5QrCodeRef.current) {
      startScanner();
    }
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, [scanning]);

  const startScanner = async () => {
    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        handleScanSuccess,
        handleScanError
      );
    } catch (err) {
      setError('Camera access denied or not available. Use manual entry instead.');
      setScanning(false);
    }
  };

  const handleScanSuccess = (decodedText) => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().catch(() => {});
      html5QrCodeRef.current = null;
    }
    setScanning(false);
    verifyToken(decodedText);
  };

  const handleScanError = () => {
    // Ignore scan errors (no QR code in frame)
  };

  const verifyToken = async (token) => {
    if (!token || !token.trim()) {
      setError('Invalid token');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const { data } = await orderService.verifyPickup(order.id, token);
      toast.success('✅ Pickup verified successfully!');
      onSuccess(data.data);
      setTimeout(onClose, 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Verification failed';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setVerifying(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    verifyToken(manualToken);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-brand-bg rounded-full flex items-center justify-center hover:bg-orange-100 transition-colors"
        >
          <X size={18} className="text-brand-dark" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-3">
            <QrCode size={24} className="text-primary" />
          </div>
          <h2 className="font-poppins font-bold text-lg text-brand-dark">
            Verify Pickup
          </h2>
          <p className="text-sm text-brand-muted mt-1">
            Order #{order.orderNumber}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => {
              setManualMode(false);
              setError('');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-all ${
              !manualMode
                ? 'bg-primary text-white'
                : 'bg-brand-bg text-brand-muted hover:bg-orange-100'
            }`}
          >
            <Camera size={16} className="inline mr-1" /> Scan QR
          </button>
          <button
            onClick={() => {
              setManualMode(true);
              if (html5QrCodeRef.current) {
                html5QrCodeRef.current.stop().catch(() => {});
                html5QrCodeRef.current = null;
              }
              setScanning(false);
              setError('');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-all ${
              manualMode
                ? 'bg-primary text-white'
                : 'bg-brand-bg text-brand-muted hover:bg-orange-100'
            }`}
          >
            <Keyboard size={16} className="inline mr-1" /> Manual
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2">
            <XCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* QR Scanner Mode */}
        {!manualMode && (
          <div>
            {!scanning ? (
              <button
                onClick={() => setScanning(true)}
                disabled={verifying}
                className="btn-primary w-full py-4 text-sm"
              >
                <Camera size={18} className="inline mr-2" />
                Start Camera Scanner
              </button>
            ) : (
              <div className="space-y-3">
                <div
                  id="qr-reader"
                  className="rounded-2xl overflow-hidden border-4 border-primary"
                />
                <p className="text-xs text-brand-muted text-center">
                  Position the QR code within the frame
                </p>
                <button
                  onClick={() => {
                    if (html5QrCodeRef.current) {
                      html5QrCodeRef.current.stop().catch(() => {});
                      html5QrCodeRef.current = null;
                    }
                    setScanning(false);
                  }}
                  className="btn-secondary w-full py-3 text-sm"
                >
                  Stop Scanner
                </button>
              </div>
            )}
          </div>
        )}

        {/* Manual Entry Mode */}
        {manualMode && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-brand-dark mb-1.5 block">
                6-Digit Pickup PIN
              </label>
              <input
                type="text"
                value={manualToken}
                onChange={(e) => {
                  // Only allow numbers and limit to 6 digits
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setManualToken(value);
                }}
                placeholder="Enter 6-digit PIN..."
                className="input-field text-center text-2xl font-bold tracking-widest font-mono"
                maxLength={6}
                pattern="\d{6}"
                required
              />
              <p className="text-xs text-brand-muted mt-1 text-center">
                Customer will show you a 6-digit PIN
              </p>
            </div>
            <button
              type="submit"
              disabled={verifying || manualToken.length !== 6}
              className="btn-primary w-full py-4 text-sm disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle size={18} className="inline mr-2" />
                  Verify Pickup
                </>
              )}
            </button>
          </form>
        )}

        {/* Info */}
        <div className="mt-6 bg-brand-bg rounded-xl p-3">
          <p className="text-xs text-brand-muted">
            <strong className="text-brand-dark">Customer: </strong>
            {order.user?.firstName} {order.user?.lastName}
          </p>
          {order.deliveryPhone && (
            <p className="text-xs text-brand-muted mt-1">
              <strong className="text-brand-dark">Phone: </strong>
              {order.deliveryPhone}
            </p>
          )}
          <p className="text-xs text-brand-muted mt-1">
            <strong className="text-brand-dark">Total: </strong>
            ₦{Number(order.total).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
