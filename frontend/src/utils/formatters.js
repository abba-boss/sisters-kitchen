// ─── Price ─────────────────────────────────────────────────────
export const formatPrice = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

// ─── Dates ─────────────────────────────────────────────────────
export const formatDate = (date) => {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export const timeAgo = (date) => {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const intervals = [
    { label: 'year',   seconds: 31536000 },
    { label: 'month',  seconds: 2592000  },
    { label: 'week',   seconds: 604800   },
    { label: 'day',    seconds: 86400    },
    { label: 'hour',   seconds: 3600     },
    { label: 'minute', seconds: 60       },
  ];
  for (const { label, seconds: s } of intervals) {
    const count = Math.floor(seconds / s);
    if (count >= 1) return `${count} ${label}${count > 1 ? 's' : ''} ago`;
  }
  return 'just now';
};

// ─── Order status ───────────────────────────────────────────────
const STATUS_LABELS = {
  pending:          'Pending',
  confirmed:        'Confirmed',
  preparing:        'Preparing',
  ready:            'Ready',
  out_for_delivery: 'On the Way',
  delivered:        'Delivered',
  cancelled:        'Cancelled',
};

const STATUS_COLORS = {
  pending:          'badge-warning',
  confirmed:        'badge-primary',
  preparing:        'badge-primary',
  ready:            'badge-success',
  out_for_delivery: 'badge-primary',
  delivered:        'badge-success',
  cancelled:        'badge-danger',
};

export const getOrderStatusLabel  = (status) => STATUS_LABELS[status]  || status;
export const getOrderStatusColor  = (status) => STATUS_COLORS[status]  || 'badge-warning';

// ─── Text ───────────────────────────────────────────────────────
export const truncate = (str, len = 80) =>
  str && str.length > len ? `${str.substring(0, len)}…` : str;

export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

// ─── Numbers ────────────────────────────────────────────────────
export const formatNumber = (n) =>
  new Intl.NumberFormat('en-NG').format(Number(n) || 0);

export const formatPercent = (n) =>
  `${Math.round(Number(n) || 0)}%`;
