import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { menu as menuApi, categories as catApi } from '../../api';
import { addToCart, getCartCount, onCartChange } from '../../cart';
import { getUser, isLoggedIn } from '../../auth';
import { showToast, formatPrice, getMenuImage, getMenuImages } from '../../components/utils';
import AvatarMenu from '../../components/AvatarMenu';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, Clock, LayoutGrid, Coffee, MapPin, X } from 'lucide-react';

const SpotlightCard = ({ children, className = '' }) => {
  const divRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden rounded-2xl bg-surface border border-border transition-transform hover:-translate-y-1 hover:shadow-2xl ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(249,115,22,0.1), transparent 40%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, rgba(249,115,22,0.4), transparent 40%)`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          padding: '1px',
          borderRadius: 'inherit',
        }}
      />
      {children}
    </div>
  );
};

const MenuImageCarousel = ({ item }) => {
  const images = getMenuImages(item);
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <div className="h-48 relative overflow-hidden group">
      <div 
        className="flex h-full w-full transition-transform duration-300 ease-out" 
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((url, i) => (
          <div 
            key={i} 
            className="w-full h-full flex-shrink-0 bg-surface bg-cover bg-center" 
            style={{ backgroundImage: `url('${url}')` }} 
          />
        ))}
      </div>
      
      {images.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
          {images.map((_, i) => (
            <button 
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIndex ? 'bg-primary w-3' : 'bg-white/50 hover:bg-white'}`}
            />
          ))}
        </div>
      )}

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-80 pointer-events-none"></div>
      {item.stock <= 5 && item.stock > 0 && (
        <span className="absolute top-4 right-4 bg-red-500/80 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded">Sisa {item.stock}</span>
      )}
      {item.stock === 0 && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <span className="bg-red-500 text-white font-bold px-4 py-2 rounded-lg">Habis</span>
        </div>
      )}
    </div>
  );
};

export default function MenuPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);

  const user = getUser();

  useEffect(() => {
    setCartCount(getCartCount());
    const unsub = onCartChange(() => setCartCount(getCartCount()));

    Promise.all([menuApi.list({ available: 'true' }), catApi.list()])
      .then(([m, c]) => {
        setMenuItems(m.menu || []);
        setCategories(c.categories || []);
      })
      .catch(err => showToast(err.message, 'error'))
      .finally(() => setLoading(false));

    return () => unsub();
  }, []);

  const filtered = menuItems.filter(item => {
    const matchCat = activeCategory === 'all' || item.category_id == activeCategory;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleAddToCart = (e, item) => {
    e.stopPropagation();
    // Allow guest checkout
    addToCart(item);
    showToast(`${item.name} ditambahkan`, 'success');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-primary"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin-slow"></div></div>;
  }

  return (
    <div className="min-h-screen bg-background text-white selection:bg-primary/30">
      
      {/* Modal Details */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur transition"
              >
                <X size={18} />
              </button>
              
              <div className="h-64 sm:h-80 w-full shrink-0">
                <MenuImageCarousel item={selectedItem} />
              </div>
              
              <div className="p-6 overflow-y-auto">
                <span className="text-xs text-primary font-bold uppercase tracking-wider mb-2 block">{selectedItem.category?.name}</span>
                <h2 className="text-2xl font-bold mb-2">{selectedItem.name}</h2>
                <p className="text-xl font-bold text-white mb-6">{formatPrice(selectedItem.price)}</p>
                
                <h3 className="font-semibold text-text-muted mb-2">Deskripsi</h3>
                <p className="text-text/80 mb-8 whitespace-pre-wrap leading-relaxed">{selectedItem.description}</p>
                
                <button
                  disabled={selectedItem.stock === 0}
                  onClick={(e) => {
                    handleAddToCart(e, selectedItem);
                    setSelectedItem(null);
                  }}
                  className="w-full py-3 rounded-xl bg-primary hover:bg-orange-600 text-white font-bold transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={18} />
                  {selectedItem.stock === 0 ? 'Habis' : 'Tambah ke Keranjang'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Muma Ramen Logo" className="h-12 w-12 rounded-xl object-cover shadow-[0_0_15px_rgba(231,123,38,0.3)]" />
            <div>
              <h1 className="text-xl font-bold text-text">Muma Ramen</h1>
              <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Premium Japanese</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/order/history')} className="p-2.5 text-text-muted hover:text-primary hover:bg-surface rounded-full transition">
              <Clock size={20} />
            </button>
            <button onClick={() => navigate('/order/cart')} className="relative p-2.5 text-text bg-surface hover:bg-surface-hover border border-border rounded-full transition flex items-center gap-2 px-5">
              <ShoppingCart size={18} />
              <span className="text-sm font-semibold">Keranjang</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-background">
                  {cartCount}
                </span>
              )}
            </button>
            <AvatarMenu />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Bento Box Hero Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <SpotlightCard className="md:col-span-2 p-8 md:p-12 flex flex-col justify-center relative overflow-hidden bg-gradient-to-br from-surface to-background">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">Makan Malam <br /><span className="text-primary">Lebih Nikmat</span></h2>
            <p className="text-text-muted text-lg max-w-md">Pesan ramen autentik Jepang favoritmu dengan mudah. Cepat, hangat, dan memuaskan.</p>

            <div className="mt-8 relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
              <input
                type="text"
                placeholder="Cari ramen, minuman, dll..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-border rounded-full py-4 pl-12 pr-6 text-text placeholder-text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-inner"
              />
            </div>
          </SpotlightCard>

          <div className="flex flex-col gap-6">
            <SpotlightCard className="p-6 flex-1 flex flex-col justify-center items-center text-center">
              <div className="w-12 h-12 bg-orange-500/10 text-primary rounded-full flex items-center justify-center mb-3">
                <MapPin size={24} />
              </div>
              <h3 className="font-bold text-lg">Muma Cibubur</h3>
              <p className="text-xs text-text-muted mt-1">Buka • 10:00 - 22:00</p>
            </SpotlightCard>

            <SpotlightCard className="p-6 flex-1 bg-[url('https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&q=80&w=600')] bg-cover bg-center">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
              <div className="relative z-10 h-full flex flex-col justify-end drop-shadow-md">
                <span className="text-xs font-bold bg-primary text-background px-2 py-1 rounded w-fit mb-2">PROMO</span>
                <h3 className="font-bold text-xl text-white">Diskon 20% Dine-In</h3>
              </div>
            </SpotlightCard>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${activeCategory === 'all' ? 'bg-primary border-primary text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-surface border-border/50 text-text-muted hover:text-primary hover:border-border'}`}
          >
            Semua Menu
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${activeCategory == cat.id ? 'bg-primary border-primary text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-surface border-border/50 text-text-muted hover:text-primary hover:border-border'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.length > 0 ? filtered.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="h-full"
            >
              <SpotlightCard className="h-full flex flex-col cursor-pointer" onClick={() => setSelectedItem(item)}>
                <MenuImageCarousel item={item} />
                <div className="p-5 flex-1 flex flex-col">
                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider mb-1">{item.category?.name}</span>
                  <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                  <p className="text-text-muted text-sm line-clamp-2 mb-6 flex-1">{item.description}</p>

                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-bold text-lg text-text">{formatPrice(item.price)}</span>
                    <button
                      disabled={item.stock === 0}
                      onClick={(e) => handleAddToCart(e, item)}
                      className="px-4 py-2 rounded-full bg-primary hover:bg-orange-600 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(249,115,22,0.2)] disabled:opacity-50 disabled:hover:bg-primary disabled:cursor-not-allowed"
                    >
                      <span>Tambah</span>
                    </button>
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          )) : (
            <div className="col-span-full py-20 text-center flex flex-col items-center">
              <Coffee className="w-16 h-16 text-text/10 mb-4" />
              <h3 className="text-xl font-bold mb-2">Menu tidak ditemukan</h3>
              <p className="text-text-muted">Coba gunakan kata kunci pencarian yang lain.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
