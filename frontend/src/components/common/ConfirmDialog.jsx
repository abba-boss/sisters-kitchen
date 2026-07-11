import { AlertTriangle, Trash2, Info } from 'lucide-react';
import Modal from './Modal';

const ICONS = {
  danger: { Icon: Trash2, bg: 'bg-red-50', color: 'text-red-500' },
  warning: { Icon: AlertTriangle, bg: 'bg-yellow-50', color: 'text-yellow-600' },
  info: { Icon: Info, bg: 'bg-primary/10', color: 'text-primary' },
};

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  const { Icon, bg, color } = ICONS[variant] || ICONS.danger;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" showClose={false}>
      <div className="text-center -mt-2">
        <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
          <Icon size={24} className={color} />
        </div>
        <h3 className="font-poppins font-bold text-lg text-brand-dark mb-2">{title}</h3>
        {message && (
          <p className="text-sm text-brand-muted leading-relaxed mb-6">{message}</p>
        )}
        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button type="button" onClick={onClose} disabled={loading} className="btn-secondary flex-1 py-3 text-sm">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-3 text-sm font-semibold rounded-2xl text-white transition-all flex items-center justify-center gap-2 ${
              variant === 'danger'
                ? 'btn-danger flex-1'
                : 'btn-primary'
            }`}
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
