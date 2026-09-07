// Toast notification system
export function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = {
    success: 'fa-circle-check',
    error: 'fa-circle-xmark',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info',
  };

  toast.innerHTML = `
    <i class="fa-solid ${icons[type] || icons.info}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Modal system
export function showModal({ title, content, footer, onClose, wide = false }) {
  const container = document.getElementById('modal-container');

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-content" style="${wide ? 'max-width:680px;' : ''}">
      <div class="modal-header">
        <h2 class="modal-title">${title}</h2>
        <button class="modal-close" id="modal-close-btn">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="modal-body">${content}</div>
      ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
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
      content: `<p style="color:var(--body-grey);line-height:1.6;">${message}</p>`,
      footer: `
        <button class="btn btn-ghost" id="confirm-cancel">Batal</button>
        <button class="btn btn-primary" id="confirm-ok">Ya, Lanjutkan</button>
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
    pending: 'Menunggu',
    preparing: 'Diproses',
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

// Generate placeholder image URL based on item name
export function getMenuImage(imageUrl, name) {
  if (imageUrl && !imageUrl.startsWith('/images/')) {
    return `http://localhost:8081${imageUrl}`;
  }
  // Generate a colored placeholder with initials
  const colors = ['DE5737', 'E57924', '2D8A4E', '2D6E8A', '856404', '7B1FA2'];
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const color = colors[hash % colors.length];
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${color}&color=fff&size=300&font-size=0.4&bold=true`;
}
