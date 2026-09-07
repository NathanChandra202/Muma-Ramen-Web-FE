// Shopping cart state management
const CART_KEY = 'muma_cart';

let cart = loadCart();
let listeners = [];

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  listeners.forEach(fn => fn(cart));
}

export function getCart() {
  return [...cart];
}

export function getCartCount() {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartTotal() {
  return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

export function addToCart(menuItem) {
  const existing = cart.find(i => i.menu_item_id === menuItem.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      menu_item_id: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      image_url: menuItem.image_url,
      quantity: 1,
      notes: '',
    });
  }
  saveCart();
}

export function removeFromCart(menuItemId) {
  cart = cart.filter(i => i.menu_item_id !== menuItemId);
  saveCart();
}

export function updateQuantity(menuItemId, quantity) {
  const item = cart.find(i => i.menu_item_id === menuItemId);
  if (item) {
    if (quantity <= 0) {
      removeFromCart(menuItemId);
    } else {
      item.quantity = quantity;
      saveCart();
    }
  }
}

export function updateItemNotes(menuItemId, notes) {
  const item = cart.find(i => i.menu_item_id === menuItemId);
  if (item) {
    item.notes = notes;
    saveCart();
  }
}

export function clearCart() {
  cart = [];
  saveCart();
}

export function onCartChange(fn) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter(l => l !== fn);
  };
}
