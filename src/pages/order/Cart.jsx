import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart, getCartTotal, updateQuantity, updateItemNotes, removeFromCart, clearCart, onCartChange } from '../../cart';
import { orders as ordersApi } from '../../api';
import { isLoggedIn } from '../../auth';
import { showToast, formatPrice, getMenuImage, confirm } from '../../components/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, Utensils } from 'lucide-react';

export default function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orderType, setOrderType] = useState('dine_in');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  useEffect(() => {
    setCartItems(getCart());
    const unsub = onCartChange((newCart) => setCartItems([...newCart]));
    
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.phone) setCustomerPhone(user.phone);
      if (user.name) setCustomerName(user.name);
    }
    
    return () => unsub();
  }, []);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    if (orderType === 'dine_in' && !tableNumber) {
      showToast('Mohon isi nomor meja', 'warning');
      return;
    }
    if (orderType === 'takeaway' && !customerName) {
      showToast('Mohon isi nama pemesan', 'warning');
      return;
    }
    if (!customerPhone) {
      showToast('Mohon isi nomor telepon', 'warning');
      return;
    }

    const ok = await confirm(`Total pesanan: ${formatPrice(getCartTotal())}. Lanjutkan checkout?`);
    if (!ok) return;

    setLoading(true);
    try {
      const payload = {
        order_type: orderType,
        table_number: tableNumber,
        customer_name: customerName,
        customer_phone: customerPhone,
        payment_method: paymentMethod,
        items: cartItems.map(i => ({
          menu_item_id: i.menu_item_id,
          quantity: i.quantity,
          notes: i.notes
        }))
      };

      const res = await ordersApi.create(payload);
      clearCart();
      showToast('Pesanan berhasil dibuat! 🍜', 'success');
      navigate(`/order/tracking/${res.order.id}`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const total = getCartTotal();

  return (
    <div className="min-h-screen bg-background text-text">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => navigate('/order/menu')} className="flex items-center gap-2 text-text-muted hover:text-primary transition">
            <ArrowLeft size={20} />
            <span className="font-semibold">Kembali ke Menu</span>
          </button>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">Keranjang</h1>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mb-6 border border-border text-text-muted">
              <ShoppingBag size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Keranjang Kosong</h2>
            <p className="text-text-muted mb-8">Kamu belum menambahkan ramen apapun.</p>
            <button 
              onClick={() => navigate('/order/menu')}
              className="px-8 py-3 bg-primary hover:bg-orange-600 text-white font-bold rounded-full shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all"
            >
              Lihat Menu
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items List */}
            <div className="lg:col-span-2 space-y-4">
              {!isLoggedIn() && (
                <div className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-2xl p-4 mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-primary">Login untuk Promo Eksklusif!</h3>
                    <p className="text-sm text-text-muted">Kumpulkan poin dan nikmati promo khusus member.</p>
                  </div>
                  <button 
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-orange-600 transition shadow-md"
                  >
                    Login Sekarang
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Pesananmu ({cartItems.length})</h2>
                <button 
                  onClick={async () => {
                    if (await confirm('Hapus semua isi keranjang?')) clearCart();
                  }}
                  className="text-red-500 hover:text-red-400 text-sm font-semibold flex items-center gap-2"
                >
                  <Trash2 size={16} /> Kosongkan
                </button>
              </div>

              <AnimatePresence>
                {cartItems.map((item) => (
                  <motion.div 
                    key={item.menu_item_id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 bg-surface border border-border rounded-2xl flex gap-4"
                  >
                    <div 
                      className="w-24 h-24 rounded-xl bg-background bg-cover bg-center"
                      style={{ backgroundImage: `url('${getMenuImage(item.image_url, item.name)}')` }}
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="font-bold text-lg">{item.name}</h3>
                          <p className="text-primary font-bold">{formatPrice(item.price)}</p>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.menu_item_id)}
                          className="p-2 text-text-muted hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      
                      <div className="flex items-end justify-between mt-4">
                        <input 
                          type="text" 
                          placeholder="Catatan (opsional)..." 
                          value={item.notes}
                          onChange={(e) => updateItemNotes(item.menu_item_id, e.target.value)}
                          className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm w-1/2 text-text placeholder-text-muted/50 focus:outline-none focus:border-primary transition"
                        />
                        
                        <div className="flex items-center gap-3 bg-background border border-border rounded-full p-1">
                          <button 
                            onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-hover text-text-muted hover:text-primary transition"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-4 text-center font-bold">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-hover hover:bg-primary text-white transition"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Checkout Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 p-6 glass rounded-2xl">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Utensils size={20} className="text-primary" /> Rincian Order
                </h2>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Tipe Pesanan</label>
                    <div className="flex gap-2 p-1 bg-background border border-border rounded-lg">
                      <button 
                        onClick={() => setOrderType('dine_in')}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition ${orderType === 'dine_in' ? 'bg-surface border border-border text-text shadow-sm' : 'text-text-muted hover:text-primary'}`}
                      >
                        Dine In
                      </button>
                      <button 
                        onClick={() => setOrderType('takeaway')}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition ${orderType === 'takeaway' ? 'bg-surface border border-border text-text shadow-sm' : 'text-text-muted hover:text-primary'}`}
                      >
                        Take Away
                      </button>
                    </div>
                  </div>

                  {orderType === 'dine_in' ? (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Nomor Meja</label>
                      <input 
                        type="text" 
                        placeholder="Contoh: 12" 
                        value={tableNumber}
                        onChange={e => setTableNumber(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-4 py-3 text-text placeholder-text-muted focus:outline-none focus:border-primary transition"
                      />
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Nama Pemesan</label>
                      <input 
                        type="text" 
                        placeholder="Nama kamu..." 
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-4 py-3 text-text placeholder-text-muted focus:outline-none focus:border-primary transition"
                      />
                    </motion.div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Nomor Telepon *</label>
                    <input 
                      type="text" 
                      placeholder="0812..." 
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-4 py-3 text-text placeholder-text-muted focus:outline-none focus:border-primary transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Metode Pembayaran</label>
                    <div className="flex gap-2 p-1 bg-background border border-border rounded-lg">
                      <button 
                        onClick={() => setPaymentMethod('cash')}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition ${paymentMethod === 'cash' ? 'bg-surface border border-border text-text shadow-sm' : 'text-text-muted hover:text-primary'}`}
                      >
                        Tunai / Kasir
                      </button>
                      <button 
                        onClick={() => setPaymentMethod('qris')}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition ${paymentMethod === 'qris' ? 'bg-surface border border-border text-text shadow-sm' : 'text-text-muted hover:text-primary'}`}
                      >
                        QRIS
                      </button>
                    </div>
                  </div>

                  {paymentMethod === 'qris' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 bg-white rounded-xl border border-border flex flex-col items-center">
                      <p className="text-sm font-bold text-gray-800 mb-2">Scan untuk Membayar</p>
                      {/* Using a placeholder for QRIS */}
                      <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=MUMA_RAMEN_QRIS_PLACEHOLDER" alt="QRIS" className="w-48 h-48 rounded-lg shadow-sm" />
                      <p className="text-xs text-gray-500 mt-3 text-center">Buka aplikasi m-banking atau e-wallet, pilih scan QRIS.</p>
                    </motion.div>
                  )}
                </div>

                <div className="border-t border-border pt-4 mb-6 space-y-2">
                  <div className="flex justify-between text-text-muted">
                    <span>Subtotal</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Pajak (10%)</span>
                    <span>{formatPrice(total * 0.1)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xl mt-4 pt-4 border-t border-border text-text">
                    <span>Total Bayar</span>
                    <span className="text-primary">{formatPrice(total * 1.1)}</span>
                  </div>
                </div>

                <button 
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full py-4 bg-primary hover:bg-orange-600 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="animate-spin-slow inline-block">⏳</span> 
                  ) : (
                    'Pesan Sekarang'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
