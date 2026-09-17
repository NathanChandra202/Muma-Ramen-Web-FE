import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth as authApi } from '../api';
import { login } from '../auth';
import { showToast } from '../components/utils';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });

  useEffect(() => {
    if (location.state?.tab) {
      setTab(location.state.tab);
    }
  }, [location.state]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authApi.login(formData.email, formData.password);
      login(data.token, data.user);
      showToast(`Welcome back, ${data.user.name}!`, 'success');
      
      const role = data.user.role;
      if (role === 'pembeli') navigate('/order/menu');
      else if (role === 'kasir') navigate('/pos/dashboard');
      else navigate('/core/dashboard');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.phone && formData.phone.length < 10) {
      showToast('Nomor telepon minimal 10 digit', 'warning');
      return;
    }
    if (formData.password.length < 6) {
      showToast('Password minimal 6 karakter', 'warning');
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.register(formData.name, formData.email, formData.phone, formData.password);
      login(data.token, data.user);
      showToast('Registration successful! 🍜', 'success');
      navigate('/order/menu');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { role: 'Pembeli', email: 'pembeli@mumaramen.com', pass: 'pembeli123', color: 'bg-amber-500/20 text-amber-500 border-amber-500/50' },
    { role: 'Kasir', email: 'kasir@mumaramen.com', pass: 'kasir123', color: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50' },
    { role: 'Admin', email: 'admin@mumaramen.com', pass: 'admin123', color: 'bg-blue-500/20 text-blue-500 border-blue-500/50' },
    { role: 'Superadmin', email: 'superadmin@mumaramen.com', pass: 'superadmin123', color: 'bg-purple-500/20 text-purple-500 border-purple-500/50' },
  ];

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background text-text">
      {/* Aurora Background (React Bits Style) */}
      <div className="absolute inset-[-50%] pointer-events-none opacity-40 mix-blend-screen"
           style={{
             backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(249, 115, 22, 0.15) 0%, transparent 40%), radial-gradient(circle at 20% 80%, rgba(239, 68, 68, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
             filter: 'blur(60px)',
             animation: 'spin 30s linear infinite'
           }}
      />
      
      {/* Glassmorphism Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md p-8 glass rounded-2xl shadow-2xl border border-border/50"
      >
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🍜</div>
          <h1 className="text-3xl font-extrabold tracking-tight text-glow shiny-text bg-clip-text text-transparent bg-gradient-to-r from-white via-primary to-white bg-[length:200%_auto]">
            Muma Ramen
          </h1>
          <p className="text-xs uppercase tracking-widest text-text-muted mt-2 font-semibold">
            Japanese Ramen House
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-surface-hover rounded-lg mb-8 border border-border/50">
          <button 
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${tab === 'login' ? 'bg-surface border border-border shadow-sm text-text' : 'text-text-muted hover:text-primary'}`}
            onClick={() => setTab('login')}
          >
            Masuk
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${tab === 'register' ? 'bg-surface border border-border shadow-sm text-text' : 'text-text-muted hover:text-primary'}`}
            onClick={() => setTab('register')}
          >
            Daftar
          </button>
        </div>

        {/* Forms */}
        <form onSubmit={tab === 'login' ? handleLogin : handleRegister} className="space-y-5">
          {tab === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Nama Lengkap</label>
                <input 
                  type="text" required 
                  className="w-full bg-surface-hover border border-border rounded-lg px-4 py-3 text-text placeholder-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Nama kamu"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Nomor Telepon</label>
                <input 
                  type="tel" required minLength="10"
                  className="w-full bg-surface-hover border border-border rounded-lg px-4 py-3 text-text placeholder-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Min 10 digit (0812...)"
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">
              {tab === 'login' ? 'Email / Nomor Telepon' : 'Email'}
            </label>
            <input 
              type={tab === 'login' ? 'text' : 'email'} required 
              className="w-full bg-surface-hover border border-border rounded-lg px-4 py-3 text-text placeholder-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="email@contoh.com"
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wide">Password</label>
            <input 
              type="password" required minLength="6"
              className="w-full bg-surface-hover border border-border rounded-lg px-4 py-3 text-text placeholder-text-muted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="Minimal 6 karakter"
              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-6 py-3 bg-primary hover:bg-orange-600 text-white font-semibold rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all flex items-center justify-center gap-2"
          >
            {loading ? <span className="animate-pulse">Memproses...</span> : (tab === 'login' ? 'Masuk Sekarang' : 'Daftar Sekarang')}
          </button>
        </form>

        {/* Demo Accounts */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-xs font-semibold text-text-muted mb-3 flex items-center gap-2">
            <span>✨</span> Demo Accounts
          </p>
          <div className="space-y-2">
            {demoAccounts.map(acc => (
              <div 
                key={acc.role} 
                onClick={() => {
                  setFormData({ ...formData, email: acc.email, password: acc.pass });
                  setTab('login');
                }}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-surface-hover transition border border-transparent hover:border-border"
              >
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${acc.color}`}>
                  {acc.role}
                </span>
                <code className="text-xs text-text-muted">{acc.email}</code>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
