import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orders as ordersApi } from '../../api';
import { showToast, formatPrice, formatDate, getStatusLabel, getOrderTypeLabel } from '../../components/utils';
import AvatarMenu from '../../components/AvatarMenu';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, CheckCircle, ChefHat, Package, CheckCircle2, Wallet } from 'lucide-react';

export default function TrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
    // Polling every 5 seconds
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchOrder = () => {
    ordersApi.get(id)
      .then(res => setOrder(res.order))
      .catch(err => {
        if (!order) showToast(err.message, 'error'); // only show error on initial load
      })
      .finally(() => setLoading(false));
  };

  if (loading && !order) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin-slow"></div></div>;
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text">
        <h2 className="text-2xl font-bold mb-4">Pesanan tidak ditemukan</h2>
        <button onClick={() => navigate('/order/history')} className="text-primary hover:underline">Kembali ke Riwayat</button>
      </div>
    );
  }

  const steps = [
    { status: 'unpaid', icon: Wallet, label: 'Bayar' },
    { status: 'pending', icon: Clock, label: 'Menunggu' },
    { status: 'preparing', icon: ChefHat, label: 'Disiapkan' },
    { status: 'ready', icon: Package, label: 'Siap' },
    { status: 'completed', icon: CheckCircle2, label: 'Selesai' },
  ];

  const currentStepIndex = steps.findIndex(s => s.status === order.status);

  return (
    <div className="min-h-screen bg-background text-text">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/order/menu')} className="p-2 text-text-muted hover:text-primary transition">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-text">Lacak Pesanan</h1>
              <p className="text-xs text-text-muted">Order {order.order_number}</p>
              <p className="text-sm font-bold mt-0.5 text-primary">{order.order_type === 'dine_in' ? 'Dine In' : 'Take Away'} {order.table_number && `- Meja ${order.table_number}`}</p>
            </div>
          </div>
          <AvatarMenu />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="glass rounded-3xl p-8 md:p-12 border border-border/50 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="flex flex-wrap justify-between items-end gap-6 mb-12 relative z-10">
            <div>
              <p className="text-text-muted font-semibold text-sm mb-1">{formatDate(order.created_at)}</p>
              <h2 className="text-4xl font-extrabold">{getOrderTypeLabel(order.order_type)}</h2>
              {order.table_number && <p className="text-primary font-bold mt-2 text-lg">Meja {order.table_number}</p>}
            </div>
            
            <div className="text-right">
              <p className="text-text-muted text-sm font-semibold mb-1">Total Pesanan</p>
              <p className="text-3xl font-bold text-text">{formatPrice(order.total_amount)}</p>
            </div>
          </div>

          {/* Timeline */}
          {order.status === 'cancelled' ? (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-2xl text-center mb-12">
              <span className="text-3xl block mb-2">❌</span>
              <h3 className="text-xl font-bold">Pesanan Dibatalkan</h3>
              <p className="text-sm mt-1 opacity-80">Pesanan ini telah dibatalkan oleh sistem atau kasir.</p>
            </div>
          ) : (
            <div className="relative mb-12 pt-8">
              <div className="absolute top-12 left-0 right-0 h-1 bg-surface rounded-full">
                <motion.div 
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              
              <div className="relative flex justify-between">
                {steps.map((step, i) => {
                  const Icon = step.icon;
                  const isActive = i <= currentStepIndex;
                  const isCurrent = i === currentStepIndex;
                  
                  return (
                    <div key={step.status} className="flex flex-col items-center gap-3 relative z-10 w-24">
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: isActive ? 1 : 0.8, opacity: isActive ? 1 : 0.5 }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-500 ${isActive ? 'bg-primary border-primary text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-surface border-border text-text-muted'}`}
                      >
                        <Icon size={18} />
                      </motion.div>
                      <span className={`text-xs font-bold text-center ${isActive ? 'text-text' : 'text-text-muted'}`}>
                        {step.label}
                      </span>
                      {isCurrent && (
                        <motion.span 
                          layoutId="active-ping"
                          className="absolute -top-1 -right-1 flex h-3 w-3"
                        >
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                        </motion.span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="border-t border-border pt-8 relative z-10">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-sm">🍜</span>
              Detail Item
            </h3>
            <div className="space-y-4">
              {order.items?.map(item => (
                <div key={item.id} className="flex justify-between items-center p-4 bg-surface-hover/50 rounded-xl">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-surface text-text rounded font-bold text-xs flex items-center justify-center border border-border">{item.quantity}x</span>
                      <h4 className="font-semibold">{item.menu_item?.name || 'Item Terhapus'}</h4>
                    </div>
                    {item.notes && <p className="text-xs text-text-muted ml-9 mt-1 italic">"{item.notes}"</p>}
                  </div>
                  <p className="font-bold">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
