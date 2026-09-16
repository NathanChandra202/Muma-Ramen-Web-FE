import { API_BASE } from '../api';

export const API_HOST = API_BASE.replace('/api', '');

// Toast notification system
export function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `fixed top-5 right-5 z-[10000] flex items-center gap-3 px-5 py-3 rounded-lg text-sm font-medium shadow-2xl transition-all duration-300 transform translate-x-0 opacity-100 ${
    type === 'success' ? 'bg-emerald-500 text-white' : 
    type === 'error' ? 'bg-red-500 text-white' : 
    type === 'warning' ? 'bg-amber-500 text-white' : 
    'bg-blue-500 text-white'
  }`;

  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'i',
  };

  toast.innerHTML = `
    <span class="font-bold text-lg">${icons[type] || icons.info}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.replace('translate-x-0', 'translate-x-full');
    toast.classList.replace('opacity-100', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Modal system
export function showModal({ title, content, footer, onClose, wide = false }) {
  const container = document.getElementById('modal-container');

  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-background/80 backdrop-blur-sm z-[9000] flex items-center justify-center p-6 animate-in fade-in duration-200';
  overlay.innerHTML = `
    <div class="bg-surface border border-border rounded-2xl p-8 w-full ${wide ? 'max-w-2xl' : 'max-w-md'} shadow-2xl animate-in zoom-in-95 duration-300">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-text">${title}</h2>
        <button class="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:bg-surface-hover hover:text-primary transition" id="modal-close-btn">
          ✕
        </button>
      </div>
      <div class="text-text-muted">${content}</div>
      ${footer ? `<div class="flex justify-end gap-3 mt-8 pt-6 border-t border-border">${footer}</div>` : ''}
    </div>
  `;

  const close = () => {
    overlay.remove();
    if (onClose) onClose();
  };

  overlay.querySelector('#modal-close-btn').addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  container.appendChild(overlay);

  return { close, overlay };
}

// Confirm dialog
export function confirm(message, title = 'Konfirmasi') {
  return new Promise((resolve) => {
    const { close, overlay } = showModal({
      title,
      content: `<p class="text-text-muted">${message}</p>`,
      footer: `
        <button class="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-surface-hover transition" id="confirm-cancel">Batal</button>
        <button class="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-orange-600 transition" id="confirm-ok">Ya, Lanjutkan</button>
      `,
    });

    overlay.querySelector('#confirm-cancel').addEventListener('click', () => {
      close();
      resolve(false);
    });

    overlay.querySelector('#confirm-ok').addEventListener('click', () => {
      close();
      resolve(true);
    });
  });
}

// Format currency
export function formatPrice(price) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);
}

// Format date
export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

// Format short date
export function formatShortDate(dateStr) {
  return new Date(dateStr).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit'
  });
}

// Status label
export function getStatusLabel(status) {
  const labels = {
    unpaid: 'Menunggu Pembayaran',
    pending: 'Menunggu Diproses',
    preparing: 'Sedang Disiapkan',
    ready: 'Siap',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
  };
  return labels[status] || status;
}

// Order type label
export function getOrderTypeLabel(type) {
  const labels = {
    dine_in: 'Dine In',
    takeaway: 'Take Away',
  };
  return labels[type] || type;
}

// Get full image URL
export function getImageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  
  // NGINX on production usually only forwards /api to the backend. 
  // We configured backend to serve static files under /api/uploads as well.
  if (path.startsWith('/uploads') || path.startsWith('/images')) {
    return `${API_BASE}${path}`;
  }
  
  // If it's a seed image name like 'tantanmen.jpg', it is stored in /images/
  if (!path.includes('/')) {
    return `${API_BASE}/images/${path}`;
  }
  
  return `${API_HOST}${path.startsWith('/') ? '' : '/'}${path}`;
}

// Generate placeholder image URL based on item name
export function getMenuImage(imageUrl, name) {
  if (imageUrl) {
    return getImageUrl(imageUrl);
  }
  // Generate a colored placeholder with initials
  const colors = ['DE5737', 'E57924', '2D8A4E', '2D6E8A', '856404', '7B1FA2'];
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const color = colors[hash % colors.length];
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${color}&color=fff&size=300&font-size=0.4&bold=true`;
}

// Generate array of image URLs from item.images
export function getMenuImages(item) {
  let urls = [];
  if (item.images) {
    try {
      urls = JSON.parse(item.images);
    } catch (e) {
      console.error("Failed to parse images json", e);
    }
  }
  
  if (urls.length === 0) {
    if (item.image_url) {
      return [getMenuImage(item.image_url, item.name)];
    }
    return [getMenuImage(null, item.name)];
  }

  return urls.map(url => getMenuImage(url, item.name));
}
