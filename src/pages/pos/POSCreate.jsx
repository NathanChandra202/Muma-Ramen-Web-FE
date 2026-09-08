import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, LayoutDashboard, Receipt, Package, PlusCircle, Search } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { menu as menuApi, categories as catApi, orders as ordersApi } from '../../api';
import { showToast, formatPrice, getMenuImage, showModal } from '../../components/utils';
import { posLinks } from './Dashboard';
import { useNavigate } from 'react-router-dom';

export default function POSCreate() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  
  // Cart state
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('dine_in');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([catApi.list(), menuApi.list()])
      .then(([catsRes, menuRes]) => {
        setCategories(catsRes.categories || []);
        // Only show available items for ordering
        setMenuItems((menuRes.menu || []).filter(item => item.is_available && item.stock > 0));
      })
      .catch(err => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.menu_item_id === item.id);
      if (existing) {
        if (existing.quantity >= item.stock) {
          showToast(`Stok ${item.name} tidak cukup`, 'warning');
          return prev;
        }
        return prev.map(i => i.menu_item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menu_item_id: item.id, quantity: 1, item, notes: '' }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => {
      return prev.map(i => {
        if (i.menu_item_id === id) {
          const newQ = i.quantity + delta;
          if (newQ > i.item.stock) {
            showToast(`Stok sisa ${i.item.stock}`, 'warning');
            return i;
          }
          return newQ > 0 ? { ...i, quantity: newQ } : i;
        }
        return i;
      }).filter(i => i.quantity > 0);
    });
  };

  const updateNotes = (id, notes) => {
    setCart(prev => prev.map(i => i.menu_item_id === id ? { ...i, notes } : i));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(i => i.menu_item_id !== id));
  };

  const calculateTotal = () => {
    return cart.reduce((total, i) => total + (i.item.price * i.quantity), 0);
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return showToast('Keranjang kosong', 'warning');
    if (orderType === 'dine_in' && !tableNumber) return showToast('Nomor meja wajib diisi', 'warning');
    if (orderType === 'takeaway' && !customerName) return showToast('Nama pemesan wajib diisi', 'warning');

    setIsSubmitting(true);
    try {
      const items = cart.map(i => ({
        menu_item_id: i.menu_item_id,
        quantity: i.quantity,
        notes: i.notes
      }));
      
      const payload = {
        order_type: orderType,
        table_number: tableNumber,
        customer_name: customerName,
        items
      };

      const res = await ordersApi.create(payload);
      showToast('Pesanan berhasil dibuat!', 'success');
      
      setCart([]);
      setTableNumber('');
      setCustomerName('');
      setOrderType('dine_in');
      
      // Redirect to orders
      navigate('/pos/orders');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMenu = menuItems.filter(item => {
    const matchCat = activeCategory === 'all' || item.category_id == activeCategory;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <AdminLayout title="Buat Pesanan (POS)" links={posLinks}>
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)]">
        
        {/* Left: Menu Selection */}
        <div className="flex-1 flex flex-col bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          {/* Header & Filters */}
          <div className="p-4 border-b border-border bg-background/50">
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Cari menu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl focus:outline-none focus:border-primary transition"
              />
              <Search className="absolute left-3 top-3 text-text-muted" size={18} />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setActiveCategory('all')}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition ${activeCategory === 'all' ? 'bg-primary text-white shadow-md' : 'bg-surface-hover text-text-muted hover:text-text'}`}
              >
                Semua
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition ${activeCategory === cat.id ? 'bg-primary text-white shadow-md' : 'bg-surface-hover text-text-muted hover:text-text'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Grid */}
          <div className="flex-1 overflow-y-auto p-4 bg-background/30">
            {loading ? (
              <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
            ) : filteredMenu.length === 0 ? (
              <div className="text-center py-20 text-text-muted">Menu tidak ditemukan.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredMenu.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => addToCart(item)}
                    className="glass border border-border rounded-xl overflow-hidden cursor-pointer hover:border-primary/50 transition-colors group relative"
                  >
                    <div className="aspect-video bg-surface-hover relative">
                      <img src={getMenuImage(item.image_url, item.name)} alt={item.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <PlusCircle className="text-white w-10 h-10" />
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="font-bold text-sm line-clamp-1">{item.name}</h4>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-primary font-bold text-sm">{formatPrice(item.price)}</span>
                        <span className="text-xs text-text-muted font-bold bg-surface-hover px-2 py-1 rounded-md">Stok: {item.stock}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart & Checkout */}
        <div className="w-full lg:w-96 flex flex-col bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-background/50">
            <h3 className="font-bold flex items-center gap-2">
              <ShoppingCart size={18} /> Pesanan Baru
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-10 text-text-muted">
                <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm font-semibold">Keranjang masih kosong</p>
                <p className="text-xs">Pilih menu dari daftar di samping</p>
              </div>
            ) : (
              cart.map(i => (
                <div key={i.menu_item_id} className="bg-background border border-border rounded-xl p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-sm">{i.item.name}</h4>
                      <p className="text-primary text-xs font-bold">{formatPrice(i.item.price)}</p>
                    </div>
                    <button onClick={() => removeFromCart(i.menu_item_id)} className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center gap-3 bg-surface border border-border rounded-lg p-1">
                      <button onClick={() => updateQuantity(i.menu_item_id, -1)} className="p-1 hover:bg-surface-hover rounded-md"><Minus size={14} /></button>
                      <span className="font-bold text-sm w-4 text-center">{i.quantity}</span>
                      <button onClick={() => updateQuantity(i.menu_item_id, 1)} className="p-1 hover:bg-surface-hover rounded-md"><Plus size={14} /></button>
                    </div>
                    <span className="font-black text-sm">{formatPrice(i.item.price * i.quantity)}</span>
                  </div>
                  
                  <input
                    type="text"
                    placeholder="Catatan (opsional)..."
                    value={i.notes}
                    onChange={(e) => updateNotes(i.menu_item_id, e.target.value)}
                    className="w-full mt-2 bg-surface text-xs border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary transition"
                  />
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-border bg-background/50">
            <div className="mb-4 space-y-3">
              <div className="flex gap-2 p-1 bg-surface border border-border rounded-xl">
                <button 
                  onClick={() => setOrderType('dine_in')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${orderType === 'dine_in' ? 'bg-primary text-white shadow' : 'text-text-muted hover:text-text'}`}
                >Dine-In</button>
                <button 
                  onClick={() => { setOrderType('takeaway'); setTableNumber(''); }}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${orderType === 'takeaway' ? 'bg-primary text-white shadow' : 'text-text-muted hover:text-text'}`}
                >Take Away</button>
              </div>
              
              {orderType === 'dine_in' ? (
                <div>
                  <input
                    type="text"
                    placeholder="Nomor Meja *"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition"
                  />
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    placeholder="Nama Pemesan *"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mb-4">
              <span className="text-text-muted font-bold text-sm uppercase tracking-wider">Total Pembayaran</span>
              <span className="text-2xl font-black text-primary">{formatPrice(calculateTotal())}</span>
            </div>

            <button
              onClick={handleSubmitOrder}
              disabled={cart.length === 0 || isSubmitting}
              className="w-full py-3.5 bg-primary hover:bg-orange-600 text-white font-bold rounded-xl transition shadow-lg disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Memproses...</>
              ) : 'Proses Pesanan Sekarang'}
            </button>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
