import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orders as ordersApi } from '../../api';
import { showToast, formatPrice, formatDate, getStatusLabel, getOrderTypeLabel } from '../../components/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, History as HistoryIcon, Search, ChevronRight } from 'lucide-react';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [ordersList, setOrdersList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.list()
      .then(res => setOrdersList(res.orders || []))
      .catch(err => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'ready': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-background text-text">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center gap-4">
          <button onClick={() => navigate('/order/menu')} className="p-2 text-text-muted hover:text-primary transition">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-3">
            <HistoryIcon className="text-primary" size={24} />
            <h1 className="text-xl font-bold">Riwayat Pesanan</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin-slow"></div>
          </div>
        ) : ordersList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <HistoryIcon size={64} className="text-text/5 mb-6" />
            <h2 className="text-2xl font-bold mb-2">Belum ada pesanan</h2>
            <p className="text-text-muted">Kamu belum pernah memesan apapun.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ordersList.map((order, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={order.id}
                onClick={() => navigate(`/order/tracking/${order.id}`)}
                className="group p-6 bg-surface border border-border hover:border-primary/50 rounded-2xl cursor-pointer transition-all flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center hover:shadow-[0_0_30px_rgba(249,115,22,0.1)]"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold text-text-muted">#{order.id}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-1">{getOrderTypeLabel(order.order_type)} {order.table_number && `• Meja ${order.table_number}`}</h3>
                  <p className="text-sm text-text-muted">{formatDate(order.created_at)}</p>
                </div>

                <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-text-muted mb-1">Total</p>
                    <p className="font-bold text-xl text-text">{formatPrice(order.total_amount)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-primary transition">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
