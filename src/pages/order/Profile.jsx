import { useState, useEffect } from 'react';
import { auth, users } from '../../api';
import { logout } from '../../auth';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await auth.me();
      setProfile({
        name: res.user.name || '',
        email: res.user.email || '',
        phone: res.user.phone || ''
      });
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal memuat profil' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await users.updateProfile(profile);
      setMessage({ type: 'success', text: 'Profil berhasil diperbarui' });
      // Update local storage user info
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        localStorage.setItem('user', JSON.stringify({ ...user, phone: profile.phone }));
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Gagal menyimpan profil' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) return <div className="p-8 text-center text-text-muted">Loading...</div>;

  return (
    <div className="max-w-xl mx-auto mt-8 p-6 bg-surface rounded-xl border border-border">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-hover text-text hover:bg-border transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-text">Profil Saya</h2>
      </div>
      
      {message.text && (
        <div className={`p-4 rounded-lg mb-6 ${message.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">Nama Lengkap</label>
          <input 
            type="text" 
            value={profile.name}
            onChange={(e) => setProfile({...profile, name: e.target.value})}
            className="w-full bg-background border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            required 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">Email</label>
          <input 
            type="email" 
            value={profile.email}
            onChange={(e) => setProfile({...profile, email: e.target.value})}
            className="w-full bg-background border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            required 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">Nomor Telepon (Wajib untuk Order)</label>
          <input 
            type="tel" 
            value={profile.phone}
            onChange={(e) => setProfile({...profile, phone: e.target.value})}
            className="w-full bg-background border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            required 
            placeholder="Contoh: 08123456789"
          />
        </div>

        <button 
          type="submit" 
          disabled={saving}
          className="w-full py-3 bg-primary hover:bg-orange-600 text-white rounded-lg font-bold transition-colors disabled:opacity-50 mt-4"
        >
          {saving ? 'Menyimpan...' : 'Simpan Profil'}
        </button>

        <button 
          type="button" 
          onClick={handleLogout}
          className="w-full py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg font-bold transition-colors mt-4 border border-red-500/20 hover:border-transparent"
        >
          Logout
        </button>
      </form>
    </div>
  );
}

export default ProfilePage;
